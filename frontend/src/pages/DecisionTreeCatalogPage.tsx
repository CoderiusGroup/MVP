import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GrafoDecisionTree } from "../components/GrafoDecisionTree";
import { decisionTreeService, type DecisionTreeSummary } from "../services/DecisionTreeService";
import type { DecisionTree } from "../domain/entities/DecisionTree";

export function DecisionTreeCatalogPage() {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<DecisionTreeSummary[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [tree, setTree] = useState<DecisionTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    decisionTreeService
      .listTrees()
      .then((result) => {
        if (!active) return;
        setTrees(result);
        if (result.length > 0) {
          setSelectedRequirementId(result[0].requirementId);
        }
      })
      .catch(() => {
        if (!active) return;
        setError("Impossibile caricare l'elenco dei decision tree.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRequirementId) {
      setTree(null);
      return;
    }

    let active = true;
    setError(null);

    decisionTreeService
      .getTree(selectedRequirementId)
      .then((loadedTree) => {
        if (!active) return;
        setTree(loadedTree);
      })
      .catch(() => {
        if (!active) return;
        setError("Impossibile caricare il dettaglio del decision tree.");
      });

    return () => {
      active = false;
    };
  }, [selectedRequirementId]);

  const handleExport = async (format: "json" | "csv") => {
    if (!selectedRequirementId) return;
    try {
      await decisionTreeService.exportTree(selectedRequirementId, format);
    } catch {
      setError(`Esportazione ${format.toUpperCase()} non disponibile.`);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <button type="button" onClick={() => navigate("/")}>
        Torna alla Home
      </button>
      <h1>Decision Tree disponibili</h1>

      {loading ? (
        <p>Caricamento...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          <ul>
            {trees.map((treeSummary) => (
              <li key={treeSummary.requirementId}>
                <button type="button" onClick={() => setSelectedRequirementId(treeSummary.requirementId)}>
                  {treeSummary.requirementId} — {treeSummary.requirementName}
                </button>
              </li>
            ))}
          </ul>

          {selectedRequirementId && tree ? (
            <section aria-label="Dettaglio decision tree">
              <h2>{tree.requirementId} — {tree.requirementName}</h2>

              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <button type="button" onClick={() => handleExport("json")}>Export JSON</button>
                <button type="button" onClick={() => handleExport("csv")}>Export CSV</button>
              </div>

              <p>
                <strong>Root:</strong> {tree.rootNode}
              </p>
              {tree.dependencies && tree.dependencies.length > 0 ? (
                <div>
                  <h3>Dipendenze</h3>
                  <ul>
                    {tree.dependencies.map((dep) => (
                      <li key={dep}>{dep}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>Nessuna dipendenza.</p>
              )}

              <h3>Grafo decision tree</h3>
              <GrafoDecisionTree tree={tree} currentNodeId={tree.rootNode} path={[]} />

              <h3>Nodi</h3>
              <ul>
                {tree.nodes.map((node) => (
                  <li key={node.id}>
                    <strong>{node.id}</strong> — {node.type === "question" ? "nodo interno" : "foglia"}
                    {node.type === "question" ? ` — ${node.text}` : ` — ${node.outcome}`}
                    {node.type === "question" && (
                      <span>
                        {" "}Yes: {node.branches.yes} / No: {node.branches.no}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
