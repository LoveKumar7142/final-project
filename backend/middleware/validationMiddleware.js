import { z } from "zod";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate the request body or query via schema
      const result = schema.parse(req.body);
      // Replace req.body with the sanitized result
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Collect exact field errors clearly
        const errors = error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return res.status(400).json({ 
          message: "Validation Error", 
          details: errors 
        });
      }
      next(error);
    }
  };
};
