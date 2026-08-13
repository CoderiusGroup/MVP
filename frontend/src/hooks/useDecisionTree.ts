import { useEffect, useState } from "react";

import { DecisionTreeSchema } from "../domain/entities/DecisionTree";
import { FetchApiClient } from "../infrastructure/FetchApiClient";
import { useTreeStore } from "../store/TreeStore";

type Status = "idle" | "loading" | "error";

const apiClient = new FetchApiClient();

export function useDecisionTree(treeId: string) {
  const loadTree = useTreeStore((state) => state.loadTree);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    apiClient
      .get<unknown>(`/decision-trees/${treeId}`)
      .then((data) => {
        if (cancelled) {
          return;
        }
        const tree = DecisionTreeSchema.parse(data);
        loadTree(tree);
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
  }, [treeId, loadTree]);

  return { status };
}
