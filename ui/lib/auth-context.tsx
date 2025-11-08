"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { mockAuth, type MockUser } from "./mock-auth"

interface AuthContextType {
  user: MockUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = mockAuth.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    await mockAuth.signInWithEmailAndPassword(email, password)
  }

  const signUp = async (email: string, password: string) => {
    await mockAuth.createUserWithEmailAndPassword(email, password)
  }

  const signOut = async () => {
    await mockAuth.signOut()
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
