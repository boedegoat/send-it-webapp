import { DocumentReference, onSnapshot, DocumentData } from 'firebase/firestore'
import { useEffect, useState } from 'react'

export default function useDocSnapshot(ref: DocumentReference) {
  const [doc, setDoc] = useState<DocumentData>(null)
  useEffect(() => {
    const unsub = onSnapshot(ref, doc => {
      setDoc(doc.data())
    })
    return () => unsub()
  }, [])
  return doc
}
