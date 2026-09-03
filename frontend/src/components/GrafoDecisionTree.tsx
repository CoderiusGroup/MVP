import { memo } from "react";
import {
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node as FlowNode,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { DecisionTree } from "../domain/entities/DecisionTree";
import type { PathStep } from "../domain/entities/Session";
import { layoutTree, type TreeLayout } from "../domain/rules/treeLayout";
import type { Outcome } from "../domain/rules/treeRules";
import { STATUS_COLORS } from "../theme/statusColors";

type Props = {
  tree: DecisionTree;
  currentNodeId?: string;
  path?: PathStep[];
  readOnly?: boolean;
};

const COL_W = 260;
const ROW_H = 126;
const NODE_W = 220;
const PAD = 18;

// Tinta chiara di riempimento delle foglie per esito; il bordo usa STATUS_COLORS.
const LEAF_FILL: Record<string, string> = {
  PASS: "#e4f1ea",
  FAIL: "#f6e3e7",
  NOT_APPLICABLE: "#eef1f5",
};
const LEAF_STROKE: Record<string, string> = STATUS_COLORS;

const EDGE_ON = "#00129a";
const EDGE_OFF = "#aeb6c2";

interface TreeNodeData extends Record<string, unknown> {
  code: string;
  isLeaf: boolean;
  outcome?: Outcome;
  text: string;
  isCurrent: boolean;
  isVisited: boolean;
  isDimmed: boolean;
  readOnly: boolean;
}

type TreeFlowNode = FlowNode<TreeNodeData, "treeNode">;

export function toFlow(
  layout: TreeLayout,
  { currentNodeId, path = [], readOnly = false }: Omit<Props, "tree">,
): { nodes: TreeFlowNode[]; edges: Edge[] } {
  const visited = new Set(path.map((step) => step.nodeId));
  const traversed = new Set(path.map((step) => `${step.nodeId}:${step.answer}`));

  const nodes: TreeFlowNode[] = layout.nodes.map(({ id, node, col, depth }) => {
    const isCurrent = !readOnly && id === currentNodeId;
    const isVisited = visited.has(id);
    return {
      id,
      type: "treeNode",
      position: { x: PAD + col * COL_W, y: PAD + depth * ROW_H },
      data: {
        code: id,
        isLeaf: node.type === "leaf",
        outcome: node.type === "leaf" ? node.outcome : undefined,
        text:
          node.type === "question"
            ? node.text
            : (node.text ?? `Esito: ${node.outcome}`),
        isCurrent,
        isVisited,
        isDimmed: !readOnly && !isCurrent && !isVisited,
        readOnly,
      },
    };
  });

  const edges: Edge[] = layout.edges.map((edge) => {
    const on = traversed.has(`${edge.from}:${edge.answer}`);
    return {
      id: `${edge.from}-${edge.answer}`,
      source: edge.from,
      target: edge.to,
      label: edge.answer === "yes" ? "Sì" : "No",
      type: "smoothstep",
      style: { stroke: on ? EDGE_ON : EDGE_OFF, strokeWidth: on ? 2.4 : 1.2 },
      labelStyle: { fill: on ? EDGE_ON : "#97a1b0", fontWeight: on ? 700 : 500 },
    };
  });

  return { nodes, edges };
}

const TreeNode = memo(function TreeNode({ data }: NodeProps<TreeFlowNode>) {
  const highlighted = data.isCurrent || (data.readOnly && !data.isLeaf);
  const leafBorder = data.isLeaf ? (LEAF_STROKE[data.outcome ?? ""] ?? "#8b95a4") : "#cbd3dd";
  const leafFill = data.isLeaf ? (LEAF_FILL[data.outcome ?? ""] ?? "#eef1f5") : "#ffffff";

  return (
    <div
      data-node={data.code}
      data-current={data.isCurrent}
      data-visited={data.isVisited}
      data-dimmed={data.isDimmed}
      style={{
        width: NODE_W,
        boxSizing: "border-box",
        padding: "8px 10px",
        borderRadius: 8,
        border: `${highlighted ? 2.4 : 1.2}px solid ${highlighted ? "#2f6db5" : leafBorder}`,
        background: highlighted ? "#eaf1fa" : leafFill,
        opacity: data.isDimmed ? 0.5 : 1,
        fontSize: 10,
        lineHeight: 1.3,
        color: "#1a2230",
        textAlign: "center",
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} style={{ opacity: 0 }} />
      <div style={{ fontWeight: 700 }}>{data.code}</div>
      {data.isLeaf && data.outcome ? <div style={{ fontWeight: 700 }}>{data.outcome}</div> : null}
      <div style={{ fontWeight: data.isCurrent ? 700 : 500 }}>{data.text}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{ opacity: 0 }}
      />
    </div>
  );
});

const nodeTypes = { treeNode: TreeNode };

export function GrafoDecisionTree({ tree, currentNodeId, path = [], readOnly = false }: Props) {
  const { nodes, edges } = toFlow(layoutTree(tree), { currentNodeId, path, readOnly });

  return (
    <section aria-label="Grafo decision tree">
      <div
        style={{ width: "100%", height: 460, border: "1px solid #e1e5ea", borderRadius: 8 }}
        aria-label={`Grafo del decision tree ${tree.requirementId}`}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
        >
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  );
}
