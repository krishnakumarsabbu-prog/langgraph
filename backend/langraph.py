from __future__ import annotations
import os
import re
import json
import uuid
import copy
import logging
import datetime as dt
from typing import Any, Dict, List, Optional
import requests

PARALLEL_BRANCH_TIMEOUT_S: float = float(os.getenv("PARALLEL_BRANCH_TIMEOUT_S", "300"))

from simpleeval import simple_eval
from langgraph.graph import StateGraph, END
from langgraph.types import Send

from db import (
    save_workflow_execution,
    save_node_execution,
    update_service_metrics,
    get_node_status_map,
    get_latest_flow as db_get_latest_flow,
    NotFoundError,
    DBError,
)

logger = logging.getLogger("langgraph")
if not logger.handlers:
    h = logging.StreamHandler()
    h.setFormatter(logging.Formatter(
        fmt="%(asctime)s.%(msecs)03d %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    logger.addHandler(h)
logger.setLevel(logging.INFO)

# ==============================================================================
# Helpers: deep_get / render_template / _validate_service_url
# ==============================================================================

def deep_get(data: Dict[str, Any], path: str) -> Any:
    if not path:
        return data
    parts = re.split(r'\.(?![^\[]*\])', path)
    for part in parts:
        match = re.findall(r'([^\[\]]+)|\[(\d+)\]', part)
        for key, index in match:
            if key:
                if isinstance(data, dict):
                    data = data.get(key)
                else:
                    return None
            elif index is not None:
                if isinstance(data, list):
                    try:
                        data = data[int(index)]
                    except (IndexError, ValueError):
                        return None
                else:
                    return None
            if data is None:
                return None
    return data


def render_template(obj: Any, context: Dict[str, Any]) -> Any:
    if isinstance(obj, str):
        matches = re.findall(r"\{([^{}]+)\}", obj)
        for m in matches:
            val = deep_get(context, m.strip())
            if val is not None:
                obj = obj.replace("{" + m + "}", str(val))
        return obj
    elif isinstance(obj, dict):
        return {k: render_template(v, context) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [render_template(v, context) for v in obj]
    return obj


def _validate_service_url(url: str) -> None:
    if not url:
        raise ValueError("Service node URL is required")
    if not (url.startswith("http://") or url.startswith("https://")):
        raise ValueError("Service node URL must start with http:// or https://")
    allowlist = os.getenv("SERVICE_URL_ALLOWLIST")
    if allowlist:
        hosts = [h.strip() for h in allowlist.split(",") if h.strip()]
        from urllib.parse import urlparse
        host = urlparse(url).netloc
        if host not in hosts:
            raise ValueError(f"Service URL host '{host}' is not in allowlist: {hosts}")


# ==============================================================================
# Parallel state helpers
#
# state["_parallel"][parallel_id] = {
#     "expected":   ["branch-a", "branch-b"],   # set once in parallel run_fn
#     "completed":  ["branch-a"],               # grows as branches finish
#     "results":    {"branch-a": {...}},         # per-branch output snapshot
#     "started_at": <iso-timestamp>,            # for timeout detection
#     "merged":     False,                      # idempotency guard for merge
# }
#
# Rules:
#   - Initialised ONCE in the parallel node's run_fn (not in the router).
#   - Router performs a lightweight copy: shallow-copies the top-level state
#     dict and deep-copies only the `_parallel` sub-key so every branch starts
#     with the same tracking context but cannot corrupt sibling branches.
#   - _mark_branch_completed is idempotent — safe for retries / double-delivery.
#   - Merge checks `merged` flag before executing to prevent re-execution if
#     LangGraph re-invokes the node after it already completed.
#   - After merge succeeds the context is cleaned up to avoid memory growth.
# ==============================================================================

def _init_parallel_context(state: Dict[str, Any], parallel_id: str, branch_targets: List[str]) -> None:
    """Initialise context for a parallel block. Called ONCE in parallel run_fn."""
    if "_parallel" not in state:
        state["_parallel"] = {}
    state["_parallel"][parallel_id] = {
        "expected": list(branch_targets),
        "completed": [],
        "results": {},
        "started_at": dt.datetime.utcnow().isoformat(),
        "merged": False,
    }


def _branch_state_copy(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Efficient branch-safe copy.

    Shallow-copies the top-level state dict (O(n) keys, avoids deep-copying
    large user payloads) and deep-copies only the `_parallel` tracking structure
    so each branch has an isolated view of completion tracking without paying
    the full deepcopy cost.
    """
    branch = {k: v for k, v in state.items() if k != "_parallel"}
    if "_parallel" in state:
        branch["_parallel"] = copy.deepcopy(state["_parallel"])
    return branch


def _mark_branch_completed(state: Dict[str, Any], parallel_id: str, branch_node_id: str) -> None:
    """Idempotent: safe to call multiple times for the same branch (retries)."""
    pctx = state.get("_parallel", {}).get(parallel_id)
    if pctx is None:
        return
    if branch_node_id not in pctx["completed"]:
        pctx["completed"].append(branch_node_id)
    pctx["results"][branch_node_id] = state.get(branch_node_id)


def _all_branches_done(state: Dict[str, Any], parallel_id: str) -> bool:
    pctx = state.get("_parallel", {}).get(parallel_id)
    if not pctx:
        return False
    return set(pctx["expected"]).issubset(set(pctx["completed"]))


def _check_branch_timeout(state: Dict[str, Any], parallel_id: str) -> Optional[List[str]]:
    """
    Returns list of timed-out branch node IDs if PARALLEL_BRANCH_TIMEOUT_S has
    elapsed since the parallel block started, otherwise returns None.
    """
    pctx = state.get("_parallel", {}).get(parallel_id)
    if not pctx:
        return None
    started_at_str = pctx.get("started_at")
    if not started_at_str:
        return None
    elapsed = (dt.datetime.utcnow() - dt.datetime.fromisoformat(started_at_str)).total_seconds()
    if elapsed < PARALLEL_BRANCH_TIMEOUT_S:
        return None
    expected = set(pctx["expected"])
    completed = set(pctx["completed"])
    return list(expected - completed)


def _cleanup_parallel_context(state: Dict[str, Any], parallel_id: str) -> None:
    """Remove parallel tracking data after merge completes to prevent memory growth."""
    parallel_ns = state.get("_parallel")
    if parallel_ns and parallel_id in parallel_ns:
        del parallel_ns[parallel_id]
        if not parallel_ns:
            del state["_parallel"]


# ==============================================================================
# Node: Service Node
# ==============================================================================

def make_service_node(node_data: Dict[str, Any], execution_id: str, parallel_id: Optional[str] = None):
    data_cfg = node_data.get("data", {})
    url = data_cfg.get("url")
    method = data_cfg.get("method", "POST").upper()

    headers_config = data_cfg.get("config", {}).get("headers", [])
    headers = {
        h.get("key"): h.get("value")
        for h in headers_config
        if h.get("key") and h.get("value")
    }

    is_xml = any(
        (h.get("key", "").lower() == "content-type")
        and ("xml" in h.get("value", "").lower())
        for h in headers_config
    )

    request_body_raw = data_cfg.get("config", {}).get("requestBody", "{}")

    if is_xml:
        request_template: Any = request_body_raw if isinstance(request_body_raw, str) else str(request_body_raw)
    else:
        if isinstance(request_body_raw, str):
            try:
                request_template = json.loads(request_body_raw)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON requestBody for node {node_data.get('id')}: {e}")
        else:
            request_template = request_body_raw

    mappings = data_cfg.get("mappings", [])

    def run_fn(state: Dict[str, Any]):
        start_time = dt.datetime.utcnow()
        node_id = node_data["id"]
        node_label = data_cfg.get("label", node_id)

        try:
            _validate_service_url(url)
        except Exception as e:
            logger.error("[%s] URL validation failed: %s", node_label, e)
            save_node_execution(
                execution_id, node_id, node_type="service", node_label=node_label,
                status="failed", request_data=None, response_data={"error": str(e)},
                error_msg=str(e), exec_time=0
            )
            update_service_metrics(node_id, success=False, exec_time_ms=0)
            state[node_id] = {"error": str(e)}
            if parallel_id:
                _mark_branch_completed(state, parallel_id, node_id)
            return state

        payload = render_template(copy.deepcopy(request_template), state)

        if isinstance(payload, dict):
            for m in mappings:
                source = m.get("source")
                target = m.get("target")
                transform = m.get("transform")
                val = deep_get(state, source)
                if val is not None:
                    if transform == "upper":
                        val = str(val).upper()
                    elif transform == "lower":
                        val = str(val).lower()
                    elif transform == "strip":
                        val = str(val).strip()
                    parts = target.split(".") if target else []
                    sub = payload
                    for p in parts[:-1]:
                        if p not in sub or not isinstance(sub[p], dict):
                            sub[p] = {}
                        sub = sub[p]
                    if parts:
                        sub[parts[-1]] = val

        ok = False
        error_msg = None
        resp_data: Dict[str, Any] = {}

        try:
            if is_xml:
                resp = requests.request(method, url, data=payload, headers=headers, timeout=15)
            else:
                resp = requests.request(method, url, json=payload, headers=headers, timeout=15)

            if resp.ok:
                try:
                    resp_data = resp.json()
                except ValueError:
                    resp_data = {"raw": resp.text}
                ok = True
            else:
                resp_data = {"error": resp.text, "status_code": resp.status_code}
                error_msg = resp.text
        except Exception as e:
            resp_data = {"error": str(e)}
            error_msg = str(e)

        exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)

        save_node_execution(
            execution_id, node_id, node_type="service", node_label=node_label,
            status="completed" if ok else "failed", request_data=payload,
            response_data=resp_data, error_msg=error_msg, exec_time=exec_time
        )
        update_service_metrics(node_id, ok, exec_time)

        state[node_id] = {
            "request": payload,
            "response": resp_data,
            "_metrics": {"last_exec_ms": exec_time, "success": ok},
        }

        # Register completion in parallel context if this node is a branch node
        if parallel_id:
            _mark_branch_completed(state, parallel_id, node_id)

        logger.info("[service:%s] ok=%s time_ms=%s", node_label, ok, exec_time)
        return state

    return run_fn


# ==============================================================================
# Node: Decision Node
# ==============================================================================

def make_decision_node(node_data: Dict[str, Any], execution_id: str, parallel_id: Optional[str] = None):
    data_cfg = node_data.get("data", {})
    rules = data_cfg.get("rules", [])
    script = data_cfg.get("script")

    def run_fn(state: Dict[str, Any]):
        start_time = dt.datetime.utcnow()
        node_id = node_data["id"]
        node_label = data_cfg.get("label", node_id)

        new_state = state.copy()
        actions_taken = []
        names = {"state": new_state, "input": new_state.get("input", {})}

        if rules:
            for rule in rules or []:
                cond = rule.get("condition")
                try:
                    if bool(simple_eval(cond, names=names)):
                        action = rule.get("action", {})
                        if isinstance(action, dict):
                            new_state.update(action)
                            actions_taken.append({"condition": cond, "action": action})
                except Exception as e:
                    logger.warning("[decision:%s] Condition error: %s", node_label, e)

        if script:
            try:
                local_env = {"state": new_state}
                exec(script, {}, local_env)
                new_state = local_env.get("state", new_state)
            except Exception as e:
                logger.warning("[decision:%s] Script error: %s", node_label, e)

        exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)

        save_node_execution(
            execution_id, node_id, node_type="decision", node_label=node_label,
            status="completed", request_data={"rules": rules, "script": script},
            response_data={"actions_taken": actions_taken},
            error_msg=None, exec_time=exec_time
        )
        update_service_metrics(node_id, success=True, exec_time=exec_time)

        new_state[node_id] = {
            "request": {"rules": rules, "script": script},
            "response": {"actions_taken": actions_taken},
            "_metrics": {"last_exec_ms": exec_time, "success": True},
        }

        if parallel_id:
            _mark_branch_completed(new_state, parallel_id, node_id)

        logger.info("[decision:%s] actions=%d time_ms=%s", node_label, len(actions_taken), exec_time)
        return new_state

    return run_fn


# ==============================================================================
# Node: Form Node
# ==============================================================================

def make_form_node(node_data: Dict[str, Any], execution_id: str, parallel_id: Optional[str] = None):
    node_id = node_data["id"]
    data_cfg = node_data.get("data", {})
    node_label = data_cfg.get("label", node_id)
    form_schema = data_cfg.get("schema", {})
    custom_data = data_cfg

    def run_fn(state: Dict[str, Any]):
        save_node_execution(
            execution_id, node_id, node_type="form", node_label=node_label,
            status="paused", request_data={"form_schema": form_schema},
            response_data=None, error_msg=None, exec_time_ms=0
        )
        state["paused_at_form"] = {
            "node_id": node_id,
            "execution_id": execution_id,
            "data": custom_data,
        }
        logger.info("[form:%s] Workflow paused", node_label)
        return state

    return run_fn


# ==============================================================================
# Node: Sub-workflow Node
# ==============================================================================

def make_subworkflow_node(node_data: Dict[str, Any], execution_id: str, parallel_id: Optional[str] = None):
    node_id = node_data["id"]
    data_cfg = node_data.get("data", {})
    node_label = data_cfg.get("label", node_id)
    sub_workflow_name = data_cfg.get("selectedWorkflowName", node_id)

    def run_fn(state: Dict[str, Any]):
        start_time = dt.datetime.utcnow()
        parent_state = state

        def _fail(msg: str, exec_time_ms: int = 0):
            save_node_execution(
                execution_id, node_id, node_type="subworkflow", node_label=node_label,
                status="failed", request_data=None, response_data={"error": msg},
                error_msg=msg, exec_time_ms=exec_time_ms
            )
            update_service_metrics(node_id, success=False, exec_time_ms=exec_time_ms)
            parent_state[node_id] = {"error": msg}
            if parallel_id:
                _mark_branch_completed(parent_state, parallel_id, node_id)
            return parent_state

        try:
            response_data = db_get_latest_flow(sub_workflow_name)
            subgraph = response_data.get("data", {}).get("graph")
        except NotFoundError:
            logger.error("[subworkflow:%s] Subgraph '%s' not found", node_label, sub_workflow_name)
            return _fail("No subgraph provided")
        except DBError as e:
            logger.error("[subworkflow:%s] DB error: %s", node_label, e)
            return _fail(str(e))

        if not subgraph:
            logger.error("[subworkflow:%s] Empty subgraph for '%s'", node_label, sub_workflow_name)
            return _fail("Empty subgraph")

        sub_execution_id = str(uuid.uuid4())
        sub_state = {"input": parent_state.get("input", {})}

        entry_node_id = subgraph.get("nodes", [{}])[0].get("id") if subgraph.get("nodes") else None
        save_workflow_execution(
            sub_execution_id, node_label or "subworkflow", status="running",
            entry_node_id=entry_node_id, state=sub_state, workflow_graph=subgraph,
            parent_execution_id=execution_id
        )

        try:
            sub_graph = build_graph_from_json(subgraph, sub_execution_id)
            sub_result = sub_graph.invoke(sub_state)

            last_node_id = subgraph.get("nodes", [{}])[-1].get("id") if subgraph.get("nodes") else None
            save_workflow_execution(
                sub_execution_id, node_label or "subworkflow", status="completed",
                last_node_id=last_node_id, state=sub_result, workflow_graph=subgraph,
                parent_execution_id=execution_id
            )

            exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)
            save_node_execution(
                execution_id, node_id, node_type="subworkflow", node_label=node_label,
                status="completed", request_data={"sub_execution_id": sub_execution_id},
                response_data=sub_result, error_msg=None, exec_time=exec_time
            )
            update_service_metrics(node_id, success=True, exec_time=exec_time)

            parent_state[node_id] = {
                "sub_execution_id": sub_execution_id,
                "request": sub_state,
                "response": sub_result,
                "_metrics": {"last_exec_ms": exec_time, "success": True},
            }

            if parallel_id:
                _mark_branch_completed(parent_state, parallel_id, node_id)

            logger.info("[subworkflow:%s] Completed child execution=%s", node_label, sub_execution_id)
            return parent_state

        except Exception as e:
            save_workflow_execution(
                sub_execution_id, node_label or "subworkflow", status="failed",
                current_node_id="unknown", state={"error": str(e)}, workflow_graph=subgraph,
                parent_execution_id=execution_id
            )
            logger.exception("[subworkflow:%s] Exception: %s", node_label, e)
            return _fail(str(e))

    return run_fn


# ==============================================================================
# Node: Parallel Node
#
# Lifecycle:
#   1. run_fn  — records execution metrics AND initialises the namespaced
#                _parallel[node_id] context (expected branches, timestamps,
#                merged=False guard).  This is the ONLY place init happens.
#   2. router  — attached via add_conditional_edges.  Uses _branch_state_copy
#                (shallow copy of user payload + deepcopy of only the _parallel
#                tracking dict) so branches are isolated without the full cost
#                of copy.deepcopy on arbitrarily large states.  Does NOT
#                re-initialise the context — reads what run_fn already set.
#
# Multiple parallel blocks are fully isolated: each uses its own node_id as
# the namespace key in state["_parallel"].
#
# Frontend data shape:
#   { id: "parallel-1", type: "parallel", data: { label: "...", outputCount: N } }
# ==============================================================================

def make_parallel_node(node_data: Dict[str, Any], execution_id: str, branch_targets: List[str]):
    node_id = node_data["id"]
    data_cfg = node_data.get("data", {})
    node_label = data_cfg.get("label", node_id)
    output_count = int(data_cfg.get("outputCount", 2))

    def run_fn(state: Dict[str, Any]):
        start_time = dt.datetime.utcnow()

        # Initialise parallel context HERE — once — before the router fires
        _init_parallel_context(state, node_id, branch_targets)

        exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)

        save_node_execution(
            execution_id, node_id, node_type="parallel", node_label=node_label,
            status="completed",
            request_data={"output_count": output_count, "branches": branch_targets},
            response_data={"branching": True},
            error_msg=None, exec_time=exec_time
        )
        update_service_metrics(node_id, success=True, exec_time=exec_time)

        state[node_id] = {
            "response": {"branching": True, "output_count": output_count},
            "_metrics": {"last_exec_ms": exec_time, "success": True},
        }

        logger.info(
            "[parallel:%s] initialised fan-out, branches=%s",
            node_label, branch_targets
        )
        return state

    return run_fn


def make_parallel_router(parallel_id: str, branch_targets: List[str]):
    """
    Router attached as a conditional edge FROM the parallel node.

    Uses _branch_state_copy per branch:
      - shallow-copies all user payload keys (avoids expensive deepcopy)
      - deep-copies only the _parallel tracking dict so each branch has an
        independent view of completion state
    Does NOT re-initialise the context — that was already done in run_fn.
    """
    def router(state: Dict[str, Any]) -> List[Send]:
        sends: List[Send] = []
        for target in branch_targets:
            branch_state = _branch_state_copy(state)
            sends.append(Send(target, branch_state))

        logger.info(
            "[parallel-router:%s] fan-out -> %s (%d branches)",
            parallel_id, branch_targets, len(branch_targets)
        )
        return sends

    return router


# ==============================================================================
# Node: Merge Node
#
# Fan-in collector with barrier, idempotency guard, timeout soft-fail, and
# post-merge cleanup.
#
# Runtime flow:
#   1. Idempotency guard — if state[node_id] already exists with a "merged"
#      key the node returns immediately.  Protects against LangGraph re-invoking
#      the node after it already completed.
#   2. Timeout check — if PARALLEL_BRANCH_TIMEOUT_S has elapsed since the
#      parallel block started, any still-pending branches are soft-failed with
#      a sentinel error value so the graph can continue rather than hang forever.
#   3. Barrier check — if not all expected branches are done, return state
#      unchanged so LangGraph can re-invoke when the next branch reports in.
#   4. Merge — collects branch results from _parallel[parallel_id]["results"],
#      with a fallback to reading directly from state for any branch that wrote
#      its result without going through _mark_branch_completed.
#   5. Cleanup — removes state["_parallel"][parallel_id] after a successful
#      merge to prevent unbounded memory growth in long workflows.
#
# Frontend data shape:
#   { id: "merge-1", type: "merge", data: { label: "...", inputCount: N } }
# ==============================================================================

def make_merge_node(
    node_data: Dict[str, Any],
    execution_id: str,
    parallel_id: str,
    upstream_node_ids: List[str],
):
    node_id = node_data["id"]
    data_cfg = node_data.get("data", {})
    node_label = data_cfg.get("label", node_id)
    input_count = int(data_cfg.get("inputCount", 2))

    def run_fn(state: Dict[str, Any]):
        start_time = dt.datetime.utcnow()

        # --- Fix 3: Idempotency guard ---
        existing = state.get(node_id)
        if isinstance(existing, dict) and existing.get("_merged"):
            logger.info("[merge:%s] already merged — skipping re-execution", node_label)
            return state

        # --- Fix 5: Timeout soft-fail ---
        timed_out = _check_branch_timeout(state, parallel_id)
        if timed_out:
            logger.warning(
                "[merge:%s] timeout — soft-failing stuck branches: %s",
                node_label, timed_out
            )
            pctx = state.get("_parallel", {}).get(parallel_id, {})
            for stuck_id in timed_out:
                pctx.setdefault("results", {})[stuck_id] = {
                    "error": "branch_timeout",
                    "branch_node_id": stuck_id,
                }
                if stuck_id not in pctx.get("completed", []):
                    pctx.setdefault("completed", []).append(stuck_id)

        # --- Fix 3: Barrier check (after potential timeout promotion) ---
        if not _all_branches_done(state, parallel_id):
            pctx = state.get("_parallel", {}).get(parallel_id, {})
            logger.info(
                "[merge:%s] barrier waiting — completed=%s expected=%s",
                node_label,
                pctx.get("completed", []),
                pctx.get("expected", []),
            )
            return state

        # Collect results from the namespaced parallel context
        pctx = state["_parallel"][parallel_id]
        merged_results: Dict[str, Any] = dict(pctx.get("results", {}))

        # Fallback: pick up any upstream result written directly to state
        # (handles branch nodes that executed before _mark_branch_completed was added)
        for uid in upstream_node_ids:
            if uid not in merged_results:
                merged_results[uid] = state.get(uid)

        exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)

        save_node_execution(
            execution_id, node_id, node_type="merge", node_label=node_label,
            status="completed",
            request_data={
                "parallel_id": parallel_id,
                "upstream_nodes": upstream_node_ids,
                "input_count": input_count,
            },
            response_data={"merged": merged_results},
            error_msg=None, exec_time=exec_time
        )
        update_service_metrics(node_id, success=True, exec_time=exec_time)

        # _merged=True acts as the idempotency sentinel on re-invocation
        state[node_id] = {
            "response": {"merged": merged_results},
            "_metrics": {"last_exec_ms": exec_time, "success": True},
            "_merged": True,
        }

        # --- Fix 6: Cleanup parallel context to prevent memory growth ---
        _cleanup_parallel_context(state, parallel_id)

        logger.info(
            "[merge:%s] barrier passed — merged %d branches from parallel=%s",
            node_label, len(merged_results), parallel_id
        )
        return state

    return run_fn


# ==============================================================================
# Node factory
# (parallel / merge are registered separately in build_graph_from_json because
#  they need topology context that is not available at factory-call time)
# ==============================================================================

NODE_FACTORY = {
    "service": make_service_node,
    "decision": make_decision_node,
    "form": make_form_node,
    "workflow": make_subworkflow_node,
}


# ==============================================================================
# Graph builder
# ==============================================================================

def build_graph_from_json(graph_json: Dict[str, Any], execution_id: str):
    g = StateGraph(dict)

    node_status_map = get_node_status_map(execution_id)

    temp_graph_json: Dict[str, Any] = {"nodes": [], "edges": []}
    current_pause_form_id: Optional[str] = None

    # ------------------------------------------------------------------
    # Pre-compute topology
    # ------------------------------------------------------------------

    all_edges: List[Dict[str, Any]] = graph_json.get("edges", [])

    # node_id -> list of target node_ids
    edges_out: Dict[str, List[str]] = {}
    # node_id -> list of source node_ids
    edges_in: Dict[str, List[str]] = {}

    for e in all_edges:
        src = e.get("source")
        tgt = e.get("target")
        if src and tgt:
            edges_out.setdefault(src, []).append(tgt)
            edges_in.setdefault(tgt, []).append(src)

    # Quick type lookup: node_id -> type string
    node_type_map: Dict[str, str] = {
        n["id"]: n.get("type", "") for n in graph_json.get("nodes", [])
    }

    # ------------------------------------------------------------------
    # Determine which parallel node "owns" each branch node.
    #
    # A branch node is any node that is a direct successor of a parallel node.
    # We walk the edge list and record:
    #   branch_to_parallel: node_id -> parallel_node_id
    #
    # For merge nodes we also record which parallel block they belong to by
    # finding the parallel ancestor reachable through their incoming edges.
    # ------------------------------------------------------------------

    branch_to_parallel: Dict[str, str] = {}
    for src, targets in edges_out.items():
        if node_type_map.get(src) == "parallel":
            for tgt in targets:
                branch_to_parallel[tgt] = src

    # For merge nodes: find the parallel node that feeds into them by tracing
    # backwards through immediate predecessors of the merge node.
    merge_to_parallel: Dict[str, str] = {}
    for node in graph_json.get("nodes", []):
        if node.get("type") != "merge":
            continue
        nid = node["id"]
        upstream = edges_in.get(nid, [])
        for up in upstream:
            pid = branch_to_parallel.get(up)
            if pid:
                merge_to_parallel[nid] = pid
                break
        # Fallback: if a branch node connects directly from the parallel
        if nid not in merge_to_parallel:
            for up in upstream:
                if node_type_map.get(up) == "parallel":
                    merge_to_parallel[nid] = up
                    break

    # ------------------------------------------------------------------
    # Register nodes (skip completed)
    # ------------------------------------------------------------------

    for node in graph_json.get("nodes", []):
        node_id = node.get("id")
        ntype = node.get("type")

        if node_status_map.get(node_id) == "completed":
            logger.debug("Skipping completed node: %s", node_id)
            continue

        if ntype == "parallel":
            # Pass branch_targets at build time so run_fn can init context
            parallel_branch_targets = [
                t for t in edges_out.get(node_id, [])
                if t in {n["id"] for n in graph_json.get("nodes", [])}
            ]
            func = make_parallel_node(node, execution_id, branch_targets=parallel_branch_targets)
            g.add_node(node_id, func)

        elif ntype == "merge":
            pid = merge_to_parallel.get(node_id, "")
            upstream_ids = edges_in.get(node_id, [])
            func = make_merge_node(node, execution_id, parallel_id=pid, upstream_node_ids=upstream_ids)
            g.add_node(node_id, func)

        elif ntype in NODE_FACTORY:
            pid = branch_to_parallel.get(node_id)
            func = NODE_FACTORY[ntype](node, execution_id, parallel_id=pid)
            g.add_node(node_id, func)

            if ntype == "form":
                current_pause_form_id = node_id
                temp_graph_json["nodes"].append(node)
                break
        else:
            raise Exception(f"Unknown node type: {ntype}")

        temp_graph_json["nodes"].append(node)

    # ------------------------------------------------------------------
    # Keep only edges between registered nodes
    # ------------------------------------------------------------------

    valid_node_ids = {n["id"] for n in temp_graph_json["nodes"]}
    for e in all_edges:
        if e.get("source") in valid_node_ids and e.get("target") in valid_node_ids:
            temp_graph_json["edges"].append(e)

    # ------------------------------------------------------------------
    # Wire edges grouped by source
    # ------------------------------------------------------------------

    edges_by_source: Dict[str, List[Dict[str, Any]]] = {}
    for e in temp_graph_json.get("edges", []):
        if current_pause_form_id and e.get("source") == current_pause_form_id:
            continue
        edges_by_source.setdefault(e.get("source"), []).append(e)

    for source, edges in edges_by_source.items():
        src_type = node_type_map.get(source, "")

        # ---- Parallel node: fan-out via Send ----
        if src_type == "parallel":
            branch_targets: List[str] = []
            seen: set = set()
            for e in edges:
                tgt = e.get("target")
                if tgt and tgt not in seen:
                    branch_targets.append(tgt)
                    seen.add(tgt)

            router = make_parallel_router(source, branch_targets)
            path_map = {tgt: tgt for tgt in branch_targets}
            path_map[END] = END
            g.add_conditional_edges(source, router, path_map)
            logger.info("[build] Parallel fan-out: %s -> %s", source, branch_targets)

        # ---- Conditional edges (decision / rule-based routing) ----
        elif any(e.get("condition") for e in edges):
            def conditional_fn(state, edges=edges):
                for edge in edges:
                    cond = edge.get("condition")
                    if not cond:
                        continue
                    try:
                        if bool(simple_eval(cond, names={"state": state, "input": state.get("input", {})})):
                            return edge.get("target")
                    except Exception as ex:
                        logger.warning("Condition eval error at edge %s: %s", edge, ex)
                for e in edges:
                    if not e.get("condition"):
                        return e.get("target")
                return END

            g.add_conditional_edges(source, conditional_fn)

        # ---- Normal sequential edges ----
        else:
            for e in edges:
                g.add_edge(e.get("source"), e.get("target"))

    # ------------------------------------------------------------------
    # Entry point and terminal edges
    # ------------------------------------------------------------------

    if temp_graph_json.get("nodes"):
        entry = temp_graph_json["nodes"][0]["id"]
        g.set_entry_point(entry)

        if current_pause_form_id:
            g.add_edge(current_pause_form_id, END)
        else:
            last = temp_graph_json["nodes"][-1]["id"]
            last_type = node_type_map.get(last)
            # Parallel nodes wire themselves via the router; don't add a duplicate END edge
            if last_type != "parallel":
                g.add_edge(last, END)
    else:
        g.set_entry_point(END)

    logger.debug(
        "Graph compiled (nodes=%d, edges=%d)",
        len(temp_graph_json["nodes"]),
        len(temp_graph_json["edges"]),
    )

    return g.compile()


__all__ = [
    "deep_get",
    "render_template",
    "make_service_node",
    "make_decision_node",
    "make_form_node",
    "make_subworkflow_node",
    "make_parallel_node",
    "make_parallel_router",
    "make_merge_node",
    "NODE_FACTORY",
    "build_graph_from_json",
]
