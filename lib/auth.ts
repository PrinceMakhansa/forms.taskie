import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToMongo from '@/lib/db';
import Admin from '@/models/Admin';

export async function isAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) {
    return false;
  }

  // First check environment variable for bootstrap admins (highest priority)
  const envAdminIds = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
  if (envAdminIds.includes(userId)) {
    return true;
  }

  // Check database for admins
  try {
    await connectToMongo();
    const adminCount = await Admin.countDocuments();
    
    // If no env admins AND no DB admins, allow all authenticated users (development mode)
    if (envAdminIds.length === 0 && adminCount === 0) {
      return true;
    }

    // Check if user is in database admin list
    const adminRecord = await Admin.findOne({ discordId: userId });
    return !!adminRecord;
  } catch (error) {
    console.error('Error checking admin status:', error);
    // Fallback to env check only if DB fails
    return envAdminIds.includes(userId);
  }
}

// Check if user can edit a form (owner, editor, or admin)
export function canEditForm(
  userId: string | undefined,
  form: { createdBy: string; editors?: string[] },
  userIsAdmin: boolean
): boolean {
  if (!userId) return false;
  if (userIsAdmin) return true;
  if (form.createdBy === userId) return true;
  if (form.editors?.includes(userId)) return true;
  return false;
}

export function requireAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return handler(req, res, session);
  };
}

export function requireAdmin(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await isAdmin((session.user as any)?.id);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return handler(req, res, session);
  };
}
