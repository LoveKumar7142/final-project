export const lazyRoute = (loader, exportName) => async (req, res, next) => {
  try {
    const module = await loader();
    const handler = module?.[exportName];

    if (typeof handler !== "function") {
      throw new Error(`Route handler "${exportName}" is not available`);
    }

    return await handler(req, res, next);
  } catch (error) {
    return next(error);
  }
};
