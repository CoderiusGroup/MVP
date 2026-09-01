import { create } from "zustand";

import type { Asset } from "../domain/entities/Asset";
import type { Device, DeviceDetailsPatch } from "../domain/entities/Device";
import { useSessionStore } from "./SessionStore";

export type { DeviceDetailsPatch };

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
    set((state) => (state.device ? { device: state.device.withDetails(patch) } : state));
    useSessionStore.getState().reset();
  },

  addAsset: (asset) => {
    set((state) => (state.device ? { device: state.device.withAssetAdded(asset) } : state));
  },

  updateAsset: (asset) => {
    set((state) => (state.device ? { device: state.device.withAssetUpdated(asset) } : state));
  },

  removeAsset: (assetId) => {
    set((state) => (state.device ? { device: state.device.withAssetRemoved(assetId) } : state));
  },

  reset: () => {
    set({ device: null, payload: null });
    useSessionStore.getState().reset();
  },
}));
