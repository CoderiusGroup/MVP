import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GrafoDecisionTree } from "../components/GrafoDecisionTree";
import { NotificationManager } from "../infrastructure/NotificationManager";
import { decisionTreeService, type DecisionTreeSummary } from "../services/DecisionTreeService";
import type { DecisionTree } from "../domain/entities/DecisionTree";

const notification = new NotificationManager();

export function DecisionTreeCatalogPage() {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<DecisionTreeSummary[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [tree, setTree] = useState<DecisionTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<"json" | "csv" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

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

  const handleImport = async (file: File | undefined, format: "json" | "csv") => {
    const input = format === "json" ? jsonInputRef.current : csvInputRef.current;
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(`.${format}`)) {
      notification.error(`Il file selezionato non è un ${format.toUpperCase()}.`);
      if (input) input.value = "";
      return;
    }
    setImporting(format);
    setError(null);
    try {
      const importedTree = await decisionTreeService.importTree(file);
      const updatedTrees = await decisionTreeService.listTrees();
      const message = importedTree.message ?? "Decision Tree importato correttamente";
      setTrees(updatedTrees);
      setSelectedRequirementId(importedTree.requirementId);
      setTree(importedTree);
      notification.success(message);
    } catch {
      setError("Impossibile importare il decision tree. Verificare il formato e la struttura del file.");
    } finally {
      setImporting(null);
      if (input) input.value = "";
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
          <p>Seleziona un requisito per visualizzare la struttura completa del DT.</p>
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            aria-label="Seleziona file JSON del decision tree"
            onChange={(event) => handleImport(event.target.files?.[0], "json")}
            style={{ display: "none" }}
          />
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            aria-label="Seleziona file CSV del decision tree"
            onChange={(event) => handleImport(event.target.files?.[0], "csv")}
            style={{ display: "none" }}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              disabled={importing !== null}
            >
              {importing === "json" ? "Importazione JSON..." : "Importa JSON"}
            </button>
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              disabled={importing !== null}
            >
              {importing === "csv" ? "Importazione CSV..." : "Importa CSV"}
            </button>
          </div>
          <ul className="decision-tree-list">
            {trees.map((treeSummary) => (
              <li key={treeSummary.requirementId}>
                <button
                  type="button"
                  onClick={() => setSelectedRequirementId(treeSummary.requirementId)}
                >
                  {treeSummary.requirementId} — {treeSummary.requirementName}
                </button>
              </li>
            ))}
          </ul>

          {selectedRequirementId && tree ? (
            <section aria-label="Dettaglio decision tree">
              <h2>{tree.requirementId} — {tree.requirementName}</h2>

              <dl className="decision-tree-info">
                <div>
                  <dt>Versione:</dt>
                  <dd>{tree.version ?? "Non specificata"}</dd>
                </div>

                <div>
                  <dt>Applicabile a:</dt>
                  <dd>{tree.appliesTo?.join(", ") ?? "Non specificato"}</dd>
                </div>

                <div>
                  <dt>Nodo radice:</dt>
                  <dd>{tree.rootNode}</dd>
                </div>

                <div>
                  <dt>Numero nodi:</dt>
                  <dd>{tree.nodes.length}</dd>
                </div>

                <div>
                  <dt>Dipendenze:</dt>
                  <dd>
                    {tree.dependencies && tree.dependencies.length > 0
                      ? tree.dependencies.join(", ")
                      : "Nessuna dipendenza"}
                  </dd>
                </div>
              </dl>

              <h3>Grafo decision tree</h3>
              <GrafoDecisionTree tree={tree} currentNodeId={tree.rootNode} path={[]} readOnly />
              
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <button type="button" onClick={() => handleExport("json")}>Esporta JSON</button>
                <button type="button" onClick={() => handleExport("csv")}>Esporta CSV</button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
