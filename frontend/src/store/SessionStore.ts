import { create } from "zustand";

import type { Device } from "../domain/entities/Device";
import type { Outcome } from "../domain/rules/treeRules";
import type { PathStep, Session } from "../domain/entities/Session";
import {
  createInitialSession,
  matchesPlan,
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
  ensureSession: (device: Device) => void;
  resume: (session: Session) => void;
  syncProgress: (nodeId: string, path: PathStep[]) => void;
  completeCurrent: (outcome: Outcome, path: PathStep[]) => void;
  select: (assetId: string, requirementId: string) => void;
  reopen: (assetId: string, requirementId: string, dependents: string[]) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,

  start: (device) => {
    set({ session: createInitialSession(device, newSessionId(), new Date().toISOString()) });
  },

  ensureSession: (device) => {
    set((state) => {
      const { session } = state;
      // Riprende la sessione solo se è dello stesso device e il piano non è cambiato;
      // altrimenti ne avvia una nuova. Aggiorna comunque lo snapshot del device.
      if (!session || session.device.id !== device.id || !matchesPlan(session, device)) {
        return {
          session: createInitialSession(device, newSessionId(), new Date().toISOString()),
        };
      }
      return { session: { ...session, device } };
    });
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
      const evaluations = session.evaluations.map((evaluation) =>
        evaluation.assetId === assetId && evaluation.requirementId === requirementId
          ? { ...evaluation, status: "completed" as const, outcome, path }
          : evaluation,
      );
      const allCompleted = evaluations.every((evaluation) => evaluation.status === "completed");
      return {
        session: {
          ...session,
          evaluations,
          status: allCompleted ? "completed" : session.status,
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
