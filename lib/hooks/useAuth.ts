import { AuthContext } from 'AuthProvider'
import { AuthObject } from 'lib/typings/hooks'
import { useContext } from 'react'

export default function useAuth() {
  const { user, loading }: AuthObject = useContext(AuthContext)
  return { user, loading }
}
