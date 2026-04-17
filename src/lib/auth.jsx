import { createContext, useContext, useEffect, useState } from 'react'
import netlifyIdentity from 'netlify-identity-widget'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    netlifyIdentity.init()

    const currentUser = netlifyIdentity.currentUser()
    setUser(currentUser)
    setLoading(false)

    netlifyIdentity.on('login', (u) => {
      setUser(u)
      netlifyIdentity.close()
    })
    netlifyIdentity.on('logout', () => setUser(null))

    return () => {
      netlifyIdentity.off('login')
      netlifyIdentity.off('logout')
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
