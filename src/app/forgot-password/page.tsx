'use client'

import { useFormState } from 'react-dom'
import { forgotPassword } from '@/app/actions/auth'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [state, dispatch] = useFormState(forgotPassword, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-500/20">
                A
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your email to receive a reset link.</p>
        </div>
        
        <form action={dispatch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email Address</label>
            <input name="email" type="email" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 transition-all" />
          </div>

          {state?.error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">{state.error}</p>}
          {state?.success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded border border-green-100">{state.success}</p>}

          <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-gray-900/10">
            Send Reset Link
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Remember your password? <Link href="/login" className="text-purple-600 font-bold hover:text-purple-700">Login</Link>
        </p>
      </div>
    </div>
  )
}
