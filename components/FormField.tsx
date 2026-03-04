import React from 'react';
import { FormField } from '@/lib/validation';

interface FormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export default function FormFieldComponent({
  field,
  value,
  onChange,
  error,
}: FormFieldProps) {
  const baseInputClasses = `
    w-full px-0 py-2 border-0 border-b border-gray-300 
    bg-transparent text-gray-900 placeholder-gray-400
    focus:border-blue-600 focus:ring-0
    transition-all duration-200 text-sm
  `;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <label htmlFor={field.id} className="block text-base text-gray-900 mb-3">
        {field.label}
        {field.required && <span className="text-red-600 ml-1">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          id={field.id}
          name={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          className={`${baseInputClasses} resize-none`}
        />
      ) : field.type === 'select' ? (
        <select
          id={field.id}
          name={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full rounded-md border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Choose</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === 'radio' ? (
        <fieldset className="space-y-3 mt-1">
          {field.options?.map((option) => (
            <label key={option} className="flex items-center gap-3 cursor-pointer group">
              <div className={`flex h-[20px] w-[20px] items-center justify-center rounded-full border-2 transition-colors ${
                value === option ? 'border-blue-600' : 'border-gray-300 group-hover:border-gray-400'
              }`}>
                {value === option && <div className="h-[10px] w-[10px] rounded-full bg-blue-600" />}
              </div>
              <input
                id={`${field.id}-${option}`}
                type="radio"
                name={field.id}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </fieldset>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-colors ${
            value ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-gray-400'
          }`}>
            {value && (
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <input
            id={field.id}
            type="checkbox"
            name={field.id}
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      ) : (
        <input
          id={field.id}
          type={field.type}
          name={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className={baseInputClasses}
        />
      )}

      {error && (
        <p className="mt-2.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
