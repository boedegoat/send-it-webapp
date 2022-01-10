import { signOut } from 'firebase/auth'
import { auth } from 'lib/firebase'
import useAuth from 'lib/hooks/useAuth'

export default function UserProfile() {
  const { user } = useAuth()
  return (
    <button
      onClick={async () => {
        await signOut(auth)
        window.location.reload()
      }}
      className='flex items-center font-medium mb-8 mx-auto'
    >
      <img className='rounded-full w-5 h-5 mr-2' src={user.photoURL} />
      {user.displayName}
    </button>
  )
}
