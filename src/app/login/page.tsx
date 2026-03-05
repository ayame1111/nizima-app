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
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input name="email" type="email" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input name="password" type="password" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 transition-all" />
          </div>

          {errorMessage && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">{errorMessage}</p>}

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-gray-900/10">
            Login
          </button>
        </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-500/20">
                A
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">Please enter your details to sign in.</p>
        </div>
        
        <Suspense fallback={<div className="text-center text-gray-500">Loading form...</div>}>
            <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-sm text-gray-500">
          Don't have an account? <Link href="/register" className="text-purple-600 font-bold hover:text-purple-700">Register</Link>
        </p>
      </div>
    </div>
  )
}
