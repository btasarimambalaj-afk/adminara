module.exports = {
  init: () => {},
  Handlers: {
    requestHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err),
  },
  captureException: () => {},
  setUser: () => {},
  setContext: () => {},
};
