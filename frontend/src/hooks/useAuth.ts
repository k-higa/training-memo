'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { authApi, User, ApiError } from '@/lib/api'
import { getToken, setToken, removeToken, isAuthenticated } from '@/lib/auth'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false)
      return
    }

    try {
      const userData = await authApi.me()
      setUser(userData)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        removeToken()
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    setToken(response.token)
    setUser(response.user)
    router.push('/dashboard')
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await authApi.register({ email, password, name })
    setToken(response.token)
    setUser(response.user)
    router.push('/dashboard')
  }

  const logout = () => {
    removeToken()
    setUser(null)
    router.push('/login')
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }
}

export function useRequireAuth() {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push('/login')
    }
  }, [auth.loading, auth.isAuthenticated, router])

  return auth
}

