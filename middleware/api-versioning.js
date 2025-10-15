// middleware/api-versioning.js - API Versioning Headers

function apiVersioning(req, res, next) {
  res.setHeader('API-Version', '1.0');
  res.setHeader('API-Supported-Versions', '1.0');
  next();
}

function deprecationWarning(sunsetDate) {
  return (req, res, next) => {
    res.setHeader('Sunset', sunsetDate);
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', '</api-docs>; rel="deprecation"');
    next();
  };
}

module.exports = {
  apiVersioning,
  deprecationWarning
};
