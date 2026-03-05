'use client'

import { useFormState } from 'react-dom'
import { authenticate } from '@/app/actions/login'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [errorMessage, dispatch] = useFormState(authenticate, undefined)

  return (
        <form action={dispatch} className="space-y-4">
          <input type="hidden" name="redirectTo" value={callbackUrl} />
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input name="email" type="email" required className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input name="password" type="password" required className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>

          {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors">
            Login
          </button>
        </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white">
      <div className="bg-[#252525] p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome Back</h1>
        
        <Suspense fallback={<div>Loading form...</div>}>
            <LoginForm />
        </Suspense>

        <p className="mt-4 text-center text-sm text-gray-400">
          Don't have an account? <Link href="/register" className="text-purple-400 hover:text-purple-300">Register</Link>
        </p>
      </div>
    </div>
  )
}
