export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const getDiscordAvatarUrl = (userId: string, avatarHash: string | undefined): string => {
  if (!avatarHash) {
    // Default Discord avatar
    const defaultIndex = parseInt(userId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  }
  const ext = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}`;
};

// Discord ID validation (snowflake format: 17-19 digit number)
export const isValidDiscordId = (id: string): boolean => {
  return /^\d{17,19}$/.test(id.trim());
};
