// Mock authentication system for development without Firebase

export interface MockUser {
  uid: string
  email: string
  displayName?: string | null
  photoURL?: string | null
}

// Mock user database stored in memory
const mockUsers = new Map<string, { email: string; password: string; uid: string }>()

// Initialize with a demo user
mockUsers.set("demo@flashlearn.ai", {
  email: "demo@flashlearn.ai",
  password: "demo123",
  uid: "demo-user-123",
})

let currentUser: MockUser | null = null
const authStateListeners: ((user: MockUser | null) => void)[] = []

// Load user from localStorage on initialization
if (typeof window !== "undefined") {
  const savedUser = localStorage.getItem("mockUser")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
  }
}

function notifyAuthStateChanged() {
  authStateListeners.forEach((listener) => listener(currentUser))
}

function saveUserToStorage(user: MockUser | null) {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem("mockUser", JSON.stringify(user))
    } else {
      localStorage.removeItem("mockUser")
    }
  }
}

export const mockAuth = {
  currentUser,

  onAuthStateChanged(callback: (user: MockUser | null) => void) {
    authStateListeners.push(callback)
    // Immediately call with current user
    callback(currentUser)
    // Return unsubscribe function
    return () => {
      const index = authStateListeners.indexOf(callback)
      if (index > -1) {
        authStateListeners.splice(index, 1)
      }
    }
  },

  async signInWithEmailAndPassword(email: string, password: string): Promise<MockUser> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const user = mockUsers.get(email)
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password")
    }

    currentUser = {
      uid: user.uid,
      email: user.email,
      displayName: null,
      photoURL: null,
    }

    saveUserToStorage(currentUser)
    notifyAuthStateChanged()
    return currentUser
  },

  async createUserWithEmailAndPassword(email: string, password: string): Promise<MockUser> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (mockUsers.has(email)) {
      throw new Error("Email already in use")
    }

    const uid = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    mockUsers.set(email, { email, password, uid })

    currentUser = {
      uid,
      email,
      displayName: null,
      photoURL: null,
    }

    saveUserToStorage(currentUser)
    notifyAuthStateChanged()
    return currentUser
  },

  async signOut(): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    currentUser = null
    saveUserToStorage(null)
    notifyAuthStateChanged()
  },
}
