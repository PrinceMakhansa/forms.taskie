import React from 'react';
import { IForm } from '@/models/Form';
import Button from '@/components/Button';

interface SettingsTabProps {
  form: IForm;
  formLink: string;
  linkCopied: boolean;
  editors: string[];
  newEditorId: string;
  setNewEditorId: (id: string) => void;
  editorsError: string | null;
  setEditorsError: (error: string | null) => void;
  editorsSaving: boolean;
  handleTogglePublish: () => void;
  handleCopyLink: () => void;
  handleAddEditor: () => void;
  handleRemoveEditor: (editorId: string) => void;
  handleDeleteForm: () => void;
}

export default function SettingsTab({
  form,
  formLink,
  linkCopied,
  editors,
  newEditorId,
  setNewEditorId,
  editorsError,
  setEditorsError,
  editorsSaving,
  handleTogglePublish,
  handleCopyLink,
  handleAddEditor,
  handleRemoveEditor,
  handleDeleteForm,
}: SettingsTabProps) {
  return (
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
  );
}
