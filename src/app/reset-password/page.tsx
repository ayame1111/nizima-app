'use client'

import { useFormState } from 'react-dom'
import { resetPassword } from '@/app/actions/auth'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Suspense } from 'react'

export default function ResetPasswordPage() {
  const [state, dispatch] = useFormState(resetPassword, undefined)
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm w-full max-w-md border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-500/20">
                A
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set New Password</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Please enter a secure password.</p>
        </div>
        
        <Suspense fallback={<div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>}>
            <TokenForm dispatch={dispatch} state={state} />
        </Suspense>
      </div>
    </div>
  )
}

function TokenForm({ dispatch, state }: { dispatch: any, state: any }) {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    if (!token) {
        return (
            <div className="text-center bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 font-medium">Invalid link. Missing token.</p>
                <Link href="/login" className="text-red-700 dark:text-red-300 font-bold mt-2 block hover:underline">Back to Login</Link>
            </div>
        )
    }

    return (
        <form action={dispatch} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">New Password</label>
            <input name="password" type="password" required minLength={6} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
          </div>

          {state?.error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">{state.error}</p>}
          {state?.success && (
              <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800 text-center">
                  <p className="font-medium mb-2">{state.success}</p>
                  <Link href="/login" className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-xs">Proceed to Login</Link>
              </div>
          )}

          {!state?.success && (
              <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-gray-900/10 dark:shadow-none">
                Update Password
              </button>
          )}
        </form>
    )
}
