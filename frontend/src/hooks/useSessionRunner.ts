// Orchestra la sessione guidata: dashboard → asset → dettaglio requisito → esecuzione
// dell'albero. La fase è stato di navigazione locale; l'albero viene caricato e idratato
// solo durante la fase "tree".
import { useEffect, useState } from "react";

import { getEvaluationProgress } from "../domain/rules/sessionRules";
import type { Session } from "../domain/entities/Session";
import { currentOutcome, nodeById, type Outcome } from "../domain/rules/treeRules";
import { decisionTreeService } from "../services/DecisionTreeService";
import { downloadSession } from "../services/SessionService";
import { useSessionStore } from "../store/SessionStore";
import { useTreeStore } from "../store/TreeStore";

type Status = "idle" | "loading" | "error";
type Phase = "dashboard" | "asset" | "requirement" | "tree";

interface RequirementDetail {
  name: string;
  dependencies: string[];
}

// UC-26: riprendendo una sessione interrotta a metà di un albero si rientra nel tree;
// altrimenti si parte dalla dashboard.
function initialPhase(session: Session | null): Phase {
  const current = session?.current;
  if (!current) {
    return "dashboard";
  }
  const evaluation = session.evaluations.find(
    (e) => e.assetId === current.assetId && e.requirementId === current.requirementId,
  );
  return evaluation?.status === "in_progress" ? "tree" : "dashboard";
}

export function useSessionRunner() {
  const session = useSessionStore((state) => state.session);
  const syncProgress = useSessionStore((state) => state.syncProgress);
  const completeCurrent = useSessionStore((state) => state.completeCurrent);
  const select = useSessionStore((state) => state.select);
  const resetSession = useSessionStore((state) => state.reset);

  const tree = useTreeStore((state) => state.tree);
  const currentNodeId = useTreeStore((state) => state.currentNodeId);
  const history = useTreeStore((state) => state.history);
  const cursor = useTreeStore((state) => state.cursor);
  const answer = useTreeStore((state) => state.answer);
  const goBack = useTreeStore((state) => state.goBack);
  const hydrate = useTreeStore((state) => state.hydrate);
  const resetTree = useTreeStore((state) => state.reset);

  const [status, setStatus] = useState<Status>("idle");
  const initialSession = useSessionStore.getState().session;
  const [phase, setPhase] = useState<Phase>(() => initialPhase(initialSession));
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    () => initialSession?.current?.assetId ?? null,
  );
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(
    () => initialSession?.current?.requirementId ?? null,
  );
  const [requirementDetail, setRequirementDetail] = useState<RequirementDetail | null>(null);

  // Coppia in esecuzione: la coppia corrente della sessione, attivata da select().
  const treeAssetId = session?.current?.assetId ?? null;
  const treeRequirementId = session?.current?.requirementId ?? null;

  useEffect(() => {
    if (phase !== "tree" || !treeAssetId || !treeRequirementId) {
      return;
    }
    let cancelled = false;
    setStatus("loading");

    decisionTreeService
      .getTree(treeRequirementId)
      .then((loaded) => {
        if (cancelled) {
          return;
        }
        const recordedPath =
          useSessionStore
            .getState()
            .session?.evaluations.find(
              (e) => e.assetId === treeAssetId && e.requirementId === treeRequirementId,
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
  }, [phase, treeAssetId, treeRequirementId, hydrate]);

  useEffect(() => {
    if (phase !== "tree" || status !== "idle" || !tree || !currentNodeId || !treeRequirementId) {
      return;
    }
    if (tree.requirementId !== treeRequirementId) {
      return;
    }
    syncProgress(currentNodeId, history.slice(0, cursor));
  }, [phase, status, tree, currentNodeId, history, cursor, treeRequirementId, syncProgress]);

  // UC-21/21.1: nel dettaglio requisito servono nome e dipendenze; li leggo dall'albero
  // (fetch cached, riusato poi dalla fase tree) senza toccare il TreeStore.
  useEffect(() => {
    if (phase !== "requirement" || !selectedRequirementId) {
      return;
    }
    let cancelled = false;
    setRequirementDetail(null);

    decisionTreeService
      .getTree(selectedRequirementId)
      .then((loaded) => {
        if (!cancelled) {
          setRequirementDetail({ name: loaded.requirementName, dependencies: loaded.dependencies ?? [] });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequirementDetail(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [phase, selectedRequirementId]);

  const currentNode = tree && currentNodeId ? nodeById(tree, currentNodeId) : undefined;
  const path = history.slice(0, cursor);
  const outcome: Outcome | null = tree ? currentOutcome(tree, path) : null;

  const treeAsset = session?.device.assets.find((a) => a.id === treeAssetId) ?? null;
  const selectedAsset = session?.device.assets.find((a) => a.id === selectedAssetId) ?? null;
  const progress = session
    ? getEvaluationProgress(session, session.current?.assetId)
    : { assetsDone: 0, assetsTotal: 0, reqDone: 0, reqTotal: 0 };

  const openAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setPhase("asset");
  };

  const openRequirement = (assetId: string, requirementId: string) => {
    setSelectedAssetId(assetId);
    setSelectedRequirementId(requirementId);
    setPhase("requirement");
  };

  const startRequirement = () => {
    if (!selectedAssetId || !selectedRequirementId) {
      return;
    }
    // Azzera l'albero precedente: due coppie con lo stesso codice requisito
    // condividono requirementId e l'albero stale contaminerebbe la nuova coppia.
    resetTree();
    select(selectedAssetId, selectedRequirementId);
    setPhase("tree");
  };

  const backToDashboard = () => setPhase("dashboard");
  const backToAsset = () => setPhase("asset");

  // UC-23: registrato l'esito della foglia si torna alla vista asset per il prossimo requisito.
  const confirmOutcome = () => {
    if (!tree || outcome === null) {
      return;
    }
    completeCurrent(outcome, path);
    setPhase("asset");
  };

  const saveSession = () => {
    if (session) {
      downloadSession(session);
    }
  };

  // UC-24: uscita anticipata — termina la sessione scartandone lo stato in memoria.
  const endSession = () => {
    resetTree();
    resetSession();
  };

  return {
    phase,
    status,
    session,
    isCompleted: session?.status === "completed",
    progress,
    selectedAsset,
    selectedRequirementId,
    requirementDetail,
    asset: treeAsset,
    requirementId: treeRequirementId,
    tree,
    currentNodeId,
    path,
    currentNode,
    outcome,
    answer,
    goBack,
    canGoBack: cursor > 0,
    openAsset,
    openRequirement,
    startRequirement,
    backToDashboard,
    backToAsset,
    confirmOutcome,
    saveSession,
    endSession,
  };
}
