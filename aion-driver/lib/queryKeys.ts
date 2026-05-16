/** Префикс cloud: — кэш TanStack Query персистится (см. AppProviders). */
export const qk = {
  profile: (userId: string) => ["cloud:profile", userId] as const,
  vehicles: (userId: string) => ["cloud:vehicles", userId] as const,
  trips: (userId: string) => ["cloud:trips", userId] as const,
};
