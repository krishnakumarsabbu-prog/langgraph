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
# Attach a default stream handler if none present (cal
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
    # Split on dots not inside brackets: a.b[0].c
    parts = re.split(r'\.(?![^\[]*\])', path)
    for part in parts:
        # Matches either key (group 1) OR index in brackets (group 2)
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
        host = urlparse(url).netloc  # includes host:port if present
        if host not in hosts:
            raise ValueError(f"Service URL host '{host}' is not in allowlist: {hosts}")


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

    # Raw body can be a JSON string or XML string
    request_body_raw = data_cfg.get("config", {}).get("requestBody", "{}")

    # Parse request template safely
    if is_xml:
        # For XML bodies, we treat as plain string template
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

        # Validate URL early to fail fast (safer + clearer logs)
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

        # Apply explicit mappings (only if payload is a dict; not applicable for XML string)
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

                    # Insert into nested target path
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
                # XML payload sent in `data`, keep headers (including Content-Type)
                resp = requests.request(method, url, data=payload, headers=headers, timeout=15)
            else:
                # JSON payload sent in `json`, include headers for consistency
                resp = requests.request(method, url, json=payload, headers=headers, timeout=15)

            if resp.ok:
                # Attempt JSON parse; if not JSON, store raw text
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

        # Persist node execution & metrics
        save_node_execution(
            execution_id, node_id, node_type="service", node_label=node_label,
            status="completed" if ok else "failed", request_data=payload, response_data=resp_data,
            error_msg=error_msg, exec_time=exec_time
        )
        update_service_metrics(node_id, ok, exec_time)

        # Store request/response in state
        state[node_id] = {
            "request": payload,
            "response": resp_data,
            "_metrics": {"last_exec_ms": exec_time, "success": ok},
        }

        logger.info("[service:%s] ok=%s time_ms=%s", node_label, ok, exec_time)
        return state

    return run_fn

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

        # Only allow references to `state` and `input`
        names = {"state": new_state, "input": new_state.get("input", {})}

        if rules:
            for rule in rules or []:
                cond = rule.get("condition")
                try:
                    # simple_eval with constrained names; avoid functions/attrs for safety
                    if bool(simple_eval(cond, names=names)):
                        action = rule.get("action", {})
                        if isinstance(action, dict):
                            new_state.update(action)
                            actions_taken.append({"condition": cond, "action": action})
                except Exception as e:
                    logger.warning("[decision:%s] Condition error: %s", node_label, e)

        # Script mode (Python block)
        if script:
            try:
                local_env = {"state": new_state}
                exec(script, {}, local_env)
                new_state = local_env.get("state", new_state)
            except Exception as e:
                print(f"[DecisionNode-Script] Script error: {e}")

        exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)

        # Persist decision result (no external call metrics, but track timing)
        save_node_execution(
            execution_id, node_id, node_type="decision", node_label=node_label,
            status="completed", request_data={"rules": rules, "script": script},
            response_data={"actions_taken": actions_taken},
            error_msg=None, exec_time=exec_time
        )
        update_service_metrics(node_id, success=True, exec_time=exec_time)

        # Store trace in state
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
# - Pauses workflow, signals UI to collect data. The API layer will resume later.
# ==============================================================================

def make_form_node(node_data: Dict[str, Any], execution_id: str):
    node_id = node_data["id"]
    data_cfg = node_data.get("data", {})
    node_label = data_cfg.get("label", node_id)
    form_schema = data_cfg.get("schema", {})
    custom_data = data_cfg  # any UI hints

    def run_fn(state: Dict[str, Any]):
        # Persist paused node
        save_node_execution(
            execution_id, node_id, node_type="form", node_label=node_label,
            status="paused", request_data={"form_schema": form_schema}, response_data=None, error_msg=None,
            exec_time_ms=0
        )
        # Mark pause in state (API will read this to pause workflow)
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
# - Executes another saved workflow graph by name, as a child execution.
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

        # New execution for the subworkflow (child)
        sub_execution_id = str(uuid.uuid4())
        sub_state = {"input": parent_state.get("input", {})}

        # Persist child execution starting
        entry_node_id = subgraph.get("nodes", [{}])[0].get("id") if subgraph.get("nodes") else None
        save_workflow_execution(
            sub_execution_id, node_label or "subworkflow", status="running",
            entry_node_id=entry_node_id, state=sub_state, workflow_graph=subgraph, parent_execution_id=execution_id
        )

        try:
            # Build and execute subgraph
            sub_graph = build_graph_from_json(subgraph, sub_execution_id)
            sub_result = sub_graph.invoke(sub_state)

            last_node_id = subgraph.get("nodes", [{}])[-1].get("id") if subgraph.get("nodes") else None
            save_workflow_execution(
                sub_execution_id, node_label or "subworkflow", status="completed",
                last_node_id=last_node_id, state=sub_result, workflow_graph=subgraph,
                parent_execution_id=execution_id
            )

            # Persist subworkflow node execution in parent
            exec_time = int((dt.datetime.utcnow() - start_time).total_seconds() * 1000)
            save_node_execution(
                execution_id, node_id, node_type="subworkflow", node_label=node_label,
                status="completed", request_data={"sub_execution_id": sub_execution_id}, response_data=sub_result,
                error_msg=None, exec_time=exec_time
            )
            update_service_metrics(node_id, success=True, exec_time=exec_time)

            # Attach result to parent state
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
                sub_execution_id, node_label or "subworkflow", status: "failed",
            current_node_id: "unknown", state: {"error": str(e)}, subgraph, parent_execution_id = execution_id
            )
            save_node_execution(
                execution_id, node_id, node_type: "subworkflow", node_label,
            status: "failed", request_data: None, response_data: {"error": str(e)}, str(e), exec_time_ms: 0
            )
            update_service_metrics(node_id, success: False, exec_time_ms: 0)
            parent_state[node_id] = {"error": str(e)}
            logger.exception(msg: "[subworkflow:%s] Exception: %s", *args: node_label, e)
            return parent_state

    return run_fn

