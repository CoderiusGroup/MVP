import { create } from "zustand";

import type { Device } from "../domain/entities/Device";
import type { Outcome } from "../domain/rules/treeRules";
import type { PathStep, Session } from "../domain/entities/Session";
import {
  createInitialSession,
  reopenEvaluation,
  selectEvaluation,
} from "../domain/rules/sessionRules";

function newSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `SES-${crypto.randomUUID()}`
    : `SES-${Date.now()}`;
}

interface SessionState {
  session: Session | null;
  start: (device: Device) => void;
  resume: (session: Session) => void;
  syncProgress: (nodeId: string, path: PathStep[]) => void;
  completeCurrent: (outcome: Outcome, path: PathStep[]) => void;
  advance: () => void;
  select: (assetId: string, requirementId: string) => void;
  reopen: (assetId: string, requirementId: string, dependents: string[]) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,

  start: (device) => {
    set({ session: createInitialSession(device, newSessionId(), new Date().toISOString()) });
  },

  resume: (session) => {
    set({ session });
  },

  syncProgress: (nodeId, path) => {
    set((state) => {
      const { session } = state;
      if (!session || !session.current) {
        return state;
      }
      const { assetId, requirementId } = session.current;
      return {
        session: {
          ...session,
          current: { ...session.current, nodeId },
          evaluations: session.evaluations.map((evaluation) =>
            evaluation.assetId === assetId &&
            evaluation.requirementId === requirementId &&
            evaluation.status !== "completed"
              ? { ...evaluation, status: "in_progress", path }
              : evaluation,
          ),
        },
      };
    });
  },

  completeCurrent: (outcome, path) => {
    set((state) => {
      const { session } = state;
      if (!session || !session.current) {
        return state;
      }
      const { assetId, requirementId } = session.current;
      return {
        session: {
          ...session,
          evaluations: session.evaluations.map((evaluation) =>
            evaluation.assetId === assetId && evaluation.requirementId === requirementId
              ? { ...evaluation, status: "completed", outcome, path }
              : evaluation,
          ),
        },
      };
    });
  },

  advance: () => {
    set((state) => {
      const { session } = state;
      if (!session) {
        return state;
      }
      const next = session.evaluations.find(
        (evaluation) => evaluation.status !== "completed",
      );
      if (!next) {
        return {
          session: {
            ...session,
            status: "completed",
            current: undefined,
          },
        };
      }
      return {
        session: {
          ...session,
          status: "in_progress",
          current: {
            assetId: next.assetId,
            requirementId: next.requirementId,
            nodeId: "",
          },
        },
      };
    });
  },

  select: (assetId, requirementId) => {
    set((state) =>
      state.session
        ? { session: selectEvaluation(state.session, assetId, requirementId) }
        : state,
    );
  },

  reopen: (assetId, requirementId, dependents) => {
    set((state) =>
      state.session
        ? { session: reopenEvaluation(state.session, assetId, requirementId, dependents) }
        : state,
    );
  },

  reset: () => {
    set({ session: null });
  },
}));
