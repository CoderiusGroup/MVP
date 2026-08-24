// Consultazione dei risultati (UC-27): drill-down asset → requisito e ricostruzione
// del percorso logico (domande→risposte) del requisito selezionato.
import { useEffect, useState } from "react";

import { describePath, type PathQuestion } from "../domain/rules/treeRules";
import { decisionTreeService } from "../services/DecisionTreeService";
import { useSessionStore } from "../store/SessionStore";

export function useResult() {
  const session = useSessionStore((state) => state.session);

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [pathQuestions, setPathQuestions] = useState<PathQuestion[] | null>(null);

  useEffect(() => {
    if (!session || !selectedAssetId || !selectedRequirementId) {
      setPathQuestions(null);
      return;
    }
    const steps =
      session.evaluations.find(
        (e) => e.assetId === selectedAssetId && e.requirementId === selectedRequirementId,
      )?.path ?? [];

    let cancelled = false;
    setPathQuestions(null);
    decisionTreeService
      .getTree(selectedRequirementId)
      .then((tree) => {
        if (!cancelled) {
          setPathQuestions(describePath(tree, steps));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPathQuestions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, selectedAssetId, selectedRequirementId]);

  const selectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setSelectedRequirementId(null);
  };

  return {
    session,
    selectedAssetId,
    selectedRequirementId,
    pathQuestions,
    selectAsset,
    selectRequirement: setSelectedRequirementId,
    clearAsset: () => {
      setSelectedAssetId(null);
      setSelectedRequirementId(null);
    },
    clearRequirement: () => setSelectedRequirementId(null),
  };
}
