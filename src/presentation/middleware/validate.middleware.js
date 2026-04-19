import { AppError } from "../../utils/AppError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      console.log("VALIDATION BODY:", req.body);
      console.log("VALIDATION ERRORS:", JSON.stringify(result.error.flatten(), null, 2));

      const errors = result.error?.errors ?? [];
      const message =
        errors.length > 0
          ? errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
          : "Invalid request";

      throw new AppError(message, 400);
    }

    req.body = result.data;
    next();
  };
}