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
    status === 'authenticated' ? '/api/forms' : null,
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
      <div className="mb-10 flex items-center justify-between animate-fadeIn">
        <h2 className="text-2xl font-bold text-warm-gray-900">
          My Forms
        </h2>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <Link href="/admin/users">
                <Button variant="secondary">Manage Admins</Button>
              </Link>
              <Link href="/admin/forms/new">
                <Button>Create New Form</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            Failed to load forms. Please try again.
          </p>
        </div>
      ) : forms && forms.length > 0 ? (
        <div className="grid gap-5">
          {forms.map((form: any, index: number) => (
            <div
              key={form._id}
              className="flex items-center justify-between rounded-xl border border-warm-gray-200 bg-white p-5 shadow-soft opacity-0 animate-fadeInUp transition-shadow hover:shadow-soft-lg"
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex-1">
                <h3 className="font-bold text-warm-gray-900">{form.title}</h3>
                <p className="mt-1.5 text-sm text-warm-gray-600">
                  {form.description || 'No description'}
                </p>
                <p className="mt-2.5 text-xs text-warm-gray-500">
                  Created {new Date(form.createdAt).toLocaleDateString()} • {form.isPublished ? '🟢 Published' : '⚪ Draft'}
                </p>
              </div>
              <Link href={`/admin/forms/${form._id}`}>
                <Button variant="secondary">Manage</Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 animate-fadeIn">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-warm-gray-600 mb-1">
            You haven&apos;t created any forms yet.
          </p>
          <p className="text-sm text-warm-gray-400 mb-6">
            Get started by creating your first form.
          </p>
          <Link href="/admin/forms/new">
            <Button>Create Your First Form</Button>
          </Link>
        </div>
      )}
    </Layout>
  );
}
