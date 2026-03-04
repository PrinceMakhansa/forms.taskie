import React from 'react';
import { IForm } from '@/models/Form';

interface FormHeaderProps {
  form: IForm;
  formTitle: string;
  setFormTitle: (title: string) => void;
  formDescription: string;
  setFormDescription: (description: string) => void;
}

export default function FormHeader({
  form,
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
}: FormHeaderProps) {
  return (
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
            <textarea
              value={formDescription}
              onChange={(e) => {
                setFormDescription(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
              placeholder="Form description"
              rows={1}
              className="mt-2 w-full border-none bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none resize-none overflow-hidden"
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
  );
}
