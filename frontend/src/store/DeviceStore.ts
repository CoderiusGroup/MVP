import { create } from "zustand";

import type { Device } from "../domain/entities/Device";

interface DeviceState {
  device: Device | null;
  payload: unknown;
  setDevice: (device: Device, payload: unknown) => void;
  reset: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  device: null,
  payload: null,

  setDevice: (device, payload) => {
    set({ device, payload });
  },

  reset: () => {
    set({ device: null, payload: null });
  },
}));
