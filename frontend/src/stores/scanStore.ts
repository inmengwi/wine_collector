import { create } from 'zustand';
import type { ScanResult, BatchScanResult, ScannedWine } from '@/types';

type ScanMode = 'single' | 'batch' | 'continuous';

interface ScanState {
  // Scan mode
  mode: ScanMode;
  isScanning: boolean;

  // Single scan result
  singleResult: ScanResult | null;

  // Batch/Continuous scan results
  batchResult: BatchScanResult | null;
  continuousResults: ScanResult[];

  // Selected wines for registration
  selectedWines: Map<number, { wine: ScannedWine; quantity: number; tagIds: string[] }>;

  // Actions
  setMode: (mode: ScanMode) => void;
  setScanning: (scanning: boolean) => void;
  setSingleResult: (result: ScanResult | null) => void;
  setBatchResult: (result: BatchScanResult | null) => void;
  addContinuousResult: (result: ScanResult) => void;
  clearContinuousResults: () => void;
  selectWine: (index: number, wine: ScannedWine, quantity?: number, tagIds?: string[]) => void;
  unselectWine: (index: number) => void;
  updateSelectedWine: (index: number, updates: { quantity?: number; tagIds?: string[] }) => void;
  clearSelection: () => void;
  reset: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  mode: 'single',
  isScanning: false,
  singleResult: null,
  batchResult: null,
  continuousResults: [],
  selectedWines: new Map(),

  setMode: (mode) => set({ mode }),

  setScanning: (isScanning) => set({ isScanning }),

  setSingleResult: (singleResult) => set({ singleResult }),

  setBatchResult: (batchResult) => set({ batchResult }),

  addContinuousResult: (result) =>
    set((state) => ({
      continuousResults: [...state.continuousResults, result],
    })),

  clearContinuousResults: () => set({ continuousResults: [] }),

  selectWine: (index, wine, quantity = 1, tagIds = []) =>
    set((state) => {
      const newMap = new Map(state.selectedWines);
      newMap.set(index, { wine, quantity, tagIds });
      return { selectedWines: newMap };
    }),

  unselectWine: (index) =>
    set((state) => {
      const newMap = new Map(state.selectedWines);
      newMap.delete(index);
      return { selectedWines: newMap };
    }),

  updateSelectedWine: (index, updates) =>
    set((state) => {
      const newMap = new Map(state.selectedWines);
      const current = newMap.get(index);
      if (current) {
        newMap.set(index, { ...current, ...updates });
      }
      return { selectedWines: newMap };
    }),

  clearSelection: () => set({ selectedWines: new Map() }),

  reset: () =>
    set({
      mode: 'single',
      isScanning: false,
      singleResult: null,
      batchResult: null,
      continuousResults: [],
      selectedWines: new Map(),
    }),
}));
