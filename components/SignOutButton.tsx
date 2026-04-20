'use client'

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      Sign out
    </button>
  )
}
