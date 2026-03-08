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
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input name="email" type="email" required className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <input name="password" type="password" required className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
          </div>

          {errorMessage && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">{errorMessage}</p>}

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-gray-900/10 dark:shadow-none">
            Login
          </button>
        </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm w-full max-w-md border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-500/20">
                A
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Please enter your details to sign in.</p>
        </div>
        
        <Suspense fallback={<div className="text-center text-gray-500 dark:text-gray-400">Loading form...</div>}>
            <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account? <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300">Register</Link>
        </p>
      </div>
    </div>
  )
}
