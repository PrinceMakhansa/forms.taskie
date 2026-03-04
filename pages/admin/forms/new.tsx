import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Layout from '@/components/Layout';
import FormBuilder from '@/components/FormBuilder';
import { FormField, FormSection } from '@/lib/validation';

export default function NewFormPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('discord');
    }
  }, [status]);

  // Check admin status
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetch('/api/auth/check-admin')
        .then(res => res.json())
        .then(data => {
          setIsAdmin(data.isAdmin);
          if (!data.isAdmin) {
            router.push('/');
          }
        })
        .catch(() => {
          setIsAdmin(false);
          router.push('/');
        });
    }
  }, [status, session, router]);

  if (status === 'loading' || isAdmin === null) {
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

  const handleSave = async (fields: FormField[], sections: FormSection[]) => {
    if (!title.trim()) {
      setError('Please enter a form title');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          fields,
          sections,
          isPublished: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create form');
      }

      const data = await response.json();
      router.push(`/admin/forms/${data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Create New Form" isAdmin={true}>
      <div className="mx-auto max-w-4xl">
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-warm-gray-600 transition-colors hover:text-warm-gray-900"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Form Header - Google Forms style */}
        <div className="mb-10 overflow-hidden rounded-xl border border-warm-gray-200 bg-white shadow-soft opacity-0 animate-fadeInUp" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="h-[6px] w-full bg-blue-600" />
          <div className="p-7">
            <div className="pb-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Form"
                className="w-full border-none bg-transparent text-4xl font-bold text-warm-gray-900 placeholder-warm-gray-400 focus:outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                placeholder="Form description (optional)"
                rows={1}
                className="mt-3 w-full border-none bg-transparent text-warm-gray-600 placeholder-warm-gray-400 focus:outline-none resize-none overflow-hidden"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Form Builder */}
        <div className="rounded-xl border border-warm-gray-200 bg-white p-7 shadow-soft opacity-0 animate-fadeInUp" style={{ animationDelay: '120ms', animationFillMode: 'forwards' }}>
          <h3 className="mb-7 text-lg font-semibold text-warm-gray-900">
            Form Fields
          </h3>
          <FormBuilder onSave={handleSave} isLoading={isLoading} />
        </div>
      </div>
    </Layout>
  );
}
