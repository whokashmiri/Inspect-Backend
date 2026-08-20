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

// Structured images payload:
//   Vehicle assets use: plate, details, odometer, other[]
//   Other assets use:   details, brand, other[]
// Every single-image slot is nullable (null = explicitly clear that slot).
// Slots that don't apply to the asset's assetType are ignored/cleared
// downstream by the model, so this schema stays permissive about which
// slots are present — it just validates shape, not asset-type relevance.
const assetImagesObjectSchema = z.object({
  main: uploadedImageSchema.optional().nullable(),
  plate: uploadedImageSchema.optional().nullable(),
  details: uploadedImageSchema.optional().nullable(),
  odometer: uploadedImageSchema.optional().nullable(),
  brand: uploadedImageSchema.optional().nullable(),
  other: z.array(uploadedImageSchema).optional(),
});

// Accepts the new structured object, or (for backward compatibility with
// older clients) a plain array — which the controller treats as the
// "other" slot.
const assetImagesPayloadSchema = z.union([
  assetImagesObjectSchema,
  z.array(uploadedImageSchema),
]);

const emptyImagesDefault = {
  main:null,
  plate: null,
  details: null,
  odometer: null,
  brand: null,
  other: [],
};

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

const taxonomyStringSchema = z.preprocess(
  nullableStringTrimPreprocess,
  z.string().max(200).optional().nullable()
);

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: optionalOfflineId,
});


export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Asset name is required"),
  categoryId: taxonomyStringSchema,
category: taxonomyStringSchema,

typeId: taxonomyStringSchema,
type: taxonomyStringSchema,

nameId: taxonomyStringSchema,

  parent: optionalOfflineId,
  rawData: z.preprocess(
  jsonPreprocess,
  z.any().optional()
),

// normalizedData: z.preprocess(
//   jsonPreprocess,
//   z.record(z.any()).optional()
// ),
newAssetLocation: z.preprocess(
  nullableStringTrimPreprocess,
  z.string()
    .max(300, "Asset location is too long")
    .optional()
    .nullable()
),

  rawData: z.preprocess(jsonPreprocess, z.any().optional()),

condition: z.preprocess(
  nullableStringTrimPreprocess,
  z.string().max(80, "Condition is too long").optional().nullable()
),

  assetType: z.preprocess(
    assetTypePreprocess,
    z.enum(["vehicle", "other"]).optional()
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

  // New assets get a fully-shaped images object by default so downstream
  // code always sees plate/details/odometer/brand/other present.
  images: z.preprocess(
    jsonPreprocess,
    assetImagesPayloadSchema.optional().default(emptyImagesDefault)
  ),

  voiceNotes: z.preprocess(
    jsonPreprocess,
    z.array(uploadedVoiceNoteSchema).optional().default([])
  ),
});

export const updateAssetSchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  categoryId: taxonomyStringSchema,
  category: taxonomyStringSchema,

  typeId: taxonomyStringSchema,
  type: taxonomyStringSchema,

  nameId: taxonomyStringSchema,

  rawData: z.preprocess(jsonPreprocess, z.any().optional()),

//   normalizedData: z.preprocess(
//   jsonPreprocess,
//   z.record(z.any()).optional()
// ),

newAssetLocation: z.preprocess(
  nullableStringTrimPreprocess,
  z.string()
    .max(300, "Asset location is too long")
    .optional()
    .nullable()
),

 condition: z.preprocess(
  nullableStringTrimPreprocess,
  z.string().max(80, "Condition is too long").optional().nullable()
),

  assetType: z.preprocess(
    assetTypePreprocess,
    z.enum(["vehicle", "other"]).optional()
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

  // No default here on purpose: omitting "images" entirely on update means
  // "don't touch existing images" (see folderAssetService.updateAsset /
  // mergeImages). Only whichever slots are actually sent get validated and
  // applied; the rest stay untouched.
  images: z.preprocess(jsonPreprocess, assetImagesPayloadSchema.optional()),

  voiceNotes: z.preprocess(
    jsonPreprocess,
    z.array(uploadedVoiceNoteSchema).optional().default([])
  ),
});