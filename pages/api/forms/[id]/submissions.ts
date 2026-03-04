import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import connectToMongo from '@/lib/db';
import Form from '@/models/Form';
import Submission from '@/models/Submission';
import { isAdmin, canEditForm } from '@/lib/auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid form ID' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = (session.user as any)?.id;
  const admin = await isAdmin(userId);

  try {
    await connectToMongo();

    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check if user can edit this form (owner, editor, or admin)
    if (!canEditForm(userId, form, admin)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const [submissions, total] = await Promise.all([
        Submission.find({ formId: id })
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Submission.countDocuments({ formId: id }),
      ]);

      return res.status(200).json({
        submissions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    if (req.method === 'DELETE') {
      const { submissionId } = req.query;
      
      // Delete single submission if submissionId provided
      if (submissionId && typeof submissionId === 'string') {
        if (!Types.ObjectId.isValid(submissionId)) {
          return res.status(400).json({ error: 'Invalid submission ID' });
        }
        
        const result = await Submission.findOneAndDelete({
          _id: submissionId,
          formId: id,
        });
        
        if (!result) {
          return res.status(404).json({ error: 'Submission not found' });
        }
        
        return res.status(200).json({ message: 'Submission deleted' });
      }
      
      // Delete all submissions for this form
      const result = await Submission.deleteMany({ formId: id });
      return res.status(200).json({
        message: `Deleted ${result.deletedCount} submissions`,
        deletedCount: result.deletedCount,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Submissions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