# ==============================================================================
# Node factory: maps node types to builder functions
# ==============================================================================

NODE_FACTORY = {
    "service": make_service_node,
    "decision": make_decision_node,
    "form": make_form_node,
    "workflow": make_subworkflow_node,
}

def build_graph_from_json(graph_json: Dict[str, Any], execution_id: str):
    g = StateGraph(dict)

    # Read latest node statuses for this execution from DB
    node_status_map = get_node_status_map(execution_id)

    # Build a temp graph with only nodes still to run
    temp_graph_json: Dict[str, Any] = {"nodes": [], "edges": []}

    current_pause_form_id: Optional[str] = None

    # Register nodes (skip completed)
    for node in graph_json.get("nodes", []):
        node_id = node.get("id")
        ntype = node.get("type")

        # Skip nodes already completed in this execution
        if node_status_map.get(node_id) == "completed":
            logger.debug(msg: "Skipping completed node: %s", *args: node_id)
            continue

        if ntype not in NODE_FACTORY:
            raise Exception(f"Unknown node type: {ntype}")

        func = NODE_FACTORY[ntype](node, execution_id)

        g.add_node(node_id, func)

        # Stop building after first form node (pause point)
        if ntype == "form":
            current_pause_form_id = node_id
            temp_graph_json["nodes"].append(node)
            break

        temp_graph_json["nodes"].append(node)

    # Keep edges only between nodes present in temp graph
    valid_node_ids = {n["id"] for n in temp_graph_json["nodes"]}
    for e in graph_json.get("edges", []):
        if e.get("source") in valid_node_ids and e.get("target") in valid_node_ids:
            temp_graph_json["edges"].append(e)

    # Wire edges (grouped by source)
    edges_by_source: Dict[str, List[Dict[str, Any]]] = {}
    for e in temp_graph_json.get("edges", []):
        if current_pause_form_id and e.get("source") == current_pause_form_id:
            # Do not wire beyond the pause point
            continue
        edges_by_source.setdefault(e.get("source"), []).append(e)

    for source, edges in edges_by_source.items():
        # If any edge has a condition, create a conditional router
        if any(e.get("condition") for e in edges):
            def conditional_fn(state, edges=edges):
                for edge in edges:
                    cond = edge.get("condition")
                    if not cond:
                        continue
                    try:
                        if bool(simple_eval(cond, names={"state": state, "input": state.get("input", {})})):
                            return edge.get("target")
                    except Exception as ex:
                        logger.warning(msg: "Condition eval error at edge %s: %s", *args: edge, ex)
                    # Fallback: first unconditional edge if present
                for e in edges:
                    if not e.get("condition"):
                        return e.get("target")
                return END
            g.add_conditional_edges(source, conditional_fn)
        else:
            for e in edges:
                if current_pause_form_id and e.get("source") == current_pause_form_id:
                    continue
                g.add_edge(e.get("source"), e.get("target"))

    if temp_graph_json.get("nodes"):
        entry = temp_graph_json["nodes"][0]["id"]
        g.set_entry_point(entry)
        if current_pause_form_id:
            g.add_edge(current_pause_form_id, END)
        else:
            last = temp_graph_json["nodes"][-1]["id"]
            g.add_edge(last, END)
    else:
        # No runnable nodes; set entry to END
        g.set_entry_point(END)

    logger.debug(msg: "Graph compiled (nodes=%d, edges=%d)", *args: len(temp_graph_json["nodes"]), len(
        temp_graph_json["edges"]))

    return g.compile()

__all__ = [
    "deep_get",
    "render_template",
    "make_service_node",
    "make_decision_node",
    "make_form_node",
    "make_subworkflow_node",
    "NODE_FACTORY",
    "build_graph_from_json",
]