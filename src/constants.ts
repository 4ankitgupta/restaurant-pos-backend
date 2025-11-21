export const DB_NAME = "pos_db";

// Feature Flag Constants
export const FEATURE_FLAGS = {
  AI_CHAT: "ai_chat",
  INVENTORY: "inventory",
  ZOMATO_INTEGRATION: "zomato_integration",
  SWIGGY_INTEGRATION: "swiggy_integration",
  BIOMETRIC_ATTENDANCE: "biometric_attendance",
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
