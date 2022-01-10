import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth'
import { auth } from 'lib/firebase'

export default function SignInButton() {
  const signIn = async () => {
    const google = new GoogleAuthProvider()
    const { user } = await signInWithRedirect(auth, google)
    console.log(user)
  }

  return (
    <button
      onClick={signIn}
      className='block text-blue-400 font-medium hover:text-blue-600 mx-auto'
    >
      Sign In with Google
    </button>
  )
}
