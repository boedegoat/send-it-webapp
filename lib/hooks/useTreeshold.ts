import { useEffect } from 'react'

interface TreesholdOptions {
  delay?: number
}

export default function useTreeshold(input, callback, options?: TreesholdOptions) {
  useEffect(() => {
    const textInputTimeout = setTimeout(async () => {
      callback()
    }, options?.delay || 300) // treeshold
    return () => clearTimeout(textInputTimeout)
  }, [input])
}
