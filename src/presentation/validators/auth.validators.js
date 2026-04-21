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

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: optionalOfflineId,
});

const emptyToUndefined = (value) => (value === "" ? undefined : value);

export const createAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  folderId: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  writtenDescription: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),
  condition: z.preprocess(
    emptyToUndefined,
    z.enum(["New", "Used", "Damaged", "Good"]).optional().nullable()
  ),
  assetType: z.preprocess(
    emptyToUndefined,
    z.enum(["Vehicle", "Other"]).optional()
  ),
  brand: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  model: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  code: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  isDone: z.preprocess(
    (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      if (value === "") return undefined;
      return value;
    },
    z.boolean().optional().nullable()
  ),
  isPresent: z.preprocess(
    (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      if (value === "") return undefined;
      return value;
    },
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
  writtenDescription: z.preprocess(
    emptyToUndefined,
    z.string().optional().nullable()
  ),
  condition: z.preprocess(
    emptyToUndefined,
    z.enum(["New", "Used", "Damaged", "Good"]).optional().nullable()
  ),
  assetType: z.preprocess(
    emptyToUndefined,
    z.enum(["Vehicle", "Other"]).optional()
  ),
  brand: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  model: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  code: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  isDone: z.preprocess(
    (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      if (value === "") return undefined;
      return value;
    },
    z.boolean().optional().nullable()
  ),
  isPresent: z.preprocess(
    (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      if (value === "") return undefined;
      return value;
    },
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