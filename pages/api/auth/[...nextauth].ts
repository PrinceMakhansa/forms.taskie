import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const discordProfile = profile as any;
        // Store Discord user info in token
        token.id = discordProfile.id;
        token.username = discordProfile.username;
        token.discriminator = discordProfile.discriminator;
        token.avatar = discordProfile.avatar;
        token.global_name = discordProfile.global_name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as any;
        user.id = token.id;
        user.username = token.username;
        user.discriminator = token.discriminator;
        user.avatar = token.avatar;
        user.global_name = token.global_name;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
