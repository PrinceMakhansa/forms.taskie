import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import connectToMongo from '@/lib/db';
import Admin from '@/models/Admin';
import { isAdmin } from '@/lib/auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid admin ID' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = (session.user as any)?.id;
  const admin = await isAdmin(userId);

  if (!admin) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  try {
    await connectToMongo();

    if (req.method === 'DELETE') {
      // Prevent self-deletion
      const adminRecord = await Admin.findById(id);
      
      if (!adminRecord) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      if (adminRecord.discordId === userId) {
        return res.status(400).json({ error: 'Cannot remove yourself as admin' });
      }

      await Admin.findByIdAndDelete(id);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
