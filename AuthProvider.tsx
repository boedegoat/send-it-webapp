import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from 'lib/firebase'
import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext(null)

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    onAuthStateChanged(auth, async newUser => {
      setLoading(false)
      if (newUser) {
        setUser(newUser)
        const userObject: { [key: string]: any } = {
          displayName: newUser.displayName,
          email: newUser.email,
          uid: newUser.uid,
        }
        const thisUser = await getDoc(doc(db, 'users', newUser.uid))
        if (thisUser.exists()) {
          userObject.updatedAt = serverTimestamp()
        } else {
          userObject.createdAt = serverTimestamp()
        }
        await setDoc(doc(db, 'users', newUser.uid), userObject, { merge: true })
      }
    })
  }, [])
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
