import React, { useState, useEffect, useRef } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Layout from '@/components/Layout';
import FormContainer from '@/components/FormContainer';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import { IForm } from '@/models/Form';

interface OGData {
  title: string;
  description: string | null;
  image: string | null;
  url: string;
}

export default function FormPage({ ogData }: { ogData: OGData | null }) {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();

  const [form, setForm] = useState<IForm | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formUnavailable, setFormUnavailable] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [draftRestored, setDraftRestored] = useState(false);
  const formFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id || status === 'loading') return;
    if (formFetchedRef.current === id) return;
    formFetchedRef.current = id as string;

    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          if (errorData.code === 'FORM_UNPUBLISHED') {
            setFormUnavailable(true);
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to fetch form');
        }
        const data = await res.json();

        if (!data.isPublished) {
          setFormUnavailable(true);
          setIsLoading(false);
          return;
        }

        if (data.hasSubmitted) {
          setAlreadySubmitted(true);
          setIsLoading(false);
          return;
        }

        setForm(data);

        const initialData: Record<string, any> = {};
        (data.fields ?? []).forEach((field: any) => {
          initialData[field.id] = field.type === 'checkbox' ? false : '';
        });
        try {
          const saved = localStorage.getItem(`form-draft-${id}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            Object.keys(initialData).forEach((key) => {
              if (parsed[key] !== undefined) initialData[key] = parsed[key];
            });
            setDraftRestored(true);
          }
        } catch { /* ignore localStorage errors */ }
        setFormData(initialData);
      } catch (error) {
        console.error('Error fetching form:', error);
        formFetchedRef.current = null;
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [id, status]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [fieldId]: value };
      try { localStorage.setItem(`form-draft-${id}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentSection()) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`/api/forms/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        try { localStorage.removeItem(`form-draft-${id}`); } catch { /* ignore */ }
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
      setErrors({ submit: 'An error occurred while submitting the form' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formMeta = ogData
    ? { title: ogData.title, description: ogData.description ?? undefined, image: ogData.image ?? undefined, url: ogData.url }
    : undefined;

  if (status === 'loading') {
    return (
      <Layout hideNav meta={formMeta}>
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

  if (status === 'unauthenticated') {
    return (
      <Layout hideNav meta={formMeta}>
        <div className="mx-auto max-w-lg animate-fadeIn py-12">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="h-[10px] w-full bg-blue-600 rounded-t-lg" />
            <div className="p-8 sm:p-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#5865F2]/10">
                <svg className="h-8 w-8 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
                </svg>
              </div>

              {/* ✅ form.title and form.description rendered as HTML */}
              {form ? (
                <>
                  <h2
                    className="text-xl font-semibold text-gray-900 mb-2"
                    style={{ fontFamily: "'Google Sans', 'Segoe UI', Roboto, sans-serif" }}
                    dangerouslySetInnerHTML={{ __html: form.title }}
                  />
                  {form.description && (
                    <p
                      className="text-sm text-gray-500 mb-6 [&_a]:text-blue-600 [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: form.description }}
                    />
                  )}
                  {!form.description && <div className="mb-6" />}
                </>
              ) : isLoading ? (
                <div className="mb-6">
                  <div className="mx-auto h-5 w-48 animate-pulse rounded bg-gray-200 mb-2" />
                  <div className="mx-auto h-4 w-64 animate-pulse rounded bg-gray-100" />
                </div>
              ) : (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Fill out this form</h2>
                </div>
              )}

              <p className="text-sm text-gray-500 mb-6">
                Sign in with your Discord account to fill out and submit this form.
              </p>

              <button
                onClick={() => signIn('discord', { callbackUrl: `/forms/${id}` })}
                className="inline-flex items-center gap-3 rounded-lg bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#4752C4] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
                </svg>
                Login with Discord
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout hideNav meta={formMeta}>
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

  if (formUnavailable) {
    return (
      <Layout hideNav meta={formMeta}>
        <div className="mx-auto max-w-md text-center py-16">
          <h2 className="text-2xl font-bold text-warm-gray-900 mb-3">Form Not Available</h2>
          <p className="text-warm-gray-600 mb-2">This form is not currently accepting responses.</p>
          <p className="text-sm text-warm-gray-500 mb-6">
            If you believe this is an error, please contact the form owner or administrator.
          </p>
        </div>
      </Layout>
    );
  }

  if (alreadySubmitted) {
    return (
      <Layout hideNav meta={formMeta}>
        <div className="mx-auto max-w-md animate-fadeIn py-12">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="h-[10px] w-full bg-green-500 rounded-t-lg" />
            <div className="p-8 sm:p-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Submitted</h2>
              <p className="text-sm text-gray-500 mb-6">
                You have already submitted a response to{' '}
                <span className="font-medium text-gray-700">{ogData?.title ?? 'this form'}</span>.
                Only one submission per person is allowed.
              </p>
              <p className="text-xs text-gray-400">
                If you believe this is a mistake or need to update your response, please contact the form administrator.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!form) {
    return (
      <Layout hideNav meta={formMeta}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-warm-gray-900">Form not found</h2>
          <p className="mt-2 text-warm-gray-600">
            The form you're looking for doesn't exist or is no longer available.
          </p>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout hideNav meta={formMeta}>
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

  const sortedSections = form?.sections && form.sections.length > 0
    ? [...(form.sections as any[])].sort((a, b) => a.order - b.order)
    : null;
  const sortedFields = form
    ? [...form.fields].sort((a: any, b: any) => a.order - b.order)
    : [];
  const hasSections = !!sortedSections && sortedSections.length > 0;
  const totalSections = hasSections ? sortedSections!.length : 1;

  const getFieldsForSection = (sectionIndex: number) => {
    if (!hasSections) return sortedFields;
    const section = sortedSections![sectionIndex];
    return sortedFields.filter((f: any) => f.sectionId === section.id);
  };

  const validateCurrentSection = (): boolean => {
    const fields = getFieldsForSection(currentSectionIndex);
    const newErrors: Record<string, string> = {};
    fields.forEach((field: any) => {
      if (field.required) {
        const val = formData[field.id];
        if (field.type === 'checkbox') {
          if (!val) newErrors[field.id] = 'This field is required';
        } else if (!val || (typeof val === 'string' && val.trim() === '')) {
          newErrors[field.id] = 'This field is required';
        }
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentSection()) return;
    setCurrentSectionIndex((prev) => Math.min(prev + 1, totalSections - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentSectionIndex((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout hideNav meta={formMeta}>
      {/* User identity strip */}
      {session?.user && (
        <div className="mx-auto max-w-2xl mb-3 animate-fadeIn">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <img
              src={(session.user as any)?.image || '/default-avatar.png'}
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-100"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {(session.user as any)?.global_name || (session.user as any)?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {(session.user as any)?.username}
              </p>
            </div>
          </div>
        </div>
      )}

      <FormContainer
        title={form.title}
        description={form.description}
        banner={form.banner}
      >
        <form onSubmit={handleSubmit} className="space-y-7">
          {draftRestored && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-sm text-blue-700">📝 Draft restored — your previous answers have been loaded.</p>
              <button
                type="button"
                onClick={() => {
                  try { localStorage.removeItem(`form-draft-${id}`); } catch { /* ignore */ }
                  setFormData(() => {
                    const blank: Record<string, any> = {};
                    (form!.fields ?? []).forEach((f: any) => { blank[f.id] = f.type === 'checkbox' ? false : ''; });
                    return blank;
                  });
                  setDraftRestored(false);
                }}
                className="ml-4 text-xs text-blue-600 underline hover:text-blue-800 whitespace-nowrap"
              >
                Clear draft
              </button>
            </div>
          )}

          {errors.submit && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Progress indicator (only when multi-section) */}
          {hasSections && totalSections > 1 && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Section {currentSectionIndex + 1} of {totalSections}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentSectionIndex + 1) / totalSections) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentSectionIndex + 1) / totalSections) * 100}%` }}
                />
              </div>
              <div className="flex justify-center gap-2 mt-3">
                {sortedSections!.map((_: any, idx: number) => (
                  <div
                    key={idx}
                    className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                      idx === currentSectionIndex
                        ? 'bg-blue-600'
                        : idx < currentSectionIndex
                          ? 'bg-blue-300'
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {(() => {
            if (hasSections) {
              const section = sortedSections![currentSectionIndex];
              const sectionFields = getFieldsForSection(currentSectionIndex);

              return (
                <div key={section.id} className="animate-fadeIn">
                  {/* ✅ Section header — rendered as HTML, styled as info card if no fields */}
                  {(section.title || section.description) && (
                    <div className={`${
                      sectionFields.length === 0
                        ? 'rounded-lg border border-blue-100 bg-blue-50 p-5'
                        : 'mb-5'
                    }`}>
                      <h3
                        className="text-lg font-semibold text-warm-gray-900"
                        dangerouslySetInnerHTML={{ __html: section.title }}
                      />
                      {section.description && (
                        <p
                          className="mt-1 text-sm text-warm-gray-600 [&_a]:text-blue-600 [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: section.description }}
                        />
                      )}
                    </div>
                  )}

                  {/* ✅ Fields only rendered if there are any */}
                  {sectionFields.length > 0 && (
                    <div className="space-y-6">
                      {sectionFields.map((field: any, fieldIndex: number) => (
                        <div
                          key={field.id}
                          className="opacity-0 animate-fadeInUp"
                          style={{ animationDelay: `${fieldIndex * 50}ms`, animationFillMode: 'forwards' }}
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
                  )}
                </div>
              );
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

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            {hasSections && totalSections > 1 ? (
              <>
                {currentSectionIndex > 0 ? (
                  <Button variant="secondary" type="button" onClick={handleBack} disabled={isSubmitting}>
                    ← Back
                  </Button>
                ) : (
                  <Button variant="secondary" type="button" onClick={() => router.push('/')} disabled={isSubmitting}>
                    Cancel
                  </Button>
                )}
                {currentSectionIndex < totalSections - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Next →
                  </Button>
                ) : (
                  <Button type="submit" isLoading={isSubmitting}>
                    Submit
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="secondary" type="button" onClick={() => router.push('/')} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Submit
                </Button>
              </>
            )}
          </div>
        </form>
      </FormContainer>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const baseUrl = process.env.NEXTAUTH_URL ?? '';

  try {
    const connectToMongo = (await import('@/lib/db')).default;
    const Form = (await import('@/models/Form')).default;
    const { Types } = await import('mongoose');

    await connectToMongo();

    const query = Types.ObjectId.isValid(id)
      ? { $or: [{ publicId: id }, { _id: id }] }
      : { publicId: id };

    const form = await Form.findOne(query).lean() as any;

    if (!form) {
      return { props: { ogData: null } };
    }

    const ogData: OGData = {
      title: form.title,
      description: form.description ?? null,
      image: form.banner ?? null,
      url: `${baseUrl}/forms/${form.publicId}`,
    };

    return { props: { ogData } };
  } catch {
    return { props: { ogData: null } };
  }
};