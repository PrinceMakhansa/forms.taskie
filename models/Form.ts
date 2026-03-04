import mongoose, { Schema, Document, Model } from 'mongoose';
import { FormField, FormSection } from '@/lib/validation';

export interface FormEditor {
  discordId: string;
  username?: string;
}

interface IForm extends Document {
  title: string;
  description?: string;
  fields: FormField[];
  sections?: FormSection[];
  createdBy: string;
  editors: FormEditor[]; // Array of editor objects with Discord ID and optional username
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

// Define sub-schemas separately to avoid 'type' keyword conflicts
const fieldSchema = new Schema(
  {
    id: { type: String },
    type: { type: String }, // 'type' as a field name requires object syntax
    label: { type: String },
    placeholder: { type: String },
    required: { type: Boolean },
    options: [String],
    order: { type: Number },
    sectionId: { type: String },
  },
  { _id: false }
);

const sectionSchema = new Schema(
  {
    id: { type: String },
    title: { type: String },
    description: { type: String },
    order: { type: Number },
  },
  { _id: false }
);

const formSchema = new Schema<IForm>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 255,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    fields: {
      type: [fieldSchema],
      required: true,
      validate: {
        validator: (v: FormField[]) => v.length > 0,
        message: 'Form must have at least one field',
      },
    },
    sections: {
      type: [sectionSchema],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
    },
    editors: {
      type: [{
        discordId: { type: String, required: true },
        username: { type: String },
      }],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for common queries
formSchema.index({ createdBy: 1, createdAt: -1 });
formSchema.index({ isPublished: 1 });

// Handle hot reloading in development - prevent model overwrite errors
const Form: Model<IForm> =
  (mongoose.models.Form as Model<IForm>) || mongoose.model<IForm>('Form', formSchema);

export type { IForm };
export default Form;

