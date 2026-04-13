export const lazyRoute = (loader, exportName) => {
  if (typeof loader !== "function" || !exportName) {
    throw new Error("Invalid route configuration");
  }

  return async (req, res, next) => {
    try {
      const module = await loader();

      if (!module || typeof module !== "object") {
        throw new Error("Invalid module");
      }

      const handler = module[exportName];

      if (typeof handler !== "function") {
        throw new Error("Handler not found");
      }

      return await handler(req, res, next);
    } catch (error) {
      console.error("LAZY ROUTE ERROR:", error);

      if (error.statusCode) {
        return next(error);
      }

      return next({
        statusCode: 500,
        message: "Internal server error",
      });
    }
  };
};
