import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      isDarkMode: false,
      commandPaletteOpen: false,
      notificationPanelOpen: false,
      mobileDrawerOpen: false,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

      toggleMobileDrawer: () =>
        set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
      setMobileDrawerOpen: (val) => set({ mobileDrawerOpen: val }),
      closeMobileDrawer: () => set({ mobileDrawerOpen: false }),

      toggleDarkMode: () =>
        set((state) => {
          const next = !state.isDarkMode
          if (next) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { isDarkMode: next }
        }),

      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),

      openNotificationPanel: () => set({ notificationPanelOpen: true }),
      closeNotificationPanel: () => set({ notificationPanelOpen: false }),
    }),
    {
      name: 'hrms-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        isDarkMode: state.isDarkMode,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync dark mode class on hydration
        if (state?.isDarkMode) {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)

export default useUIStore
