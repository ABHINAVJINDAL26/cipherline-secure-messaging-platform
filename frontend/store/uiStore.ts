import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  isNewChatOpen: boolean;
  isNewGroupOpen: boolean;
  isProfileOpen: boolean;
  isSettingsOpen: boolean;
  isGroupInfoOpen: boolean;
  toasts: Toast[];
  commandPaletteOpen: boolean;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setNewChatOpen: (open: boolean) => void;
  setNewGroupOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setGroupInfoOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  sidebarOpen: true,
  isNewChatOpen: false,
  isNewGroupOpen: false,
  isProfileOpen: false,
  isSettingsOpen: false,
  isGroupInfoOpen: false,
  toasts: [],
  commandPaletteOpen: false,

  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('signal-theme', theme);
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setNewChatOpen: (open) => set({ isNewChatOpen: open }),
  setNewGroupOpen: (open) => set({ isNewGroupOpen: open }),
  setProfileOpen: (open) => set({ isProfileOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setGroupInfoOpen: (open) => set({ isGroupInfoOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    // Auto-remove after duration
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
