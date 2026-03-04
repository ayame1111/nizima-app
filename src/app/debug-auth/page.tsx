import { auth } from "@/auth";
import { headers } from "next/headers";

export default async function DebugAuthPage() {
  const session = await auth();
  const headersList = headers();
  
  // Safe environment check
  const envCheck = {
    AUTH_URL: process.env.AUTH_URL ? process.env.AUTH_URL : 'NOT_SET',
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || 'NOT_SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET', // Legacy check
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL || 'NOT_SET',
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <h1 className="text-2xl font-bold mb-6 text-red-500">Auth Debugger</h1>
      
      <div className="grid gap-8">
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-blue-400">1. Server-Side Session</h2>
          <pre className="bg-black p-4 rounded overflow-auto text-green-400">
            {JSON.stringify(session, null, 2)}
          </pre>
          {session ? (
            <p className="mt-2 text-green-500">✅ Server has session</p>
          ) : (
            <p className="mt-2 text-red-500">❌ Server has NO session</p>
          )}
        </section>

        <section className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">2. Environment Config</h2>
          <div className="space-y-2">
            {Object.entries(envCheck).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-400">{key}:</span>
                <span className={value === 'NOT_SET' ? 'text-red-500 font-bold' : 'text-white'}>{value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-400">
            * <strong>AUTH_URL</strong> must exactly match your browser URL (https://avataratelier.com).<br/>
            * <strong>AUTH_TRUST_HOST</strong> should be "true" behind Coolify proxy.
          </p>
        </section>

        <section className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-purple-400">3. Request Headers</h2>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
                <span className="text-gray-400">Host:</span>
                <span>{headersList.get('host')}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">X-Forwarded-Proto:</span>
                <span>{headersList.get('x-forwarded-proto')}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">X-Forwarded-Host:</span>
                <span>{headersList.get('x-forwarded-host')}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Cookie (Length):</span>
                <span>{headersList.get('cookie')?.length || 0} chars</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
