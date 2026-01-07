import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  role?: 'user' | 'admin'
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        // Map backend user object to frontend format
        const mappedUser = {
          ...user,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        }
        set({ user: mappedUser, token, isAuthenticated: true })
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }))
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

