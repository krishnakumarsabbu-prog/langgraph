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
# Helpers: deep_get / render_template
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
# Node: Service Node
# ==============================================================================

def make_service_node(node_data: Dict[str, Any], execution_id: str):
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
                status="failed", request_data=None, response_data={"error": str(e)}, error_msg=str(e), exec_time=0
            )
            update_service_metrics(node_id, success=False, exec_time_ms=0)
            state[node_id] = {"error": str(e)}
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
                ok = False
        except Exception as e:
            resp_data = {"error": str(e)}
            error_msg = str(e)
            ok = False

        exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)

        save_node_execution(
            execution_id, node_id, node_type="service", node_label=node_label,
            status="completed" if ok else "failed", request_data=payload, response_data=resp_data,
            error_msg=error_msg, exec_time=exec_time
        )
        update_service_metrics(node_id, ok, exec_time)

        state[node_id] = {
            "request": payload,
            "response": resp_data,
            "_metrics": {"last_exec_ms": exec_time, "success": ok},
        }

        logger.info("[service:%s] ok=%s time_ms=%s", node_label, ok, exec_time)
        return state

    return run_fn

# ==============================================================================
# Node: Decision Node
# ==============================================================================

def make_decision_node(node_data: Dict[str, Any], execution_id: str):
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

        logger.info("[decision:%s] actions=%d time_ms=%s", node_label, len(actions_taken), exec_time)
        return new_state

    return run_fn

# ==============================================================================
# Node: Form Node
# ==============================================================================

