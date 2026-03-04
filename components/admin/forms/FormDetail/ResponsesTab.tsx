import React from 'react';
import { IForm } from '@/models/Form';
import { getDiscordAvatarUrl } from './utils';

interface ResponsesTabProps {
  form: IForm;
  submissions: any[];
  submissionsLoading: boolean;
  currentResponseIndex: number;
  setCurrentResponseIndex: (index: number | ((prev: number) => number)) => void;
  handleCopyLink: () => void;
  handlePrintResponse: () => void;
  handleDeleteSubmission: (submissionId: string) => void;
  handleDeleteAllSubmissions: () => void;
}

export default function ResponsesTab({
  form,
  submissions,
  submissionsLoading,
  currentResponseIndex,
  setCurrentResponseIndex,
  handleCopyLink,
  handlePrintResponse,
  handleDeleteSubmission,
  handleDeleteAllSubmissions,
}: ResponsesTabProps) {
  if (submissionsLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin">
          <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
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
    );
  }

  const currentSubmission = submissions[currentResponseIndex];

  return (
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
            onClick={() => handleDeleteSubmission(currentSubmission?._id)}
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
      {currentSubmission && (
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
              {currentSubmission.submittedBy ? (
                <>
                  <img
                    src={getDiscordAvatarUrl(
                      currentSubmission.submittedBy.discordId,
                      currentSubmission.submittedBy.avatar
                    )}
                    alt="User avatar"
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {currentSubmission.submittedBy.globalName || 
                       currentSubmission.submittedBy.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{currentSubmission.submittedBy.username}
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
                  {new Date(currentSubmission.submittedAt).toLocaleString()}
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
                    {currentSubmission.data?.[field.id] !== undefined &&
                     currentSubmission.data?.[field.id] !== ''
                      ? String(currentSubmission.data[field.id])
                      : <span className="text-gray-400 italic">No response</span>}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
