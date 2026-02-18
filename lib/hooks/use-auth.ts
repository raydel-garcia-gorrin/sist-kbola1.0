// lib/hooks/use-auth.ts
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event)
        setUser(session?.user ?? null)
        
        if (event === 'SIGNED_IN') {
          router.push('/dashboard')
          router.refresh()
        }
        
        if (event === 'SIGNED_OUT') {
          router.push('/')
          router.refresh()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      // La redirección se maneja en onAuthStateChange
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión')
      throw error
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Sesión cerrada exitosamente')
      // La redirección se maneja en onAuthStateChange
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar sesión')
    }
  }

  return {
    user,
    loading,
    login,
    logout,
  }
}