def make_form_node(node_data: Dict[str, Any], execution_id: str):
    node_id = node_data["id"]
    data_cfg = node_data.get("data", {})
    node_label = data_cfg.get("label", node_id)
    form_schema = data_cfg.get("schema", {})
    custom_data = data_cfg

    def run_fn(state: Dict[str, Any]):
        save_node_execution(
            execution_id, node_id, node_type="form", node_label=node_label,
            status="paused", request_data={"form_schema": form_schema}, response_data=None, error_msg=None,
            exec_time_ms=0
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

def make_subworkflow_node(node_data: Dict[str, Any], execution_id: str):
    node_id = node_data["id"]
    data_cfg = node_data.get("data", {})
    node_label = data_cfg.get("label", node_id)
    sub_workflow_name = data_cfg.get("selectedWorkflowName", node_id)

    def run_fn(state: Dict[str, Any]):
        start_time = dt.datetime.utcnow()
        parent_state = state
        try:
            response_data = db_get_latest_flow(sub_workflow_name)
            subgraph = response_data.get("data", {}).get("graph")
        except NotFoundError:
            logger.error("[subworkflow:%s] Subgraph '%s' not found", node_label, sub_workflow_name)
            save_node_execution(
                execution_id, node_id, node_type="subworkflow", node_label=node_label,
                status="failed", request_data=None, response_data={"error": "No subgraph"}, error_msg="No subgraph",
                exec_time_ms=0
            )
            update_service_metrics(node_id, success=False, exec_time_ms=0)
            parent_state[node_id] = {"error": "No subgraph provided"}
            return parent_state
        except DBError as e:
            logger.error("[subworkflow:%s] DB error: %s", node_label, e)
            save_node_execution(
                execution_id, node_id, node_type="subworkflow", node_label=node_label,
                status="failed", request_data=None, response_data={"error": str(e)}, error_msg=str(e),
                exec_time_ms=0
            )
            update_service_metrics(node_id, success=False, exec_time_ms=0)
            parent_state[node_id] = {"error": str(e)}
            return parent_state

        if not subgraph:
            logger.error("[subworkflow:%s] Empty subgraph for '%s'", node_label, sub_workflow_name)
            save_node_execution(
                execution_id, node_id, node_type="subworkflow", node_label=node_label,
                status="failed", request_data=None, response_data={"error": "Empty subgraph"},
                error_msg="Empty subgraph", exec_time_ms=0
            )
            update_service_metrics(node_id, success=False, exec_time_ms=0)
            parent_state[node_id] = {"error": "Empty subgraph"}
            return parent_state

        sub_execution_id = str(uuid.uuid4())
        sub_state = {"input": parent_state.get("input", {})}

        entry_node_id = subgraph.get("nodes", [{}])[0].get("id") if subgraph.get("nodes") else None
        save_workflow_execution(
            sub_execution_id, node_label or "subworkflow", status="running",
            entry_node_id=entry_node_id, state=sub_state, workflow_graph=subgraph, parent_execution_id=execution_id
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
                status="completed", request_data={"sub_execution_id": sub_execution_id}, response_data=sub_result,
                error_msg=None, exec_time=exec_time
            )
            update_service_metrics(node_id, success=True, exec_time=exec_time)

            parent_state[node_id] = {
                "sub_execution_id": sub_execution_id,
                "request": sub_state,
                "response": sub_result,
                "_metrics": {"last_exec_ms": exec_time, "success": True},
            }

            logger.info("[subworkflow:%s] Completed child execution=%s", node_label, sub_execution_id)
            return parent_state
        except Exception as e:
            save_workflow_execution(
                sub_execution_id, node_label or "subworkflow", status="failed",
                current_node_id="unknown", state={"error": str(e)}, workflow_graph=subgraph,
                parent_execution_id=execution_id
            )
            save_node_execution(
                execution_id, node_id, node_type="subworkflow", node_label=node_label,
                status="failed", request_data=None, response_data={"error": str(e)},
                error_msg=str(e), exec_time_ms=0
            )
            update_service_metrics(node_id, success=False, exec_time_ms=0)
            parent_state[node_id] = {"error": str(e)}
            logger.exception("[subworkflow:%s] Exception: %s", node_label, e)
            return parent_state

    return run_fn

# ==============================================================================
# Node: Parallel Node
#
# Fan-out dispatcher. When the graph reaches this node it uses LangGraph's Send
# API to launch every downstream branch as an independent concurrent task.
#
# How it works:
#   1. The parallel node's run_fn is a no-op — it just records itself in state
#      and returns, signalling "I'm done".
#   2. A router function (returned by make_parallel_router) is attached as a
#      conditional edge FROM the parallel node.  The router inspects the edges
#      in the compiled graph JSON and returns a list[Send] — one per downstream
#      branch — causing LangGraph to execute all branches in parallel.
#   3. Each downstream node receives the same current state snapshot.
#
# Data shape from frontend:
#   { id: "parallel-1", type: "parallel", data: { label: "...", outputCount: N } }
#
# Edges from a parallel node carry sourceHandle "output-1" … "output-N".
# We capture the target node ids for those edges at graph-build time.
# ==============================================================================

def make_parallel_node(node_data: Dict[str, Any], execution_id: str):
    node_id = node_data["id"]
    data_cfg = node_data.get("data", {})
    node_label = data_cfg.get("label", node_id)
    output_count = int(data_cfg.get("outputCount", 2))

    def run_fn(state: Dict[str, Any]):
        start_time = dt.datetime.utcnow()
        exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)

        save_node_execution(
            execution_id, node_id, node_type="parallel", node_label=node_label,
            status="completed",
            request_data={"output_count": output_count},
            response_data={"branching": True},
            error_msg=None, exec_time=exec_time
        )
        update_service_metrics(node_id, success=True, exec_time=exec_time)

        state[node_id] = {
            "response": {"branching": True, "output_count": output_count},
            "_metrics": {"last_exec_ms": exec_time, "success": True},
        }

        logger.info("[parallel:%s] Fan-out node visited, outputCount=%d", node_label, output_count)
        return state

    return run_fn


def make_parallel_router(node_id: str, branch_targets: List[str]):
    """
    Returns a router function for add_conditional_edges that fans out to every
    branch target simultaneously using LangGraph's Send API.

    branch_targets: ordered list of node IDs that are the direct downstream
                    targets of this parallel node's output handles.
    """
    def router(state: Dict[str, Any]) -> List[Send]:
        sends = [Send(target, state) for target in branch_targets]
        logger.info("[parallel-router:%s] Sending to branches: %s", node_id, branch_targets)
        return sends

    return router


