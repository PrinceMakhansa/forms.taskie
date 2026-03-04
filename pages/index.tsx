import React, { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import BlurText from '@/components/BlurText';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [canAccessAdmin, setCanAccessAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/auth/check-admin')
        .then((res) => res.json())
        .then((data) => setCanAccessAdmin(data.canAccessAdmin || data.isAdmin))
        .catch(() => setCanAccessAdmin(false));
    }
  }, [status]);

  return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-4xl px-6 py-16 text-center">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white border-2 border-blue-200 px-8 py-12 shadow-md">
            <p className="mb-2 text-sm font-semibold uppercase text-blue-600">Powered by</p>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-blue-700">
              <BlurText
                text="Taskie"
                animateBy="letters"
                direction="top"
                delay={80}
                stepDuration={0.4}
                className="text-4xl font-extrabold tracking-tight text-blue-700"
              />
            </h1>
            <p className="mx-auto max-w-xl text-base text-blue-600/90">Build and manage forms quickly.</p>

            <div className="mt-8 flex justify-center">
              {status === 'loading' || (status === 'authenticated' && canAccessAdmin === null) ? (
                <p className="text-sm text-blue-500">Loading…</p>
              ) : status === 'unauthenticated' ? (
                <Button
                  size="lg"
                  onClick={() => signIn('discord', { callbackUrl: '/auth/after' })}
                >
                  Login
                </Button>
              ) : canAccessAdmin ? (
                <Button size="lg" onClick={() => router.push('/admin')}>
                  View Dashboard
                </Button>
              ) : (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 text-center">
                  <p className="text-sm text-blue-700">
                    You don&apos;t have access to this app.
                  </p>
                  <p className="mt-1 font-semibold text-blue-900">
                    Contact <span className="font-bold">pr1nce.28</span> on Discord for access.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
