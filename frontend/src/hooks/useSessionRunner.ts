// Orchestra la sessione: carica l'albero della coppia (asset, requisito) corrente,
// riallinea il percorso a ogni risposta e avanza fino al completamento.
import { useEffect, useState } from "react";

import { DecisionTreeSchema } from "../domain/entities/DecisionTree";
import { currentOutcome, nodeById, type Outcome } from "../domain/rules/treeRules";
import { FetchApiClient } from "../infrastructure/FetchApiClient";
import { downloadSession } from "../services/SessionService";
import { useSessionStore } from "../store/SessionStore";
import { useTreeStore } from "../store/TreeStore";

type Status = "idle" | "loading" | "error";

const apiClient = new FetchApiClient();

export function useSessionRunner() {
  const session = useSessionStore((state) => state.session);
  const syncProgress = useSessionStore((state) => state.syncProgress);
  const completeCurrent = useSessionStore((state) => state.completeCurrent);
  const advance = useSessionStore((state) => state.advance);

  const tree = useTreeStore((state) => state.tree);
  const currentNodeId = useTreeStore((state) => state.currentNodeId);
  const history = useTreeStore((state) => state.history);
  const cursor = useTreeStore((state) => state.cursor);
  const answer = useTreeStore((state) => state.answer);
  const goBack = useTreeStore((state) => state.goBack);
  const hydrate = useTreeStore((state) => state.hydrate);

  const [status, setStatus] = useState<Status>("idle");

  const current = session?.current ?? null;
  const requirementId = current?.requirementId ?? null;
  const assetId = current?.assetId ?? null;

  useEffect(() => {
    if (!assetId || !requirementId) {
      return;
    }
    let cancelled = false;
    setStatus("loading");

    apiClient
      .get<unknown>(`/decision-trees/${requirementId}`)
      .then((data) => {
        if (cancelled) {
          return;
        }
        const loaded = DecisionTreeSchema.parse(data);
        const recordedPath =
          useSessionStore
            .getState()
            .session?.evaluations.find(
              (evaluation) =>
                evaluation.assetId === assetId &&
                evaluation.requirementId === requirementId,
            )?.path ?? [];
        hydrate(loaded, recordedPath);
        setStatus("idle");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [assetId, requirementId, hydrate]);

  useEffect(() => {
    if (status !== "idle" || !tree || !currentNodeId || !requirementId) {
      return;
    }
    if (tree.requirementId !== requirementId) {
      return;
    }
    syncProgress(currentNodeId, history.slice(0, cursor));
  }, [status, tree, currentNodeId, history, cursor, requirementId, syncProgress]);

  const currentNode = tree && currentNodeId ? nodeById(tree, currentNodeId) : undefined;
  const path = history.slice(0, cursor);
  const outcome: Outcome | null = tree ? currentOutcome(tree, path) : null;

  const total = session?.evaluations.length ?? 0;
  const done = session?.evaluations.filter((e) => e.status === "completed").length ?? 0;
  const asset = session?.device.assets.find((a) => a.id === assetId) ?? null;

  const goToNext = () => {
    if (!tree || outcome === null) {
      return;
    }
    completeCurrent(outcome, path);
    advance();
  };

  const saveSession = () => {
    if (session) {
      downloadSession(session);
    }
  };

  return {
    status,
    session,
    isCompleted: session?.status === "completed",
    asset,
    requirementId,
    currentNode,
    outcome,
    progress: { done, total },
    answer,
    goBack,
    canGoBack: cursor > 0,
    goToNext,
    saveSession,
  };
}
