import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Returns { session, isAdmin, ready }. Admin = a row exists in `admins` for this user.
export function useAuth() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!session) {
      setIsAdmin(false)
      setReady(true)
      return
    }
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setIsAdmin(!!data)
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  return { session, isAdmin, ready }
}
