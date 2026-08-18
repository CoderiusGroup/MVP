// Scope attuale: gestisce la navigazione di UN SOLO decision tree/requisito per volta.
// L'orchestrazione dell'intera sessione (più asset, più requisiti in sequenza) implicata
// dal nome ufficiale della pagina è lavoro futuro, non implementata in questo branch.
import { useParams } from "react-router-dom";
import { useDecisionTree } from "../hooks/useDecisionTree";
import { useTreeStore } from "../store/TreeStore";

export function SessionRunnerPage() {
  const { requirementId } = useParams<{ requirementId: string }>();
  const { status } = useDecisionTree(requirementId ?? "");
  const tree = useTreeStore((state) => state.tree);
  const currentNodeId = useTreeStore((state) => state.currentNodeId);
  const history = useTreeStore((state) => state.history);
  const cursor = useTreeStore((state) => state.cursor);
  const answer = useTreeStore((state) => state.answer);
  const goBack = useTreeStore((state) => state.goBack);
  const goForward = useTreeStore((state) => state.goForward);

  if (status === "error") {
    return <p role="alert">Impossibile caricare l'albero decisionale.</p>;
  }

  if (status === "loading" || !tree || !currentNodeId) {
    return <p>Caricamento albero decisionale...</p>;
  }

  const visitedNodeIds = history.slice(0, cursor).map((step) => step.nodeId);
  const currentNode = tree.nodes.find((node) => node.id === currentNodeId);
  const recordedStep = history[cursor];
  const previousAnswer =
    recordedStep && recordedStep.nodeId === currentNodeId ? recordedStep.answer : null;

  return (
    <div>
      <section aria-label="Nodo corrente">
        {currentNode?.type === "question" ? (
          <>
            <p>
              Nodo: <strong>{currentNode.id}</strong>
            </p>
            <p>{currentNode.text}</p>
            {previousAnswer ? (
              <p>Risposta data in precedenza: {previousAnswer === "yes" ? "Sì" : "No"}</p>
            ) : null}
            <button type="button" onClick={() => answer(true)}>
              Sì
            </button>
            <button type="button" onClick={() => answer(false)}>
              No
            </button>
          </>
        ) : currentNode?.type === "leaf" ? (
          <>
            <p>
              Nodo: <strong>{currentNode.id}</strong>
            </p>
            <p>Esito: {currentNode.outcome}</p>
          </>
        ) : null}

        <button type="button" onClick={goBack} disabled={cursor === 0}>
          Indietro
        </button>
        <button type="button" onClick={goForward} disabled={cursor >= history.length}>
          Avanti
        </button>
      </section>

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
    </div>
  );
}
