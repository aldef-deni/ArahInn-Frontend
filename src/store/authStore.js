import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user        : null,
      token       : null,
      refreshToken: null,

      setAuth: (user, token, refreshToken) =>
        set({ user, token, refreshToken }),

      updateUser: (user) =>
        set({ user: { ...get().user, ...user } }),

      logout: () =>
        set({ user: null, token: null, refreshToken: null }),

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
