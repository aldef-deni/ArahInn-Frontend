import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user        : null,
      token       : null,
      refreshToken: null,
      // Batas waktu sesi (ISO string). Diisi hanya untuk akun pengelola
      // kelola.arahinn.com — setelah lewat, wajib login ulang.
      expiresAt   : null,

      setAuth: (user, token, refreshToken, expiresAt = null) =>
        set({ user, token, refreshToken, expiresAt }),

      updateUser: (user) =>
        set({ user: { ...get().user, ...user } }),

      logout: () =>
        set({ user: null, token: null, refreshToken: null, expiresAt: null }),

      isAdmin: () => {
        const adminRoles = ['superadmin','admin','admin_property','finance','design_interior','owner']
        return adminRoles.includes(get().user?.role)
      },

      isSuperAdmin    : () => get().user?.role === 'superadmin',
      isOwner         : () => get().user?.role === 'owner',
      isFinance       : () => get().user?.role === 'finance',
      isDesignInterior: () => get().user?.role === 'design_interior',
    }),
    { name: 'ota-auth' }
  )
)
