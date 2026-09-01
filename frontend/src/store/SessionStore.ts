import { create } from "zustand";

import type { Device } from "../domain/entities/Device";
import type { Outcome } from "../domain/rules/treeRules";
import { Session, type PathStep } from "../domain/entities/Session";

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
    set({ session: Session.start(device, newSessionId(), new Date().toISOString()) });
  },

  ensureSession: (device) => {
    set((state) => {
      const { session } = state;
      // Riprende la sessione solo se è dello stesso device e il piano non è cambiato;
      // altrimenti ne avvia una nuova. Aggiorna comunque lo snapshot del device.
      if (!session || session.device.id !== device.id || !session.matchesPlan(device)) {
        return { session: Session.start(device, newSessionId(), new Date().toISOString()) };
      }
      return { session: session.withDevice(device) };
    });
  },

  resume: (session) => {
    set({ session });
  },

  syncProgress: (nodeId, path) => {
    set((state) => (state.session ? { session: state.session.syncProgress(nodeId, path) } : state));
  },

  completeCurrent: (outcome, path) => {
    set((state) =>
      state.session ? { session: state.session.completeCurrent(outcome, path) } : state,
    );
  },

  select: (assetId, requirementId) => {
    set((state) =>
      state.session ? { session: state.session.selectEvaluation(assetId, requirementId) } : state,
    );
  },

  reopen: (assetId, requirementId, dependents) => {
    set((state) =>
      state.session
        ? { session: state.session.reopenEvaluation(assetId, requirementId, dependents) }
        : state,
    );
  },

  reset: () => {
    set({ session: null });
  },
}));
