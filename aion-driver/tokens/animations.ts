export const springs = {
  buttonPress: { damping: 16, stiffness: 240 },
  buttonRelease: { damping: 14, stiffness: 200 },
  cardPress: { damping: 18, stiffness: 260 },
  cardRelease: { damping: 16, stiffness: 220 },
} as const;

export const timing = {
  fadeFast: 220,
  fade: 320,
  modal: 280,
  progressBar: 260,
} as const;
