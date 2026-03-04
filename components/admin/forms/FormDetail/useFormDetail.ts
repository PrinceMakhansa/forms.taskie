import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import useSWR from 'swr';
import { FormField, FormSection } from '@/lib/validation';
import { IForm, FormEditor } from '@/models/Form';
import { fetcher, isValidDiscordId } from './utils';

export function useFormDetail() {
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
  const [editors, setEditors] = useState<FormEditor[]>([]);
  const [newEditorId, setNewEditorId] = useState('');
  const [newEditorUsername, setNewEditorUsername] = useState('');
  const [editorsError, setEditorsError] = useState<string | null>(null);
  const [editorsSaving, setEditorsSaving] = useState(false);

  // Banner state
  const [banner, setBanner] = useState('');
  const [bannerSaving, setBannerSaving] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsTotalPages, setSubmissionsTotalPages] = useState(1);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);

  useEffect(() => {
    if (form) {
      setFormTitle(form.title);
      setFormDescription(form.description || '');
      setBanner((form as any).banner || '');
      // Handle both old string format and new object format for backwards compatibility
      const rawEditors = (form as any).editors || [];
      const normalizedEditors: FormEditor[] = rawEditors.map((e: string | FormEditor) => 
        typeof e === 'string' ? { discordId: e } : e
      );
      setEditors(normalizedEditors);
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
    const link = `${window.location.origin}/forms/${(form as any)?.publicId || form?._id}`;
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
        const newSubmissions = submissions.filter((s: any) => s._id !== submissionId);
        setSubmissions(newSubmissions);
        setSubmissionCount((prev) => prev - 1);
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

  const handleAddEditor = async () => {
    const trimmedId = newEditorId.trim();
    const trimmedUsername = newEditorUsername.trim();
    setEditorsError(null);

    if (!trimmedId) {
      setEditorsError('Please enter a Discord ID');
      return;
    }

    if (!isValidDiscordId(trimmedId)) {
      setEditorsError('Invalid Discord ID format (should be 17-19 digits)');
      return;
    }

    if (editors.some(e => e.discordId === trimmedId)) {
      setEditorsError('This user is already an editor');
      return;
    }

    if (trimmedId === (form as any)?.createdBy) {
      setEditorsError('Cannot add the form owner as an editor');
      return;
    }

    setEditorsSaving(true);
    try {
      const newEditor: FormEditor = { 
        discordId: trimmedId,
        ...(trimmedUsername && { username: trimmedUsername })
      };
      const updatedEditors = [...editors, newEditor];
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editors: updatedEditors }),
      });

      if (res.ok) {
        setEditors(updatedEditors);
        setNewEditorId('');
        setNewEditorUsername('');
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

  const handleRemoveEditor = async (discordId: string) => {
    setEditorsSaving(true);
    try {
      const updatedEditors = editors.filter((e) => e.discordId !== discordId);
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

  const handleSaveBanner = async () => {
    setBannerSaving(true);
    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner }),
      });

      if (res.ok) {
        showToast('Banner saved');
        await mutate();
      } else {
        showToast('Failed to save banner', 'error');
      }
    } catch {
      showToast('An error occurred', 'error');
    } finally {
      setBannerSaving(false);
    }
  };

  return {
    // Router
    router,
    id,
    // Auth
    status,
    canAccessAdmin,
    isAdmin,
    // Form data
    form,
    isLoading,
    error,
    mutate,
    // Form editing
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    isSubmitting,
    // Tabs
    activeTab,
    setActiveTab,
    // Toast
    toast,
    setToast,
    showToast,
    // Link
    linkCopied,
    // Editors
    editors,
    newEditorId,
    setNewEditorId,
    newEditorUsername,
    setNewEditorUsername,
    editorsError,
    setEditorsError,
    editorsSaving,
    // Banner
    banner,
    setBanner,
    bannerSaving,
    // Submissions
    submissions,
    submissionCount,
    submissionsLoading,
    currentResponseIndex,
    setCurrentResponseIndex,
    // Handlers
    handleSaveForm,
    handleTogglePublish,
    handleCopyLink,
    handleDeleteForm,
    handleDeleteAllSubmissions,
    handleDeleteSubmission,
    handlePrintResponse,
    handleAddEditor,
    handleRemoveEditor,
    handleSaveBanner,
  };
}
