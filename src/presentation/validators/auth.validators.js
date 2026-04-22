import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
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

const assetTypePreprocess = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;

  const normalized = String(value).trim().toLowerCase();
  return normalized === "vehicle" ? "vehicle" : "other";
};

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: optionalOfflineId,
});

export const createAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),

  // new field
  parent: optionalOfflineId,

  // temporary backward compatibility
  parent: optionalOfflineId.optional(),

  writtenDescription: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),

  condition: z.preprocess(
    emptyToUndefined,
    z.enum(["New", "Used", "Damaged", "Good"]).optional().nullable()
  ),

  assetType: z.preprocess(
    assetTypePreprocess,
    z.enum(["vehicle", "other"]).optional()
  ),

  brand: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  model: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  code: z.preprocess(emptyToUndefined, z.string().optional().nullable()),

  isDone: z.preprocess(
    booleanPreprocess,
    z.boolean().optional().nullable()
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
});

export const updateAssetSchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().optional().nullable()),

  writtenDescription: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),

  condition: z.preprocess(
    emptyToUndefined,
    z.enum(["New", "Used", "Damaged", "Good"]).optional().nullable()
  ),

  assetType: z.preprocess(
    assetTypePreprocess,
    z.enum(["vehicle", "other"]).optional()
  ),

  brand: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  model: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  code: z.preprocess(emptyToUndefined, z.string().optional().nullable()),

  isDone: z.preprocess(
    booleanPreprocess,
    z.boolean().optional().nullable()
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
});