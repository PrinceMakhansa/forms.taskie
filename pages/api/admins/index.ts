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

    if (req.method === 'GET') {
      // List all admins
      const admins = await Admin.find().sort({ addedAt: -1 });
      
      // Also return env admins for reference (marked as env-based)
      const envAdminIds = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
      
      return res.status(200).json({
        admins,
        envAdmins: envAdminIds,
      });
    }

    if (req.method === 'POST') {
      // Add a new admin
      const { discordId, username } = req.body;

      if (!discordId || typeof discordId !== 'string') {
        return res.status(400).json({ error: 'Discord ID is required' });
      }

      const cleanDiscordId = discordId.trim();

      // Check if already exists
      const existing = await Admin.findOne({ discordId: cleanDiscordId });
      if (existing) {
        return res.status(409).json({ error: 'User is already an admin' });
      }

      // Check if it's an env admin
      const envAdminIds = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
      if (envAdminIds.includes(cleanDiscordId)) {
        return res.status(409).json({ error: 'User is already an admin (via environment)' });
      }

      const newAdmin = new Admin({
        discordId: cleanDiscordId,
        username: username?.trim() || undefined,
        addedBy: userId,
      });

      await newAdmin.save();

      return res.status(201).json(newAdmin);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
