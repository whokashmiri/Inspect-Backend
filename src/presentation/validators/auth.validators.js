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


export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().uuid("Invalid parentId").optional().nullable(),
});

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Asset name is required"),
  serialNumber: z.string().trim().min(1, "Serial number is required"),
  writtenDescription: z.string().trim().optional().nullable(),
  folderId: z
    .union([z.string().uuid("Invalid folderId"), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" ? null : value)),
});