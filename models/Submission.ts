import mongoose, { Schema, Document, Model, Types } from 'mongoose';

interface ISubmittedBy {
  discordId: string;
  username: string;
  globalName?: string;
  avatar?: string;
}

interface ISubmission extends Document {
  formId: Types.ObjectId;
  data: Record<string, any>;
  submittedBy?: ISubmittedBy;
  submittedAt: Date;
  ipAddress?: string;
}

const submittedBySchema = new Schema(
  {
    discordId: { type: String, required: true },
    username: { type: String, required: true },
    globalName: { type: String },
    avatar: { type: String },
  },
  { _id: false }
);

const submissionSchema = new Schema<ISubmission>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    submittedBy: {
      type: submittedBySchema,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: String,
  },
  {
    timestamps: false,
  }
);

// Index for common queries
submissionSchema.index({ formId: 1, submittedAt: -1 });
submissionSchema.index({ createdAt: -1 });

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model('Submission', submissionSchema);

export type { ISubmission, ISubmittedBy };
export default Submission;
