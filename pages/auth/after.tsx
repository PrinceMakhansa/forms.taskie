import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Prevent static generation – this page runs only on the client
export const dynamic = 'force-dynamic';
export const getServerSideProps = async () => ({ props: {} });

export default function AuthAfter() {
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/check-admin');
        const data = await res.json();

        if (res.ok && data.isAdmin) {
          router.replace('/admin');
        } else {
          // Not admin: redirect to home or a limited page
          router.replace('/');
        }
      } catch (err) {
        console.error('admin check failed', err);
        router.replace('/');
      }
    }

    checkAdmin();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-600 to-indigo-800">
      <div className="rounded-xl bg-white/6 px-8 py-6 text-center backdrop-blur">
        <h2 className="mb-2 text-2xl font-semibold text-white">Redirecting…</h2>
        <p className="text-sm text-blue-100/80">Checking account and routing you now.</p>
      </div>
    </div>
  );
}
