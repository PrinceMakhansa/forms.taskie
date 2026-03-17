import React from 'react';
import { IForm } from '@/models/Form';
import RichTextInput from '@/components/RichTextInput';

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
    <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm animate-fadeIn">
      {/* Top accent bar — matches section cards exactly */}
      <div className="h-[10px] w-full bg-blue-600 rounded-t-lg" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Form title */}
            <RichTextInput
              value={formTitle}
              onChange={setFormTitle}
              placeholder="Untitled Form"
              singleLine
              className="w-full text-2xl font-normal text-gray-900"
              style={{ fontFamily: "'Google Sans', 'Segoe UI', Roboto, sans-serif" }}
            />

            {/* Divider like Google Forms */}
            <div className="mt-3 mb-3 border-b border-gray-200" />

            {/* Form description */}
            <RichTextInput
              value={formDescription}
              onChange={setFormDescription}
              placeholder="Form description"
              className="w-full text-sm text-gray-600 min-h-[1.25rem]"
            />
          </div>

          {/* Status badge */}
          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                form.isPublished
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  form.isPublished ? 'bg-blue-500' : 'bg-gray-400'
                }`}
              />
              {form.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}