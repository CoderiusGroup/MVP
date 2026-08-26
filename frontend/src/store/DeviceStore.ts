import { create } from "zustand";

import type { Asset } from "../domain/entities/Asset";
import type { Device } from "../domain/entities/Device";
import { useSessionStore } from "./SessionStore";

export interface DeviceDetailsPatch {
  name: string;
  operatingSystem: string;
  description: string;
}

interface DeviceState {
  device: Device | null;
  payload: unknown;
  setDevice: (device: Device, payload: unknown) => void;
  updateDeviceDetails: (patch: DeviceDetailsPatch) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  reset: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  device: null,
  payload: null,

  setDevice: (device, payload) => {
    set({ device, payload });
    useSessionStore.getState().reset();
  },

  updateDeviceDetails: (patch) => {
    set((state) => (state.device ? { device: { ...state.device, ...patch } } : state));
    useSessionStore.getState().reset();
  },

  addAsset: (asset) => {
    set((state) =>
      state.device
        ? { device: { ...state.device, assets: [...state.device.assets, asset] } }
        : state,
    );
  },

  updateAsset: (asset) => {
    set((state) =>
      state.device
        ? {
            device: {
              ...state.device,
              assets: state.device.assets.map((existing) =>
                existing.id === asset.id ? asset : existing,
              ),
            },
          }
        : state,
    );
  },

  removeAsset: (assetId) => {
    set((state) =>
      state.device
        ? {
            device: {
              ...state.device,
              assets: state.device.assets.filter((asset) => asset.id !== assetId),
            },
          }
        : state,
    );
  },

  reset: () => {
    set({ device: null, payload: null });
    useSessionStore.getState().reset();
  },
}));
