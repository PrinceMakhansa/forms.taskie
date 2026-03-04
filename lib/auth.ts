import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export async function isAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) {
    return false;
  }

  // Get admin IDs from environment
  const adminIds = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
  
  // If no admin IDs configured, allow all authenticated users (development mode)
  if (adminIds.length === 0) {
    return true;
  }

  // Check if user is in the admin list
  return adminIds.includes(userId);
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
