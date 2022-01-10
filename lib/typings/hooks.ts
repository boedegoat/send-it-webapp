import { User } from 'firebase/auth'

export interface AuthObject {
  user: User
  loading: boolean
}
