import { z } from 'zod';

// Zod schemas for form validation
export const FormSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().min(0),
});

export type FormSection = z.infer<typeof FormSectionSchema>;

export const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'email',
    'textarea',
    'checkbox',
    'select',
    'radio',
    'date',
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for select/radio
  order: z.number().min(0),
  sectionId: z.string().optional(),
});

export type FormField = z.infer<typeof FormFieldSchema>;

export const FormSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  fields: z.array(FormFieldSchema).min(1),
  sections: z.array(FormSectionSchema).optional(),
  editors: z.array(z.string()).optional(), // Discord user IDs who can edit
});

export type FormInput = z.infer<typeof FormSchema>;

export const SubmissionSchema = z.record(z.any());

export type SubmissionInput = z.infer<typeof SubmissionSchema>;

