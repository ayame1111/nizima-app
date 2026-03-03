'use client'

import { useFormState } from 'react-dom'
import { resetPassword } from '@/app/actions/auth'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Suspense } from 'react'

export default function ResetPasswordPage() {
  const [state, dispatch] = useFormState(resetPassword, undefined)
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white">
      <div className="bg-[#252525] p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-center">Set New Password</h1>
        
        <Suspense fallback={<div className="text-center">Loading...</div>}>
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
            <div className="text-center">
                <p className="text-red-500">Invalid link. Missing token.</p>
                <Link href="/login" className="text-purple-400 mt-4 block">Back to Login</Link>
            </div>
        )
    }

    return (
        <form action={dispatch} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input name="password" type="password" required minLength={6} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>

          {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
          {state?.success && (
              <div className="text-green-500 text-sm">
                  {state.success}
                  <Link href="/login" className="block mt-2 text-purple-400 underline">Proceed to Login</Link>
              </div>
          )}

          {!state?.success && (
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors">
                Update Password
              </button>
          )}
        </form>
    )
}