# ==============================================================================
# Node: Merge Node
#
# Fan-in collector. Waits until all parallel branches have written their results
# into the shared state, then aggregates them under its own node key.
#
# How it works:
#   LangGraph merges state from all parallel Send branches automatically before
#   invoking the merge node (because all branches write to the same shared state
#   dict and LangGraph's dict reducer uses last-write-wins per key).
#   The merge node simply collects the results from the upstream branch nodes
#   (identified via the edges in the graph) and records them together.
#
# Data shape from frontend:
#   { id: "merge-1", type: "merge", data: { label: "...", inputCount: N } }
#
# Edges into a merge node carry targetHandle "input-1" … "input-N".
# We capture the source node ids for those edges at graph-build time.
# ==============================================================================

def make_merge_node(node_data: Dict[str, Any], execution_id: str, upstream_node_ids: List[str]):
    node_id = node_data["id"]
    data_cfg = node_data.get("data", {})
    node_label = data_cfg.get("label", node_id)
    input_count = int(data_cfg.get("inputCount", 2))

    def run_fn(state: Dict[str, Any]):
        start_time = dt.datetime.utcnow()

        # Collect results from all upstream branch nodes
        merged_results: Dict[str, Any] = {}
        for uid in upstream_node_ids:
            merged_results[uid] = state.get(uid)

        exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)

        save_node_execution(
            execution_id, node_id, node_type="merge", node_label=node_label,
            status="completed",
            request_data={"upstream_nodes": upstream_node_ids, "input_count": input_count},
            response_data={"merged": merged_results},
            error_msg=None, exec_time=exec_time
        )
        update_service_metrics(node_id, success=True, exec_time=exec_time)

        state[node_id] = {
            "response": {"merged": merged_results},
            "_metrics": {"last_exec_ms": exec_time, "success": True},
        }

        logger.info(
            "[merge:%s] Merged %d upstream nodes: %s",
            node_label, len(upstream_node_ids), upstream_node_ids
        )
        return state

    return run_fn


# ==============================================================================
# Node factory: maps node types to builder functions
# Note: parallel and merge use custom registration paths in build_graph_from_json
#       because they need graph topology context (branch targets / upstream ids).
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
    # Pre-compute topology helpers for parallel/merge wiring
    # ------------------------------------------------------------------

    all_edges: List[Dict[str, Any]] = graph_json.get("edges", [])

    # Map: node_id -> list of target node_ids (for parallel fan-out)
    edges_out: Dict[str, List[str]] = {}
    for e in all_edges:
        src = e.get("source")
        tgt = e.get("target")
        if src and tgt:
            edges_out.setdefault(src, []).append(tgt)

    # Map: node_id -> list of source node_ids (for merge fan-in)
    edges_in: Dict[str, List[str]] = {}
    for e in all_edges:
        src = e.get("source")
        tgt = e.get("target")
        if src and tgt:
            edges_in.setdefault(tgt, []).append(src)

    # Build a quick type lookup
    node_type_map: Dict[str, str] = {
        n["id"]: n.get("type", "") for n in graph_json.get("nodes", [])
    }

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
            func = make_parallel_node(node, execution_id)
            g.add_node(node_id, func)

        elif ntype == "merge":
            upstream_ids = edges_in.get(node_id, [])
            func = make_merge_node(node, execution_id, upstream_ids)
            g.add_node(node_id, func)

        elif ntype in NODE_FACTORY:
            func = NODE_FACTORY[ntype](node, execution_id)
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
            # Collect all unique targets preserving insertion order
            branch_targets: List[str] = []
            seen: set = set()
            for e in edges:
                tgt = e.get("target")
                if tgt and tgt not in seen:
                    branch_targets.append(tgt)
                    seen.add(tgt)

            router = make_parallel_router(source, branch_targets)
            # Map each target to itself (identity) so LangGraph knows the reachable nodes
            path_map = {tgt: tgt for tgt in branch_targets}
            path_map[END] = END
            g.add_conditional_edges(source, router, path_map)
            logger.info("[build] Parallel fan-out from %s -> %s", source, branch_targets)

        # ---- Conditional edges (decision branches) ----
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
            # Only add END edge if the last node is not a parallel node
            # (parallel nodes already wire themselves through the router)
            if node_type_map.get(last) != "parallel":
                g.add_edge(last, END)
    else:
        g.set_entry_point(END)

    logger.debug(
        "Graph compiled (nodes=%d, edges=%d)",
        len(temp_graph_json["nodes"]),
        len(temp_graph_json["edges"])
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
