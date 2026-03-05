import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

interface Admin {
  _id: string;
  discordId: string;
  username?: string;
  addedBy: string;
  addedAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [newDiscordId, setNewDiscordId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading, error: fetchError } = useSWR<{ admins: Admin[]; envAdmins: string[] }>(
    status === 'authenticated' ? '/api/admins' : null,
    fetcher
  );

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('discord');
    }
  }, [status]);

  // Check if user is admin
  React.useEffect(() => {
    if (status === 'authenticated' && fetchError) {
      router.push('/admin');
    }
  }, [status, fetchError, router]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: newDiscordId,
          username: newUsername || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add admin');
      }

      setSuccess('Admin added successfully');
      setNewDiscordId('');
      setNewUsername('');
      mutate('/api/admins');
    } catch (err: any) {
      setError(err.message || 'Failed to add admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (id: string, discordId: string) => {
    if (!confirm(`Are you sure you want to remove this admin (${discordId})?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admins/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove admin');
      }

      setSuccess('Admin removed successfully');
      mutate('/api/admins');
    } catch (err: any) {
      setError(err.message || 'Failed to remove admin');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <Layout isAdmin={true}>
        <div className="flex justify-center">
          <div className="animate-spin">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const currentUserId = (session?.user as any)?.id;

  return (
    <Layout title="Manage Admins" isAdmin={true}>
      {/* Back link */}
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 animate-fadeIn">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 animate-fadeIn">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Add Admin Form */}
      <div className="mb-8 rounded-xl border border-warm-gray-200 bg-white p-6 shadow-soft animate-fadeIn">
        <h2 className="text-lg font-bold text-warm-gray-900 mb-4">Add New Admin</h2>
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div>
            <label htmlFor="discordId" className="block text-sm font-medium text-warm-gray-700 mb-1">
              Discord User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="discordId"
              value={newDiscordId}
              onChange={(e) => setNewDiscordId(e.target.value)}
              className="w-full rounded-lg border border-warm-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-warm-gray-700 mb-1">
              Username (optional)
            </label>
            <input
              type="text"
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full rounded-lg border border-warm-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !newDiscordId.trim()}>
            {isSubmitting ? 'Adding...' : 'Add Admin'}
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-warm-gray-200 bg-white p-6 shadow-soft animate-fadeIn">
        <h2 className="text-lg font-bold text-warm-gray-900 mb-4">Admins</h2>

        {/* Developer */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-warm-gray-900">Prince</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Developer</span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-warm-gray-400">1039359961530122391</p>
          </div>
        </div>

        {data?.admins && data.admins.length > 0 ? (
          <div className="space-y-3">
            {data.admins.map((admin, index) => (
              <div
                key={admin._id}
                className="flex items-center justify-between rounded-lg border border-warm-gray-100 bg-warm-gray-50/50 px-4 py-3 opacity-0 animate-fadeInUp"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-warm-gray-900">{admin.discordId}</span>
                    {admin.discordId === currentUserId && (
                      <span className="text-xs text-blue-600">(You)</span>
                    )}
                  </div>
                  {admin.username && (
                    <p className="text-sm text-warm-gray-600">@{admin.username}</p>
                  )}
                  <p className="mt-1 text-xs text-warm-gray-400">
                    Added {new Date(admin.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveAdmin(admin._id, admin.discordId)}
                  disabled={admin.discordId === currentUserId}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${admin.discordId === currentUserId
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warm-gray-100">
              <svg className="h-6 w-6 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-warm-gray-600">No database admins yet.</p>
            <p className="text-sm text-warm-gray-400">Add admins using the form above.</p>
          </div>
        )}
      </div>

      {/* Developed By */}
      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 animate-fadeIn">
        <p className="text-sm font-medium text-blue-700 text-center">Designed & Developed by <span className="font-bold">Prince</span></p>
      </div>
    </Layout>
  );
}
