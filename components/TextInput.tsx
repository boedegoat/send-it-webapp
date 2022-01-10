import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from 'lib/firebase'
import useAuth from 'lib/hooks/useAuth'
import useDocSnapshot from 'lib/hooks/useDocSnapshot'
import useTreeshold from 'lib/hooks/useTreeshold'
import { useEffect, useState } from 'react'

export default function TextInput() {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const userDoc = useDocSnapshot(doc(db, 'users', user?.uid))

  useEffect(() => {
    if (!userDoc) return
    setText(userDoc.text)
  }, [userDoc])

  useTreeshold(text, async () => {
    if (!user) return
    await setDoc(
      doc(db, 'users', user.uid),
      { text, updatedAt: serverTimestamp() },
      { merge: true }
    )
  })

  return (
    <textarea
      className='textarea'
      placeholder='📃 Text or 🔗 Link'
      value={text}
      onChange={e => setText(e.target.value)}
      autoFocus
    ></textarea>
  )
}
