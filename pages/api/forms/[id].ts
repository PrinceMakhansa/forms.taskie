import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import connectToMongo from '@/lib/db';
import Form from '@/models/Form';
import { FormSchema } from '@/lib/validation';
import { isAdmin, canEditForm } from '@/lib/auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid form ID' });
  }

  const session = await getServerSession(req, res, authOptions);

  try {
    await connectToMongo();

    if (req.method === 'GET') {
      const query = Types.ObjectId.isValid(id)
        ? { $or: [{ publicId: id }, { _id: id }] }
        : { publicId: id };
      const form = await Form.findOne(query).lean();

      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      // Lazy auto-unpublish check: if the timer expired, immediately unpublish it
      if ((form as any).isPublished && (form as any).closesAt && new Date((form as any).closesAt) <= new Date()) {
        await Form.updateOne(
          { _id: form._id },
          { $set: { isPublished: false, closesAt: null } }
        );
        (form as any).isPublished = false;
        (form as any).closesAt = null;
      }

      // Allow access if published, creator, editor, or admin
      const userId = (session?.user as any)?.id;
      const admin = userId ? await isAdmin(userId) : false;
      const isEditor = canEditForm(userId, form as any, admin);
      const hasAccess = (form as any).isPublished || isEditor;

      if (!hasAccess) {
        // Return specific error code for unpublished forms
        return res.status(403).json({
          error: 'Form not available',
          code: 'FORM_UNPUBLISHED',
          message: 'This form is not currently accepting responses.'
        });
      }

      return res.status(200).json(form);
    }

    if (req.method === 'PUT') {
      // Update form - admin/creator/editor only
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const putQuery = Types.ObjectId.isValid(id)
        ? { $or: [{ publicId: id }, { _id: id }] }
        : { publicId: id };
      const form = await Form.findOne(putQuery);
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      const userId = (session.user as any)?.id;
      const admin = await isAdmin(userId);

      if (!canEditForm(userId, form, admin)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Support partial updates (e.g. toggling isPublished)
      const { isPublished, title, description, banner, fields, sections, editors, closesAt } = req.body;

      if (typeof isPublished === 'boolean') {
        form.isPublished = isPublished;
      }

      // Update closesAt (accept date string or null to clear)
      if (closesAt !== undefined) {
        (form as any).closesAt = closesAt ? new Date(closesAt) : null;
      }

      // Update banner
      if (banner !== undefined) {
        (form as any).banner = banner || '';
      }

      // Only allow owner/admin to modify editors
      if (editors !== undefined) {
        if (form.createdBy !== userId && !admin) {
          return res.status(403).json({ error: 'Only the form owner or admin can modify editors' });
        }
        // Handle both old string format and new object format
        form.editors = editors
          .map((e: any) => {
            if (typeof e === 'string') {
              return { discordId: e.trim() };
            }
            return {
              discordId: e.discordId?.trim() || '',
              ...(e.username?.trim() && { username: e.username.trim() }),
            };
          })
          .filter((e: any) => e.discordId);
      }

      // If form content fields are provided, validate them
      if (title !== undefined || fields !== undefined) {
        const validationResult = FormSchema.safeParse({
          title: title ?? form.title,
          description: description ?? form.description,
          fields: fields ?? form.fields,
          sections: sections ?? form.sections,
          editors: editors ?? form.editors,
        });
        if (!validationResult.success) {
          return res.status(400).json({
            error: 'Invalid form data',
            details: validationResult.error.errors,
          });
        }
        Object.assign(form, validationResult.data);
      } else if (description !== undefined) {
        form.description = description;
      }

      await form.save();

      return res.status(200).json(form);
    }

    if (req.method === 'DELETE') {
      // Delete form - admin/creator only (editors cannot delete)
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const delQuery = Types.ObjectId.isValid(id)
        ? { $or: [{ publicId: id }, { _id: id }] }
        : { publicId: id };
      const form = await Form.findOne(delQuery);
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      const userId = (session.user as any)?.id;
      const admin = await isAdmin(userId);

      // Only owner or admin can delete (not editors)
      if (form.createdBy !== userId && !admin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await Form.deleteOne(delQuery);

      return res.status(200).json({ message: 'Form deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Form detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
