import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  role: z.enum(["Manager", "Inspector", "Valuator"], {
    errorMap: () => ({ message: "Role is required" }),
  }),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().trim().min(1, "Company name is required"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
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

export const createAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  folderId: z.string().optional().nullable(),
  writtenDescription: z.string().optional().nullable(),
  condition: z.enum(["New", "Used", "Damaged"]).optional().nullable(),
  assetType: z.enum(["Vehicle", "Other"]).optional(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
    isDone: z.preprocess(
    (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    },
    z.boolean().optional().nullable()
  ),
  manufactureYear: z.string().optional().nullable(),
  kilometersDriven: z.string().optional().nullable(),
});

export const updateAssetSchema = z.object({
  writtenDescription: z.string().optional().nullable(),
  condition: z.enum(["New", "Used", "Damaged"]).optional().nullable(),
  assetType: z.enum(["Vehicle", "Other"]).optional(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  isDone: z.preprocess(
    (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    },
    z.boolean().optional().nullable()
  ),
  manufactureYear: z.string().optional().nullable(),
  kilometersDriven: z.string().optional().nullable(),
});
