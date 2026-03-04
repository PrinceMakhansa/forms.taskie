import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Layout from '@/components/Layout';
import FormBuilder from '@/components/FormBuilder';
import Button from '@/components/Button';
import useSWR from 'swr';
import { FormField, FormSection } from '@/lib/validation';
import { IForm } from '@/models/Form';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ─── Toast notification ─────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeInUp">
      <div className={`flex items-center gap-3 rounded-lg px-5 py-3 shadow-lg text-sm font-medium ${
        type === 'success'
          ? 'bg-blue-600 text-white'
          : 'bg-red-600 text-white'
      }`}>
        {type === 'success' ? (
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {message}
      </div>
    </div>
  );
}

export default function FormDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [canAccessAdmin, setCanAccessAdmin] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'responses' | 'settings'>('questions');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  // Redirect 'new' to the dedicated new form page
  useEffect(() => {
    if (id === 'new') router.replace('/admin/forms/new');
  }, [id, router]);

  useEffect(() => {
    if (status === 'unauthenticated') signIn('discord');
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetch('/api/auth/check-admin')
        .then(res => res.json())
        .then(data => {
          setIsAdmin(data.isAdmin);
          setCanAccessAdmin(data.canAccessAdmin || data.isAdmin);
          if (!data.canAccessAdmin && !data.isAdmin) router.push('/');
        })
        .catch(() => { setCanAccessAdmin(false); router.push('/'); });
    }
  }, [status, session, router]);

  const { data: form, isLoading, error, mutate } = useSWR<IForm>(
    status === 'authenticated' && canAccessAdmin && id && id !== 'new' ? `/api/forms/${id}` : null,
    fetcher
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Editors state
  const [editors, setEditors] = useState<string[]>([]);
  const [newEditorId, setNewEditorId] = useState('');
  const [editorsError, setEditorsError] = useState<string | null>(null);
  const [editorsSaving, setEditorsSaving] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsTotalPages, setSubmissionsTotalPages] = useState(1);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0); // For individual response navigation

  useEffect(() => {
    if (form) {
      setFormTitle(form.title);
      setFormDescription(form.description || '');
      setEditors((form as any).editors || []);
    }
  }, [form]);

  // Fetch submissions when on responses tab
  useEffect(() => {
    if (activeTab === 'responses' && id) {
      fetchAllSubmissions();
    }
  }, [activeTab, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      // Fetch all submissions for navigation (limit 100 for performance)
      const res = await fetch(`/api/forms/${id}/submissions?page=1&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
        setSubmissionCount(data.total);
        setSubmissionsPage(data.page);
        setSubmissionsTotalPages(data.totalPages);
        setCurrentResponseIndex(0);
      }
    } catch {
      showToast('Failed to load responses', 'error');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchSubmissions = async (page: number) => {
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`/api/forms/${id}/submissions?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
        setSubmissionCount(data.total);
        setSubmissionsPage(data.page);
        setSubmissionsTotalPages(data.totalPages);
      }
    } catch {
      showToast('Failed to load responses', 'error');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleSaveForm = async (fields: FormField[], sections: FormSection[]) => {
    if (!formTitle.trim()) {
      showToast('Form title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          fields,
          sections,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to save form', 'error');
        return;
      }

      await mutate();
      showToast('Form saved successfully');
    } catch {
      showToast('An error occurred while saving', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !form?.isPublished }),
      });
      if (res.ok) {
        await mutate();
        showToast(form?.isPublished ? 'Form unpublished' : 'Form published successfully');
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/forms/${form?._id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleDeleteForm = async () => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin');
      } else {
        showToast('Failed to delete form', 'error');
      }
    } catch {
      showToast('Error deleting form', 'error');
    }
  };

  const handleDeleteAllSubmissions = async () => {
    if (!confirm(`Delete all ${submissionCount} responses? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/forms/${id}/submissions`, { method: 'DELETE' });
      if (res.ok) {
        showToast('All responses deleted');
        fetchAllSubmissions();
      } else {
        showToast('Failed to delete responses', 'error');
      }
    } catch {
      showToast('Error deleting responses', 'error');
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Delete this response? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/forms/${id}/submissions?submissionId=${submissionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Response deleted');
        // Update local state
        const newSubmissions = submissions.filter((s: any) => s._id !== submissionId);
        setSubmissions(newSubmissions);
        setSubmissionCount((prev) => prev - 1);
        // Adjust current index if needed
        if (currentResponseIndex >= newSubmissions.length && newSubmissions.length > 0) {
          setCurrentResponseIndex(newSubmissions.length - 1);
        }
      } else {
        showToast('Failed to delete response', 'error');
      }
    } catch {
      showToast('Error deleting response', 'error');
    }
  };

  const handlePrintResponse = () => {
    window.print();
  };

  const getDiscordAvatarUrl = (userId: string, avatarHash: string | undefined): string => {
    if (!avatarHash) {
      // Default Discord avatar
      const defaultIndex = parseInt(userId) % 5;
      return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    }
    const ext = avatarHash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}`;
  };

  // Discord ID validation (snowflake format: 17-19 digit number)
  const isValidDiscordId = (id: string): boolean => {
    return /^\d{17,19}$/.test(id.trim());
  };

  const handleAddEditor = async () => {
    const trimmedId = newEditorId.trim();
    setEditorsError(null);

    if (!trimmedId) {
      setEditorsError('Please enter a Discord ID');
      return;
    }

    if (!isValidDiscordId(trimmedId)) {
      setEditorsError('Invalid Discord ID format (should be 17-19 digits)');
      return;
    }

    if (editors.includes(trimmedId)) {
      setEditorsError('This user is already an editor');
      return;
    }

    if (trimmedId === (form as any)?.createdBy) {
      setEditorsError('Cannot add the form owner as an editor');
      return;
    }

    setEditorsSaving(true);
    try {
      const updatedEditors = [...editors, trimmedId];
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editors: updatedEditors }),
      });

      if (res.ok) {
        setEditors(updatedEditors);
        setNewEditorId('');
        showToast('Editor added successfully');
        await mutate();
      } else {
        const data = await res.json();
        setEditorsError(data.error || 'Failed to add editor');
      }
    } catch {
      setEditorsError('An error occurred');
    } finally {
      setEditorsSaving(false);
    }
  };

  const handleRemoveEditor = async (editorId: string) => {
    setEditorsSaving(true);
    try {
      const updatedEditors = editors.filter((e) => e !== editorId);
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editors: updatedEditors }),
      });

      if (res.ok) {
        setEditors(updatedEditors);
        showToast('Editor removed');
        await mutate();
      } else {
        showToast('Failed to remove editor', 'error');
      }
    } catch {
      showToast('An error occurred', 'error');
    } finally {
      setEditorsSaving(false);
    }
  };

  // ── Loading / Auth states ───────────────────────────────────────────────
  if (status === 'loading' || canAccessAdmin === null) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
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

  if (status === 'unauthenticated' || !canAccessAdmin || id === 'new') return null;

  if (isLoading || error || !form) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-xl font-medium text-gray-900">
            {error ? 'Form not found' : 'Loading...'}
          </h2>
        </div>
      </Layout>
    );
  }

  const formLink = typeof window !== 'undefined' ? `${window.location.origin}/forms/${form._id}` : '';

  return (
    <Layout isAdmin={true}>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Back button */}
      <button
        onClick={() => router.push('/admin')}
        className="mb-5 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {/* Form Header */}
      <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm animate-fadeIn">
        <div className="h-[10px] w-full bg-blue-600 rounded-t-lg" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Untitled Form"
                className="w-full border-none bg-transparent text-2xl font-normal text-gray-900 placeholder-gray-400 focus:outline-none"
                style={{ fontFamily: "'Google Sans', 'Segoe UI', Roboto, sans-serif" }}
              />
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Form description"
                className="mt-2 w-full border-none bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                form.isPublished
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${form.isPublished ? 'bg-blue-500' : 'bg-gray-400'}`} />
                {form.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center border-b border-gray-200">
        {(['questions', 'responses', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab === 'questions' && (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {tab === 'responses' && (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
              {tab === 'settings' && (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'responses' && submissionCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700">
                  {submissionCount}
                </span>
              )}
            </span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {/* ─── Questions Tab ────────────────────────────────────────────── */}
        {activeTab === 'questions' && (
          <div className="mx-auto max-w-3xl">
            <FormBuilder
              initialFields={form.fields || []}
              initialSections={form.sections || []}
              onSave={handleSaveForm}
              isLoading={isSubmitting}
            />
          </div>
        )}

        {/* ─── Responses Tab ───────────────────────────────────────────── */}
        {activeTab === 'responses' && (
          <div className="mx-auto max-w-3xl">
            {submissionsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin">
                  <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <svg className="h-7 w-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Waiting for responses</p>
                {form.isPublished && (
                  <button onClick={handleCopyLink} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                    Share your form link
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Navigation bar */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentResponseIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentResponseIndex <= 0}
                      className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-600">
                      <span className="font-medium">{currentResponseIndex + 1}</span>
                      <span className="mx-1 text-gray-400">of</span>
                      <span className="font-medium">{submissions.length}</span>
                    </span>
                    <button
                      onClick={() => setCurrentResponseIndex((prev) => Math.min(submissions.length - 1, prev + 1))}
                      disabled={currentResponseIndex >= submissions.length - 1}
                      className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintResponse}
                      className="rounded p-2 text-gray-500 transition-colors hover:bg-gray-100"
                      title="Print response"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSubmission(submissions[currentResponseIndex]?._id)}
                      className="rounded p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete response"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="h-5 w-px bg-gray-200 mx-1" />
                    <button
                      onClick={handleDeleteAllSubmissions}
                      className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete all
                    </button>
                  </div>
                </div>

                {/* Response content */}
                {submissions[currentResponseIndex] && (
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm animate-fadeIn">
                    {/* Form header with accent bar */}
                    <div className="h-[10px] w-full bg-blue-600 rounded-t-lg" />
                    
                    {/* Notice */}
                    <div className="px-6 pt-4">
                      <p className="text-xs text-gray-400">Responses cannot be edited</p>
                    </div>

                    {/* Form title and description */}
                    <div className="px-6 pt-3 pb-4 border-b border-gray-100">
                      <h2 className="text-2xl font-normal text-gray-900" style={{ fontFamily: "'Google Sans', 'Segoe UI', Roboto, sans-serif" }}>
                        {form.title}
                      </h2>
                      {form.description && (
                        <p className="mt-2 text-sm text-gray-600">{form.description}</p>
                      )}
                    </div>

                    {/* Submitter info */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-3">
                        {submissions[currentResponseIndex].submittedBy ? (
                          <>
                            <img
                              src={getDiscordAvatarUrl(
                                submissions[currentResponseIndex].submittedBy.discordId,
                                submissions[currentResponseIndex].submittedBy.avatar
                              )}
                              alt="User avatar"
                              className="h-10 w-10 rounded-full"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {submissions[currentResponseIndex].submittedBy.globalName || 
                                 submissions[currentResponseIndex].submittedBy.username}
                              </p>
                              <p className="text-xs text-gray-500">
                                @{submissions[currentResponseIndex].submittedBy.username}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Anonymous</p>
                              <p className="text-xs text-gray-500">User not logged in</p>
                            </div>
                          </>
                        )}
                        <div className="ml-auto text-right">
                          <p className="text-xs text-gray-400">Submitted</p>
                          <p className="text-sm text-gray-600">
                            {new Date(submissions[currentResponseIndex].submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Response fields */}
                    <div className="px-6 py-4 space-y-6">
                      {form.fields
                        .sort((a: any, b: any) => a.order - b.order)
                        .map((field: any) => (
                          <div key={field.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                            <p className="text-sm font-medium text-gray-700 mb-2">{field.label}</p>
                            <p className="text-sm text-gray-900">
                              {submissions[currentResponseIndex].data?.[field.id] !== undefined &&
                               submissions[currentResponseIndex].data?.[field.id] !== ''
                                ? String(submissions[currentResponseIndex].data[field.id])
                                : <span className="text-gray-400 italic">No response</span>}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Settings Tab ────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="mx-auto max-w-2xl space-y-5">
            {/* Publish Settings */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="text-sm font-medium text-gray-700">Publish</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Form status</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {form.isPublished
                        ? 'Your form is live and accepting responses.'
                        : 'Your form is not visible to others.'}
                    </p>
                  </div>
                  <button
                    onClick={handleTogglePublish}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                      form.isPublished ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      form.isPublished ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">{new Date(form.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                {form.updatedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last modified</span>
                    <span className="text-gray-900">{new Date(form.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="text-sm font-medium text-gray-700">Share</h3>
              </div>
              <div className="p-5 space-y-4">
                {form.isPublished ? (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Form link</label>
                      <div className="mt-1.5 flex gap-2">
                        <input
                          type="text"
                          value={formLink}
                          readOnly
                          className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 font-mono"
                        />
                        <button
                          onClick={handleCopyLink}
                          className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-all ${
                            linkCopied
                              ? 'border-blue-300 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {linkCopied ? (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(formLink, '_blank')}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open form in new tab
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 rounded-md bg-blue-50 border border-blue-100 p-4">
                    <svg className="h-5 w-5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700">
                      Publish your form to get a shareable link.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Editors */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="text-sm font-medium text-gray-700">Editors</h3>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500">
                  Add Discord user IDs to allow others to edit this form. 
                  Right-click on a user in Discord and select &quot;Copy User ID&quot; (requires Developer Mode enabled in Discord settings).
                </p>

                {/* Add editor input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEditorId}
                    onChange={(e) => {
                      setNewEditorId(e.target.value);
                      setEditorsError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEditor()}
                    placeholder="Enter Discord User ID (e.g., 123456789012345678)"
                    className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddEditor}
                    disabled={editorsSaving || !newEditorId.trim()}
                    className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editorsSaving ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    Add
                  </button>
                </div>

                {editorsError && (
                  <p className="text-xs text-red-600">{editorsError}</p>
                )}

                {/* Editors list */}
                {editors.length > 0 ? (
                  <div className="space-y-2">
                    {editors.map((editorId) => (
                      <div
                        key={editorId}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm font-mono text-gray-700">{editorId}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveEditor(editorId)}
                          disabled={editorsSaving}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Remove editor"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md bg-gray-50 border border-gray-100 p-4 text-center">
                    <p className="text-sm text-gray-500">No editors added yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-lg border border-red-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-red-100 bg-red-50 px-5 py-3">
                <h3 className="text-sm font-medium text-red-700">Danger zone</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delete this form</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Permanently delete this form and all its responses. This cannot be undone.
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={handleDeleteForm}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
