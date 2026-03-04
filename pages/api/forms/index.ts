import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import connectToMongo from '@/lib/db';
import Form from '@/models/Form';
import { FormSchema } from '@/lib/validation';
import { isAdmin } from '@/lib/auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  try {
    if (req.method === 'GET') {
      // List forms - admins see all, editors see their assigned forms, others see only published
      await connectToMongo();

      const userId = (session?.user as any)?.id;
      const admin = userId ? await isAdmin(userId) : false;
      const adminMode = req.query.admin === 'true';

      let query;
      if (admin && !adminMode) {
        // Admins see all forms (when not in admin mode)
        query = {};
      } else if (adminMode && userId) {
        // Admin dashboard mode: only show forms user can edit
        if (admin) {
          query = {}; // Admins can edit all
        } else {
          // Editors only see forms they created or can edit
          query = {
            $or: [
              { createdBy: userId },
              { 'editors.discordId': userId },
            ],
          };
        }
      } else if (userId) {
        // Authenticated users see published forms + forms they created + forms they can edit
        query = {
          $or: [
            { isPublished: true },
            { createdBy: userId },
            { 'editors.discordId': userId },
          ],
        };
      } else {
        // Unauthenticated users see only published forms
        query = { isPublished: true };
      }

      const forms = await Form.find(query)
        .sort({ createdAt: -1 })
        .select('-fields'); // Don't send full field details in list

      return res.status(200).json(forms);
    }

    if (req.method === 'POST') {
      // Create form - admin only
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = (session.user as any)?.id;
      const admin = await isAdmin(userId);

      if (!admin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Validate form data
      const validationResult = FormSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid form data',
          details: validationResult.error.errors,
        });
      }

      await connectToMongo();

      const form = new Form({
        ...validationResult.data,
        createdBy: userId,
        isPublished: false,
      });

      await form.save();

      return res.status(201).json(form);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Forms API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
