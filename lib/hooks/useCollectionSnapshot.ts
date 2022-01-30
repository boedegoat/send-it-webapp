import { onSnapshot, DocumentData, CollectionReference, Query } from 'firebase/firestore'
import { useEffect, useState } from 'react'

export default function useCollectionSnapshot(ref: CollectionReference | Query<DocumentData>) {
  const [collection, setCollection] = useState<DocumentData[]>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  useEffect(() => {
    const unsub = onSnapshot(ref, querySnapshot => {
      let newCollection = []
      querySnapshot.forEach(doc => {
        newCollection = [...newCollection, { id: doc.id, ...doc.data() }]
      })
      setCollection(newCollection)
    })
    return () => unsub()
  }, [])
  useEffect(() => {
    if (collection?.length) {
      setIsAvailable(true)
    } else {
      setIsAvailable(false)
    }
  }, [collection])
  return [collection, isAvailable] as [DocumentData[], boolean]
}
