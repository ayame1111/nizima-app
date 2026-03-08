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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm w-full max-w-md border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-500/20">
                A
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Join our community of creators and collectors.</p>
        </div>
        
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
            <input name="name" type="text" required className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input name="email" type="email" required className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <input name="password" type="password" required className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
          </div>

          {state?.error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">{state.error}</p>}
          {state?.success && <p className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 dark:border-green-800">{state.success} - <Link href="/login" className="font-bold underline">Login now</Link></p>}

          <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-gray-900/10 dark:shadow-none">
            Register
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account? <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300">Login</Link>
        </p>
      </div>
    </div>
  )
}
