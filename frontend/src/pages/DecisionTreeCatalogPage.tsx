import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GrafoDecisionTree } from "../components/GrafoDecisionTree";
import { Loading } from "../components/Loading";
import { Page } from "../components/Page";
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
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!selectedRequirementId || !tree) return;
    if (
      !window.confirm(
        `Confermi l'eliminazione definitiva del decision tree ${tree.requirementId}? L'operazione non è reversibile.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await decisionTreeService.deleteTree(selectedRequirementId);
      const updatedTrees = await decisionTreeService.listTrees();
      setTrees(updatedTrees);
      setSelectedRequirementId(updatedTrees[0]?.requirementId ?? null);
      notification.success("Decision tree eliminato");
    } catch {
      setError("Impossibile eliminare il decision tree.");
    } finally {
      setDeleting(false);
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
      setError(
        "Impossibile importare il decision tree. Verificare il formato e la struttura del file.",
      );
    } finally {
      setImporting(null);
      if (input) input.value = "";
    }
  };

  return (
    <Page title="Decision Tree disponibili" onBack={() => navigate("/")} backLabel="Torna alla Home">
      {loading ? (
        <Loading />
      ) : error ? (
        <p role="alert" className="empty-state">
          {error}
        </p>
      ) : (
        <>
          <p className="card__meta">
            Seleziona un requisito per visualizzarne la struttura completa.
          </p>

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
          <div className="toolbar">
            <button
              type="button"
              className="btn"
              onClick={() => jsonInputRef.current?.click()}
              disabled={importing !== null}
            >
              {importing === "json" ? "Importazione JSON..." : "Importa JSON"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => csvInputRef.current?.click()}
              disabled={importing !== null}
            >
              {importing === "csv" ? "Importazione CSV..." : "Importa CSV"}
            </button>
          </div>

          <ul className="catalog-grid">
            {trees.map((treeSummary) => (
              <li key={treeSummary.requirementId}>
                <button
                  type="button"
                  className={
                    treeSummary.requirementId === selectedRequirementId
                      ? "btn btn--primary"
                      : "btn"
                  }
                  onClick={() => setSelectedRequirementId(treeSummary.requirementId)}
                >
                  {treeSummary.requirementId} — {treeSummary.requirementName}
                </button>
              </li>
            ))}
          </ul>

          {selectedRequirementId && tree ? (
            <section aria-label="Dettaglio decision tree" className="card stack">
              <h2 className="card__title">
                {tree.requirementId} — {tree.requirementName}
              </h2>

              <dl className="data-list">
                <div className="data-list__row">
                  <dt>Versione:</dt>
                  <dd>{tree.version ?? "Non specificata"}</dd>
                </div>
                <div className="data-list__row">
                  <dt>Applicabile a:</dt>
                  <dd>{tree.appliesTo?.join(", ") ?? "Non specificato"}</dd>
                </div>
                <div className="data-list__row">
                  <dt>Nodo radice:</dt>
                  <dd>{tree.rootNode}</dd>
                </div>
                <div className="data-list__row">
                  <dt>Numero nodi:</dt>
                  <dd>{tree.nodes.length}</dd>
                </div>
                <div className="data-list__row">
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

              <div className="action-bar">
                <button type="button" className="btn" onClick={() => handleExport("json")}>
                  Esporta JSON
                </button>
                <button type="button" className="btn" onClick={() => handleExport("csv")}>
                  Esporta CSV
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Eliminazione..." : "Elimina decision tree"}
                </button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </Page>
  );
}
