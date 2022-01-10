import Head from 'next/head'
import FileUploader from 'components/FileUploader'
import useAuth from 'lib/hooks/useAuth'
import UserProfile from 'components/UserProfile'
import TextInput from 'components/TextInput'
import { RefreshIcon } from '@heroicons/react/outline'
import SignInButton from 'components/SignInButton'

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <div className='max-w-md mx-auto pb-8 px-5 sm:px-0'>
      <Head>
        <title>Send It</title>
      </Head>
      <h1 className='text-4xl mb-8 text-center mt-20'>
        {/* 
          TODO:
          [] make if user in mobile, highlight the mobile emoji, as well in desktop
        */}
        <div className='flex justify-center items-center mb-5'>
          📱 <RefreshIcon className='w-5' /> 💻
        </div>
        <div className='font-bold'>Send It</div>
      </h1>
      {loading ? (
        <div className='text-center'>Loading...</div>
      ) : (
        <>
          {user ? (
            <div>
              <UserProfile />
              <h2 className='font-medium text-xl'>Choose what you want to send</h2>
              <TextInput />
              <FileUploader />
            </div>
          ) : (
            <SignInButton />
          )}
        </>
      )}
    </div>
  )
}
