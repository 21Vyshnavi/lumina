import { create } from 'zustand'
import { api } from '../services/api'
import type { AuthState, User } from '../types'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('lumina_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('lumina_token', data.access_token)
      set({ token: data.access_token, isLoading: false })
      const me = await api.get('/auth/me')
      set({ user: me.data })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true })
    try {
      await api.post('/auth/register', { email, username, password })
      set({ isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  logout: () => {
    localStorage.removeItem('lumina_token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    const token = localStorage.getItem('lumina_token')
    if (!token) return
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data as User, token })
    } catch {
      localStorage.removeItem('lumina_token')
      set({ user: null, token: null })
    }
  },
}))
