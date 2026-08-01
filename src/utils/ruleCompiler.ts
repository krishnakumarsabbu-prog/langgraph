/**
 * ruleCompiler.ts
 * 
 * Node-Scoped Data Model, Python Compiler, and Client-side Evaluator for Visual HTML Rules.
 * Enables non-technical users to build and tweak decision rules using preceding node output features
 * and interactive HTML controls (toggles, dropdowns, sliders).
 */

export type ValueType = 'boolean' | 'select' | 'number' | 'string';
export type Operator = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not in';

export interface RuleCondition {
  id: string;
  nodeId?: string; // Selected preceding node ID (e.g. 'service-1', 'service-2', or 'input')
  field: string;
  operator: Operator;
  value: any;
  valueType: ValueType;
  options?: string[]; // For dropdown choices
  min?: number;      // For number sliders
  max?: number;
  step?: number;
}

export interface RuleGroup {
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
}

export const DEFAULT_RULE_GROUP: RuleGroup = {
  logic: 'AND',
  conditions: [],
};

/**
 * Compiles a visual RuleGroup structure into executable Python code with node-scoped lookups.
 */
export function compileRuleGroupToPython(group: RuleGroup): string {
  if (!group || group.conditions.length === 0) {
    return '# No visual rule conditions configured - passes by default\nresult = True\n';
  }

  const expressions: string[] = group.conditions.map((cond) => {
    let fieldExpr = `state.get("${cond.field}", None)`;
    if (cond.nodeId) {
      if (cond.nodeId === 'input') {
        fieldExpr = `state.get("input", {}).get("${cond.field}", state.get("${cond.field}", None))`;
      } else {
        fieldExpr = `state.get("${cond.nodeId}", {}).get("${cond.field}", None)`;
      }
    }

    if (cond.valueType === 'boolean') {
      const boolVal = cond.value ? 'True' : 'False';
      return `${fieldExpr} ${cond.operator} ${boolVal}`;
    }

    if (cond.valueType === 'select') {
      if (Array.isArray(cond.value)) {
        const pyList = `[${cond.value.map((v) => `'${v}'`).join(', ')}]`;
        return `${fieldExpr} ${cond.operator} ${pyList}`;
      }
      return `${fieldExpr} ${cond.operator} '${cond.value}'`;
    }

    if (cond.valueType === 'number') {
      const numVal = typeof cond.value === 'number' ? cond.value : parseFloat(cond.value) || 0;
      return `(float(${fieldExpr} or 0) ${cond.operator} ${numVal})`;
    }

    // String default
    return `str(${fieldExpr}) ${cond.operator} "${cond.value}"`;
  });

  const joinOperator = group.logic === 'AND' ? ' and \\\n    ' : ' or \\\n    ';
  const combinedBody = expressions.join(joinOperator);

  return `# Auto-generated Visual Node-Scoped Decision Rule\n# Evaluation Logic (${group.logic})\n\ndef evaluate_decision_rule(state):\n    return (\n        ${combinedBody}\n    )\n\nresult = evaluate_decision_rule(state)\n`;
}

/**
 * Helper to safely extract nested node-scoped state values
 */
export function getNestedStateValue(state: Record<string, any>, field: string, nodeId?: string): any {
  if (!state) return undefined;

  if (nodeId) {
    if (nodeId === 'input') {
      if (state.input && field in state.input) return state.input[field];
      if (field in state) return state[field];
    }
    const nodeState = state[nodeId];
    if (nodeState && typeof nodeState === 'object') {
      if (field in nodeState) return nodeState[field];
      if (nodeState.response && typeof nodeState.response === 'object' && field in nodeState.response) {
        return nodeState.response[field];
      }
    }
  }

  // Direct fallback
  if (field in state) return state[field];
  return undefined;
}

/**
 * Client-side JS Evaluator for real-time "What-If" scenario simulation.
 */
export function evaluateRuleConditionInJS(cond: RuleCondition, state: Record<string, any>): boolean {
  const actualValue = getNestedStateValue(state, cond.field, cond.nodeId);

  if (cond.valueType === 'boolean') {
    const boolActual = Boolean(actualValue);
    const boolTarget = Boolean(cond.value);
    return cond.operator === '==' ? boolActual === boolTarget : boolActual !== boolTarget;
  }

  if (cond.valueType === 'number') {
    const numActual = typeof actualValue === 'number' ? actualValue : parseFloat(actualValue) || 0;
    const numTarget = typeof cond.value === 'number' ? cond.value : parseFloat(cond.value) || 0;

    switch (cond.operator) {
      case '==': return numActual === numTarget;
      case '!=': return numActual !== numTarget;
      case '>': return numActual > numTarget;
      case '>=': return numActual >= numTarget;
      case '<': return numActual < numTarget;
      case '<=': return numActual <= numTarget;
      default: return false;
    }
  }

  if (cond.valueType === 'select') {
    if (Array.isArray(cond.value)) {
      const isIncluded = cond.value.includes(String(actualValue));
      return cond.operator === 'in' ? isIncluded : !isIncluded;
    }
    return cond.operator === '==' ? String(actualValue) === String(cond.value) : String(actualValue) !== String(cond.value);
  }

  // String comparison
  const strActual = String(actualValue ?? '');
  const strTarget = String(cond.value ?? '');
  return cond.operator === '==' ? strActual === strTarget : strActual !== strTarget;
}

/**
 * Evaluates an entire RuleGroup in JS for What-If path highlighting.
 */
export function evaluateRuleGroupInJS(group: RuleGroup, state: Record<string, any>): boolean {
  if (!group || group.conditions.length === 0) return true;

  if (group.logic === 'AND') {
    return group.conditions.every((cond) => evaluateRuleConditionInJS(cond, state));
  } else {
    return group.conditions.some((cond) => evaluateRuleConditionInJS(cond, state));
  }
}
