import { useEffect, useMemo, useState } from "react";

import { DecisionTreeSchema } from "../domain/entities/DecisionTree";
import { transitiveDependents, type DependencyMap } from "../domain/rules/sessionRules";
import { FetchApiClient } from "../infrastructure/FetchApiClient";
import { useSessionStore } from "../store/SessionStore";

const apiClient = new FetchApiClient();

export function useSessionModify() {
  const session = useSessionStore((state) => state.session);
  const select = useSessionStore((state) => state.select);
  const reopen = useSessionStore((state) => state.reopen);

  const requirementIds = useMemo(() => {
    if (!session) {
      return [] as string[];
    }
    return [...new Set(session.evaluations.map((evaluation) => evaluation.requirementId))];
  }, [session]);
  const requirementKey = requirementIds.join(",");

  const [dependencies, setDependencies] = useState<DependencyMap>({});
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (requirementIds.length === 0) {
      return;
    }
    let cancelled = false;

    Promise.all(
      requirementIds.map((id) =>
        apiClient
          .get<unknown>(`/decision-trees/${id}`)
          .then((data) => DecisionTreeSchema.parse(data))
          .catch(() => null),
      ),
    ).then((trees) => {
      if (cancelled) {
        return;
      }
      const nextDependencies: DependencyMap = {};
      const nextNames: Record<string, string> = {};
      for (const tree of trees) {
        if (tree) {
          nextDependencies[tree.requirementId] = tree.dependencies ?? [];
          nextNames[tree.requirementId] = tree.requirementName;
        }
      }
      setDependencies(nextDependencies);
      setNames(nextNames);
    });

    return () => {
      cancelled = true;
    };
  }, [requirementKey]);

  const resume = (assetId: string, requirementId: string) => {
    select(assetId, requirementId);
  };

  const redo = (assetId: string, requirementId: string) => {
    reopen(assetId, requirementId, transitiveDependents(requirementId, dependencies));
  };

  return { session, names, resume, redo };
}
