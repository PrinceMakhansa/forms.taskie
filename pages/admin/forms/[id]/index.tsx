import React from 'react';
import Layout from '@/components/Layout';
import FormBuilder from '@/components/FormBuilder';
import Toast from '@/components/admin/forms/FormDetail/Toast';
import FormHeader from '@/components/admin/forms/FormDetail/FormHeader';
import TabNavigation from '@/components/admin/forms/FormDetail/TabNavigation';
import ResponsesTab from '@/components/admin/forms/FormDetail/ResponsesTab';
import SettingsTab from '@/components/admin/forms/FormDetail/SettingsTab';
import { useFormDetail } from '@/components/admin/forms/FormDetail/useFormDetail';

export default function FormDetailPage() {
  const {
    // Router
    router,
    id,
    // Auth
    status,
    canAccessAdmin,
    // Form data
    form,
    isLoading,
    error,
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
    // Link
    linkCopied,
    // Editors
    editors,
    newEditorId,
    setNewEditorId,
    editorsError,
    setEditorsError,
    editorsSaving,
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
  } = useFormDetail();

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
      <FormHeader
        form={form}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
      />

      {/* Tabs */}
      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        submissionCount={submissionCount}
      />

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
            <ResponsesTab
              form={form}
              submissions={submissions}
              submissionsLoading={submissionsLoading}
              currentResponseIndex={currentResponseIndex}
              setCurrentResponseIndex={setCurrentResponseIndex}
              handleCopyLink={handleCopyLink}
              handlePrintResponse={handlePrintResponse}
              handleDeleteSubmission={handleDeleteSubmission}
              handleDeleteAllSubmissions={handleDeleteAllSubmissions}
            />
          </div>
        )}

        {/* ─── Settings Tab ────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <SettingsTab
            form={form}
            formLink={formLink}
            linkCopied={linkCopied}
            editors={editors}
            newEditorId={newEditorId}
            setNewEditorId={setNewEditorId}
            editorsError={editorsError}
            setEditorsError={setEditorsError}
            editorsSaving={editorsSaving}
            handleTogglePublish={handleTogglePublish}
            handleCopyLink={handleCopyLink}
            handleAddEditor={handleAddEditor}
            handleRemoveEditor={handleRemoveEditor}
            handleDeleteForm={handleDeleteForm}
          />
        )}
      </div>
    </Layout>
  );
}
