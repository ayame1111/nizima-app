'use client'

import { useActionState } from 'react' // Next.js 15 hook (or useFormState in 14)
import { register } from '@/app/actions/auth'
import Link from 'next/link'

// Shim for older Next.js if needed, but assuming 15 or latest 14
// If useActionState is not available, try useFormState from react-dom
import { useFormState } from 'react-dom'

export default function RegisterPage() {
  const [state, action] = useFormState(register, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-500/20">
                A
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join our community of creators and collectors.</p>
        </div>
        
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
            <input name="name" type="text" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input name="email" type="email" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input name="password" type="password" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 transition-all" />
          </div>

          {state?.error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">{state.error}</p>}
          {state?.success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded border border-green-100">{state.success} - <Link href="/login" className="font-bold underline">Login now</Link></p>}

          <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-gray-900/10">
            Register
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-purple-600 font-bold hover:text-purple-700">Login</Link>
        </p>
      </div>
    </div>
  )
}
