import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Layout from '@/components/Layout';
import FormContainer from '@/components/FormContainer';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import { IForm } from '@/models/Form';

export default function FormPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();

  const [form, setForm] = useState<IForm | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('discord', { callbackUrl: `/forms/${id}` });
    }
  }, [status, id]);

  useEffect(() => {
    if (!id || status !== 'authenticated') return;

    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/${id}`);
        if (!res.ok) throw new Error('Failed to fetch form');
        const data = await res.json();
        setForm(data);

        // Initialize form data
        const initialData: Record<string, any> = {};
        (data.fields ?? []).forEach((field: any) => {
          initialData[field.id] = field.type === 'checkbox' ? false : '';
        });
        setFormData(initialData);
      } catch (error) {
        console.error('Error fetching form:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [id, status]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`/api/forms/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const errorData = await res.json();
        if (errorData.details) {
          setErrors(errorData.details);
        } else {
          setErrors({ submit: errorData.error || 'Failed to submit form' });
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({
        submit: 'An error occurred while submitting the form',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth status
  if (status === 'loading' || status === 'unauthenticated') {
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

  if (isLoading) {
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

  if (!form) {
    return (
      <Layout>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-warm-gray-900">
            Form not found
          </h2>
          <p className="mt-2 text-warm-gray-600">
            The form you're looking for doesn't exist or is no longer available.
          </p>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <FormContainer title="Thank You">
          <div className="text-center">
            <div className="mb-6 animate-scaleIn text-5xl text-blue-600">✓</div>
            <p className="mb-4 text-lg text-warm-gray-600">
              Your submission has been received successfully.
            </p>
            <Button variant="secondary" onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </FormContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <FormContainer
        title={form.title}
        description={form.description}
      >
        <form onSubmit={handleSubmit} className="space-y-7">
          {errors.submit && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {(() => {
            const sortedFields = [...form.fields].sort((a: any, b: any) => a.order - b.order);
            const hasSections = form.sections && form.sections.length > 0;

            if (hasSections) {
              const sortedSections = [...(form.sections as any[])].sort((a, b) => a.order - b.order);
              return sortedSections.map((section: any, sectionIndex: number) => {
                const sectionFields = sortedFields.filter((f: any) => f.sectionId === section.id);
                if (sectionFields.length === 0) return null;

                return (
                  <div
                    key={section.id}
                    className="opacity-0 animate-fadeInUp"
                    style={{ animationDelay: `${sectionIndex * 100}ms`, animationFillMode: 'forwards' }}
                  >
                    {/* Section divider (skip for first section) */}
                    {sectionIndex > 0 && (
                      <div className="mb-6 mt-2 border-t border-warm-gray-200" />
                    )}

                    {/* Section header */}
                    {(section.title || section.description) && (
                      <div className="mb-5">
                        <h3 className="text-lg font-semibold text-warm-gray-900">{section.title}</h3>
                        {section.description && (
                          <p className="mt-1 text-sm text-warm-gray-600">{section.description}</p>
                        )}
                      </div>
                    )}

                    {/* Section fields */}
                    <div className="space-y-6">
                      {sectionFields.map((field: any, fieldIndex: number) => (
                        <div
                          key={field.id}
                          className="opacity-0 animate-fadeInUp"
                          style={{ animationDelay: `${(sectionIndex * 100) + (fieldIndex * 50)}ms`, animationFillMode: 'forwards' }}
                        >
                          <FormField
                            field={field}
                            value={formData[field.id]}
                            onChange={(value) => handleFieldChange(field.id, value)}
                            error={errors[field.id]}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            }

            // No sections — render flat (backwards compatible)
            return sortedFields.map((field: any, index: number) => (
              <div
                key={field.id}
                className="opacity-0 animate-fadeInUp"
                style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'forwards' }}
              >
                <FormField
                  field={field}
                  value={formData[field.id]}
                  onChange={(value) => handleFieldChange(field.id, value)}
                  error={errors[field.id]}
                />
              </div>
            ));
          })()}

          <div className="flex justify-between pt-6">
            <Button
              variant="secondary"
              onClick={() => router.push('/')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit
            </Button>
          </div>
        </form>
      </FormContainer>
    </Layout>
  );
}
