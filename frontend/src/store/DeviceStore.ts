import { create } from "zustand";

import type { Asset } from "../domain/entities/Asset";
import type { Device } from "../domain/entities/Device";

interface DeviceState {
  device: Device | null;
  payload: unknown;
  assets: Asset[];
  setDevice: (device: Device, payload: unknown) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  reset: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  device: null,
  payload: null,
  assets: [],

  setDevice: (device, payload) => {
    set({ device, payload, assets: [] });
  },

  addAsset: (asset) => {
    set((state) => ({ assets: [...state.assets, asset] }));
  },

  removeAsset: (assetId) => {
    set((state) => ({ assets: state.assets.filter((asset) => asset.id !== assetId) }));
  },

  reset: () => {
    set({ device: null, payload: null, assets: [] });
  },
}));
