export const BAGO_BRAND = {
  name: "Bago",
  adminLabel: "Bago Support Desk",
  logoUrl:
    "https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png",
  colors: {
    primary: "#5C4BFD",
    primaryDark: "#4335E0",
    secondary: "#1E2749",
    soft: "#EEEBFF",
    supportBlue: "#355CC9",
    supportGold: "#C66A1C",
    supportGreen: "#16794A",
    danger: "#C73737",
  },
} as const;

export const STAFF_PERMISSION_PRESETS = {
  SUPPORT_ADMIN: [
    "support.read",
    "support.reply",
    "support.assign",
    "support.status.update",
    "support.saved_replies.use",
  ],
  SAFETY_ADMIN: [
    "support.read",
    "support.reply",
    "support.assign",
    "support.status.update",
    "support.notes.manage",
    "disputes.manage",
    "kyc.review",
  ],
  SUPER_ADMIN: [
    "support.read",
    "support.reply",
    "support.assign",
    "support.status.update",
    "support.notes.manage",
    "support.saved_replies.manage",
    "staff.manage",
    "settings.manage",
  ],
} as const;
