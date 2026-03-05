import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Layout from '@/components/Layout';
import useSWR from 'swr';
import Link from 'next/link';
import Button from '@/components/Button';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (res.status === 403) {
    throw new Error('Forbidden');
  }
  return res.json();
});

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [canAccessAdmin, setCanAccessAdmin] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: forms, isLoading, error } = useSWR(
    status === 'authenticated' ? '/api/forms?admin=true' : null,
    fetcher
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('discord');
    }
  }, [status]);

  // Check admin/editor access
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetch('/api/auth/check-admin')
        .then(res => res.json())
        .then(data => {
          setIsAdmin(data.isAdmin);
          setCanAccessAdmin(data.canAccessAdmin || data.isAdmin);
          if (!data.canAccessAdmin && !data.isAdmin) {
            router.push('/');
          }
        })
        .catch(() => {
          setCanAccessAdmin(false);
          router.push('/');
        });
    }
  }, [status, session, router]);

  if (status === 'loading' || canAccessAdmin === null) {
    return (
      <Layout>
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



  return (
    <Layout title="Admin Dashboard" isAdmin={true}>

      {/* ── Quick Access Section ── */}
      {isAdmin && (
        <section className="mb-12 animate-fadeIn">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-warm-gray-800 tracking-tight">Quick Access</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Manage Admins card */}
            <Link href="/admin/users" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-soft transition-all duration-200 hover:shadow-soft-lg hover:-translate-y-0.5">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                <h3 className="font-semibold text-warm-gray-900">Manage Admins</h3>
                <p className="mt-1 text-sm text-warm-gray-500">Add or remove admin users</p>
                <div className="mt-4 flex items-center text-xs font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                  Open
                  <svg className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Conversations card — coming soon */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-soft opacity-75 cursor-default">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-sky-400" />
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-warm-gray-900">Conversations</h3>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">Under Development</span>
              </div>
              <p className="mt-1 text-sm text-warm-gray-500">Communicate with responders via Taskie</p>
            </div>
          </div>
        </section>
      )}

      {/* ── My Forms Section ── */}
      <section className="animate-fadeIn" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-warm-gray-800 tracking-tight">My Forms</h2>
          </div>
          {isAdmin && (
            <Link href="/admin/forms/new">
              <Button>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Form
                </span>
              </Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-600">
              Failed to load forms. Please try again.
            </p>
          </div>
        ) : forms && forms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {forms.map((form: any, index: number) => (
              <Link
                key={form._id}
                href={`/admin/forms/${form._id}`}
                className="group opacity-0 animate-fadeInUp"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
              >
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-warm-gray-200 bg-white shadow-soft transition-all duration-200 hover:shadow-soft-lg hover:-translate-y-0.5">
                  {/* Gradient accent bar */}
                  <div className={`h-1.5 w-full ${form.isPublished ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-warm-gray-300 to-warm-gray-400'}`} />

                  <div className="flex flex-1 flex-col p-5">
                    {/* Title & status */}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-bold text-warm-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {form.title}
                      </h3>
                      <span className={`mt-0.5 flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${form.isPublished
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-warm-gray-100 text-warm-gray-500'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${form.isPublished ? 'bg-blue-500' : 'bg-warm-gray-400'}`} />
                        {form.isPublished ? 'Live' : 'Draft'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-warm-gray-500 line-clamp-2 mb-auto">
                      {form.description || 'No description'}
                    </p>

                    {/* Meta footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-warm-gray-100 pt-3">
                      <div className="flex items-center gap-3 text-xs text-warm-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(form.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className="flex items-center text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Manage
                        <svg className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-fadeIn">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {isAdmin ? (
              <>
                <p className="text-warm-gray-600 mb-1">
                  You haven&apos;t created any forms yet.
                </p>
                <p className="text-sm text-warm-gray-400 mb-6">
                  Get started by creating your first form.
                </p>
                <Link href="/admin/forms/new">
                  <Button>Create Your First Form</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-warm-gray-600 mb-1">
                  No forms available.
                </p>
                <p className="text-sm text-warm-gray-400">
                  You&apos;ll see forms here when an admin adds you as an editor.
                </p>
              </>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}
