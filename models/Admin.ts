import mongoose, { Schema, Document, Model } from 'mongoose';

interface IAdmin extends Document {
  discordId: string;
  username?: string;
  addedBy: string;
  addedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    discordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
    },
    addedBy: {
      type: String,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Handle hot reloading in development - prevent model overwrite errors
const Admin: Model<IAdmin> =
  (mongoose.models.Admin as Model<IAdmin>) || mongoose.model<IAdmin>('Admin', adminSchema);

export type { IAdmin };
export default Admin;
