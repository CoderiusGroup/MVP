import type { DecisionTree } from "../domain/entities/DecisionTree";
import type { PathStep } from "../domain/entities/Session";

type Props = {
  tree: DecisionTree;
  currentNodeId: string;
  path: PathStep[];
};

export function GrafoDecisionTree({ tree, currentNodeId, path }: Props) {
  const visitedNodeIds = path.map((step) => step.nodeId);

  return (
    <section aria-label="Grafo decision tree">
      <ul>
        {tree.nodes.map((node) => {
          const isCurrent = node.id === currentNodeId;
          const isVisited = visitedNodeIds.includes(node.id);
          const label = node.type === "question" ? node.text : `Esito: ${node.outcome}`;

          return (
            <li
              key={node.id}
              data-current={isCurrent}
              data-visited={isVisited}
              style={{
                fontWeight: isCurrent ? "bold" : "normal",
                opacity: isVisited || isCurrent ? 1 : 0.5,
              }}
            >
              {node.id} — {label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
