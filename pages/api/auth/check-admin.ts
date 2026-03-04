import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { isAdmin } from '@/lib/auth';
import connectToMongo from '@/lib/db';
import Form from '@/models/Form';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ isAdmin: false, canAccessAdmin: false, error: 'Unauthorized' });
  }

  const userId = (session.user as any)?.id;
  const admin = await isAdmin(userId);

  // If admin, they can access everything
  if (admin) {
    return res.status(200).json({ isAdmin: true, canAccessAdmin: true });
  }

  // Check if user is an editor or owner of any form
  try {
    await connectToMongo();
    const hasFormAccess = await Form.exists({
      $or: [
        { createdBy: userId },
        { editors: userId },
      ],
    });

    return res.status(200).json({
      isAdmin: false,
      canAccessAdmin: !!hasFormAccess,
    });
  } catch (error) {
    console.error('Check admin error:', error);
    return res.status(200).json({ isAdmin: false, canAccessAdmin: false });
  }
}
