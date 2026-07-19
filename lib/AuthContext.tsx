import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

const LOADING_TIMEOUT_MS = 8000

interface AuthContextType {
  session: Session | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true, error: null })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const clock = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !clock.current) {
        clock.current = true
        setLoading(false)
        setError('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.')
      }
    }, LOADING_TIMEOUT_MS)

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        if (!clock.current) {
          clock.current = true
          setSession(s)
          setLoading(false)
          clearTimeout(timer)
        }
      })
      .catch((err) => {
        if (!clock.current) {
          clock.current = true
          console.error('Auth getSession error:', err)
          setLoading(false)
          setError('Error de autenticación. Recarga la página.')
          clearTimeout(timer)
        }
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setError(null)
    })

    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
