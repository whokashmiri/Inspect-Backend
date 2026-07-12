import { z } from "zod";


export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});


export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const completeProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),

  serviceCities: z
    .array(z.string().trim().min(1))
    .min(1, "At least one city is required"),
});


export const requestSignupOtpSchema = z.object({
  phone: z.string().trim().min(1, "Phone number is required"),
});

export const verifySignupOtpSchema = z.object({
  phone: z.string().trim().min(1, "Phone number is required"),

  otp: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "OTP must be 4 digits"),
});

export const setSignupPasswordSchema = z.object({
  setupToken: z.string().min(1, "Setup token is required"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  role: z
    .enum(["Manager", "Inspector", "Valuator", "company_admin" , "Freelance Inspector"])
    .optional()
    .default("Freelance Inspector"),
});

export const requestPasswordResetOtpSchema = z.object({
  phone: z.string().trim().min(1, "Phone number is required"),
});

export const verifyPasswordResetOtpSchema = z.object({
  phone: z.string().trim().min(1, "Phone number is required"),

  otp: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "OTP must be 4 digits"),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

const offlineIdSchema = z
  .string()
  .regex(/^(?:offline_[A-Za-z0-9_-]+|[0-9a-fA-F]{24})$/, {
    message: "Invalid id format",
  });

const optionalOfflineId = z
  .union([offlineIdSchema, z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === "" || value === null ? null : value ?? null));

const emptyToUndefined = (value) => (value === "" ? undefined : value);

const booleanPreprocess = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "") return undefined;
  return value;
};

const uploadedImageSchema = z.object({
  url: z.string().url("Invalid media URL"),

  publicId: z.string().optional().nullable(),

  mediaType: z
    .enum(["image", "video"])
    .optional()
    .default("image"),

  mimeType: z.string().optional().nullable(),

  duration: z.number().optional().nullable(),

  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional().nullable(),
});

const uploadedVoiceNoteSchema = z.object({
  url: z.string().url("Invalid voice note URL"),
  publicId: z.string().optional().nullable(),
  duration: z.number().optional().nullable(),
});
const jsonPreprocess = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
};

const assetTypePreprocess = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;

  const normalized = String(value).trim().toLowerCase();
  return normalized === "vehicle" ? "vehicle" : "other";
};


const numberPreprocess = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return undefined;

  return numberValue;
};

const stringTrimPreprocess = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;

  const text = String(value).trim();

  return text || undefined;
};

const nullableStringTrimPreprocess = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const text = String(value).trim();

  return text || null;
};

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: optionalOfflineId,
});

export const renameSubAssetTypeSchema = z.object({
  oldSubAssetType: z.preprocess(
    stringTrimPreprocess,
    z.string().min(1, "Old sub asset type is required").max(80)
  ),

  newSubAssetType: z.preprocess(
    stringTrimPreprocess,
    z.string().min(1, "New sub asset type is required").max(80)
  ),

  parent: optionalOfflineId,
});

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Asset name is required"),

  parent: optionalOfflineId,

  rawData: z.preprocess(jsonPreprocess, z.any().optional()),

condition: z.preprocess(
  nullableStringTrimPreprocess,
  z.string().max(80, "Condition is too long").optional().nullable()
),

  assetType: z.preprocess(
    assetTypePreprocess,
    z.enum(["vehicle", "other"]).optional()
  ),

 subAssetType: z.preprocess(
  nullableStringTrimPreprocess,
  z.string().max(80, "Sub asset type is too long").optional().nullable()
),

  quantity: z.preprocess(
    numberPreprocess,
    z.number().int().min(1).optional().nullable()
  ),

  brand: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  model: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  code: z.preprocess(emptyToUndefined, z.string().optional().nullable()),

  isDone: z.preprocess(
    booleanPreprocess,
    z.boolean().optional().nullable()
  ),

  notes: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),

  isPresent: z.preprocess(
    booleanPreprocess,
    z.boolean().optional().nullable()
  ),

  manufactureYear: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),

  kilometersDriven: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),

  images: z.preprocess(
    jsonPreprocess,
    z.array(uploadedImageSchema).optional().default([])
  ),

  voiceNotes: z.preprocess(
    jsonPreprocess,
    z.array(uploadedVoiceNoteSchema).optional().default([])
  ),
});

export const updateAssetSchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().optional().nullable()),

  rawData: z.preprocess(jsonPreprocess, z.any().optional()),

 condition: z.preprocess(
  nullableStringTrimPreprocess,
  z.string().max(80, "Condition is too long").optional().nullable()
),

  assetType: z.preprocess(
    assetTypePreprocess,
    z.enum(["vehicle", "other"]).optional()
  ),

subAssetType: z.preprocess(
  nullableStringTrimPreprocess,
  z.string().max(80, "Sub asset type is too long").optional().nullable()
),

  quantity: z.preprocess(
    numberPreprocess,
    z.number().int().min(1).optional().nullable()
  ),

  brand: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  model: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  code: z.preprocess(emptyToUndefined, z.string().optional().nullable()),

  isDone: z.preprocess(
    booleanPreprocess,
    z.boolean().optional().nullable()
  ),

  notes: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),

  isPresent: z.preprocess(
    booleanPreprocess,
    z.boolean().optional().nullable()
  ),

  manufactureYear: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),

  kilometersDriven: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),

  images: z.preprocess(
    jsonPreprocess,
    z.array(uploadedImageSchema).optional().default([])
  ),

  voiceNotes: z.preprocess(
    jsonPreprocess,
    z.array(uploadedVoiceNoteSchema).optional().default([])
  ),
});