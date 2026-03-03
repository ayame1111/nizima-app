'use client'

import { useFormState } from 'react-dom'
import { forgotPassword } from '@/app/actions/auth'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [state, dispatch] = useFormState(forgotPassword, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white">
      <div className="bg-[#252525] p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        
        <form action={dispatch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input name="email" type="email" required className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>

          {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
          {state?.success && <p className="text-green-500 text-sm">{state.success}</p>}

          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors">
            Send Reset Link
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          Remember your password? <Link href="/login" className="text-purple-400 hover:text-purple-300">Login</Link>
        </p>
      </div>
    </div>
  )
}
