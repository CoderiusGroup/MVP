import type { DecisionTree } from "../domain/entities/DecisionTree";
import type { PathStep } from "../domain/entities/Session";
import { layoutTree } from "../domain/rules/treeLayout";

type Props = {
  tree: DecisionTree;
  currentNodeId: string;
  path: PathStep[];
};

const COL_W = 156;
const ROW_H = 126;
const NODE_W = 220;
const NODE_H = 92;
const PAD = 18;

// Tinta delle foglie per esito.
const LEAF_FILL: Record<string, string> = {
  PASS: "#e4f1ea",
  FAIL: "#f6e3e7",
  NOT_APPLICABLE: "#eef1f5",
};
const LEAF_STROKE: Record<string, string> = {
  PASS: "#227a52",
  FAIL: "#b23a52",
  NOT_APPLICABLE: "#8b95a4",
};

function textLines(text: string, maxLength = 30) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > maxLength) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export function GrafoDecisionTree({ tree, currentNodeId, path }: Props) {
  const layout = layoutTree(tree);
  const pos = new Map(layout.nodes.map((n) => [n.id, n]));
  const visited = new Set(path.map((s) => s.nodeId));
  const traversed = new Set(path.map((s) => `${s.nodeId}:${s.answer}`));

  const cx = (col: number) => PAD + col * COL_W + NODE_W / 2;
  const top = (depth: number) => PAD + depth * ROW_H;
  const width = PAD * 2 + (layout.cols - 1) * COL_W + NODE_W;
  const height = PAD * 2 + layout.depth * ROW_H + NODE_H;

  return (
    <section aria-label="Grafo decision tree">
      <div style={{ overflowX: "auto" }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Grafo del decision tree ${tree.requirementId}`}
          style={{ fontFamily: "inherit" }}
        >
          {/* archi */}
          {layout.edges.map((edge) => {
            const from = pos.get(edge.from);
            const to = pos.get(edge.to);
            if (!from || !to) {
              return null;
            }
            const x1 = cx(from.col);
            const y1 = top(from.depth) + NODE_H;
            const x2 = cx(to.col);
            const y2 = top(to.depth);
            const isOn = traversed.has(`${edge.from}:${edge.answer}`);
            return (
              <g key={`${edge.from}-${edge.answer}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isOn ? "#4a90d9" : "#aeb6c2"}
                  strokeWidth={isOn ? 2.4 : 1.2}
                />
                <text
                  x={(x1 + x2) / 2 + 4}
                  y={(y1 + y2) / 2}
                  fontSize="11"
                  fill={isOn ? "#4a90d9" : "#97a1b0"}
                  fontWeight={isOn ? 700 : 500}
                >
                  {edge.answer === "yes" ? "Sì" : "No"}
                </text>
              </g>
            );
          })}

          {/* nodi */}
          {layout.nodes.map(({ id, node, col, depth }) => {
            const isCurrent = id === currentNodeId;
            const isVisited = visited.has(id);
            const isLeaf = node.type === "leaf";
            const x = cx(col) - NODE_W / 2;
            const y = top(depth);

            let fill = "#ffffff";
            let stroke = "#cbd3dd";
            if (isLeaf) {
              fill = LEAF_FILL[node.outcome] ?? "#eef1f5";
              stroke = LEAF_STROKE[node.outcome] ?? "#8b95a4";
            }
            if (isCurrent) {
              fill = "#eaf1fa";
              stroke = "#2f6db5";
            }
            const dim = !isCurrent && !isVisited;
            const fullText = node.type === "question" ? node.text : node.text ?? `Esito: ${node.outcome}`;
            const lines = textLines(fullText);

            return (
              <g
                key={id}
                data-node={id}
                data-current={isCurrent}
                data-visited={isVisited}
                opacity={dim ? 0.5 : 1}
              >
                <title>{`${id} — ${fullText}`}</title>
                <rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isCurrent ? 2.4 : 1.2}
                />
                <text
                  x={x + NODE_W / 2}
                  y={y + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isCurrent ? 700 : 500}
                  fill="#1a2230"
                >
                  <tspan x={x + NODE_W / 2} fontWeight="700">{id}</tspan>
                  {isLeaf && <tspan x={x + NODE_W / 2} dy="15">{node.outcome}</tspan>}
                  {lines.map((line, index) => (
                    <tspan key={`${id}-line-${index}`} x={x + NODE_W / 2} dy="14">
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
