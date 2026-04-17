import { createContext, useContext, useEffect, useState } from 'react'
import netlifyIdentity from 'netlify-identity-widget'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const options = import.meta.env.VITE_NETLIFY_IDENTITY_URL
      ? { APIUrl: import.meta.env.VITE_NETLIFY_IDENTITY_URL }
      : {}
    netlifyIdentity.init(options)

    netlifyIdentity.on('init', (u) => {
      setUser(u ?? null)
      setLoading(false)
    })

    netlifyIdentity.on('error', () => {
      setLoading(false)
    })

    netlifyIdentity.on('login', (u) => {
      setUser(u)
      netlifyIdentity.close()
    })
    netlifyIdentity.on('logout', () => setUser(null))

    return () => {
      netlifyIdentity.off('init')
      netlifyIdentity.off('login')
      netlifyIdentity.off('logout')
      netlifyIdentity.off('error')
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function openLogin() {
  netlifyIdentity.open('login')
}

export function logout() {
  netlifyIdentity.logout()
}
