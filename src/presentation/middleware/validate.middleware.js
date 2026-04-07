import { AppError } from "../../utils/AppError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(", ");
      throw new AppError(message, 400);
    }
    req.body = result.data;
    next();
  };
}
