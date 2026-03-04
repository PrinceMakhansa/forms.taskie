import React from 'react';

interface FormContainerProps {
  title: string;
  description?: string;
  banner?: string;
  children: React.ReactNode;
}

export default function FormContainer({
  title,
  description,
  banner,
  children,
}: FormContainerProps) {
  return (
    <div className="mx-auto max-w-2xl animate-fadeIn">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Banner image if provided */}
        {banner && (
          <div className="w-full">
            <img
              src={banner}
              alt="Form banner"
              className="w-full h-auto max-h-[200px] object-cover"
              onError={(e) => {
                // Hide the image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        {/* Google Forms–style colored top bar */}
        <div className="h-[10px] w-full bg-blue-600 rounded-t-lg" />

        <div className="p-7 sm:p-9">
          <div className="mb-8">
            <h2 className="text-2xl font-normal text-gray-900" style={{ fontFamily: "'Google Sans', 'Segoe UI', Roboto, sans-serif" }}>
              {title}
            </h2>
            {description && (
              <p className="mt-3 text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
