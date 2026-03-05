import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import connectToMongo from '@/lib/db';
import Form from '@/models/Form';
import Submission from '@/models/Submission';
import { SubmissionSchema, FormFieldSchema } from '@/lib/validation';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded?.[0];
  return ip || req.socket.remoteAddress || '';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid form ID' });
  }

  // Get user session for Discord info - require authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'You must be logged in with Discord to submit this form' });
  }

  try {
    await connectToMongo();

    const submitQuery = Types.ObjectId.isValid(id)
      ? { $or: [{ publicId: id }, { _id: id }] }
      : { publicId: id };
    const form = await Form.findOne(submitQuery);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Lazy auto-unpublish check on submit
    if ((form as any).isPublished && (form as any).closesAt && new Date((form as any).closesAt) <= new Date()) {
      await Form.updateOne(
        { _id: form._id },
        { $set: { isPublished: false, closesAt: null } }
      );
      (form as any).isPublished = false;
      (form as any).closesAt = null;
    }

    if (!form.isPublished) {
      return res.status(403).json({ error: 'Form is not published' });
    }

    // Validate submission data against form fields
    const validationErrors: Record<string, string> = {};

    for (const field of form.fields) {
      const fieldValue = req.body[field.id];

      if (field.required && !fieldValue) {
        validationErrors[field.id] = `${field.label} is required`;
        continue;
      }

      // Type-specific validation
      if (fieldValue) {
        switch (field.type) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
              validationErrors[field.id] = `${field.label} must be a valid email`;
            }
            break;
          case 'date':
            if (isNaN(Date.parse(fieldValue))) {
              validationErrors[field.id] = `${field.label} must be a valid date`;
            }
            break;
          case 'select':
          case 'radio':
            if (field.options && !field.options.includes(fieldValue)) {
              validationErrors[field.id] = `${field.label} has an invalid value`;
            }
            break;
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
      });
    }

    // Build submittedBy info from session if available
    const user = session?.user as any;
    const submittedBy = user?.id ? {
      discordId: user.id,
      username: user.username || user.name || 'Unknown',
      globalName: user.global_name,
      avatar: user.avatar,
    } : undefined;

    const submission = new Submission({
      formId: form._id,
      data: req.body,
      submittedBy,
      ipAddress: getClientIp(req),
      submittedAt: new Date(),
    });

    await submission.save();

    return res.status(201).json({
      message: 'Submission received',
      id: submission._id,
    });
  } catch (error) {
    console.error('Form submission API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
