"use client"

import { create } from "zustand"

interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  scoreDrawerClientId: string | null
  openScoreDrawer: (clientId: string) => void
  closeScoreDrawer: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  scoreDrawerClientId: null,
  openScoreDrawer: (clientId) => set({ scoreDrawerClientId: clientId }),
  closeScoreDrawer: () => set({ scoreDrawerClientId: null }),
}))
