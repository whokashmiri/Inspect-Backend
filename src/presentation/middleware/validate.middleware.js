

// validate.middleware.js
import { AppError } from "../../utils/AppError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error?.errors ?? [];
      const message =
        errors.length > 0
          ? errors.map((e) => e.message).join(", ")
          : "Invalid request";
      throw new AppError(message, 400);
    }
    req.body = result.data;
    next();
  };
}
