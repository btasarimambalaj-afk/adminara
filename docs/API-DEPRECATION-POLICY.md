# AdminAra - API Deprecation Policy

## Overview

This document outlines the deprecation policy for AdminAra REST and WebSocket APIs.

## Versioning Strategy

- **Current Version**: v1.0
- **Supported Versions**: v1.0
- **Version Format**: `/v{major}/endpoint`

## Deprecation Process

### 1. Announcement (T-0)
- Deprecation announced in release notes
- `Deprecation: true` header added to endpoint
- Documentation updated with migration guide

### 2. Sunset Warning (T+3 months)
- `Sunset` header added with removal date
- Email notification to API consumers
- Dashboard warning for admin users

### 3. Removal (T+6 months)
- Endpoint returns 410 Gone
- Redirect to new endpoint (if applicable)
- Final migration guide published

## Headers

### Deprecation Headers
```http
Deprecation: true
Sunset: Wed, 01 Jan 2026 00:00:00 GMT
Link: </api-docs#migration>; rel="deprecation"
```

### Version Headers
```http
API-Version: 1.0
API-Supported-Versions: 1.0, 1.1
```

## Current API Status

### v1.0 (Current)
- **Status**: ✅ Active
- **Endpoints**: All `/v1/*` routes
- **Support Until**: TBD

### Deprecated Endpoints
None currently

## Migration Guide

When an endpoint is deprecated:

1. Check `Deprecation` header in response
2. Read `Sunset` header for removal date
3. Follow migration guide in documentation
4. Test new endpoint in staging
5. Deploy to production before sunset date

## Breaking Changes

Breaking changes require major version bump:
- Removing required fields
- Changing response structure
- Removing endpoints
- Changing authentication

Non-breaking changes (minor version):
- Adding optional fields
- Adding new endpoints
- Performance improvements

## Support

For migration assistance:
- Documentation: `/api-docs`
- GitHub Issues: [Repository URL]
- Email: support@adminara.com

## Timeline Example

```
T+0:   Deprecation announced
T+1m:  Migration guide published
T+3m:  Sunset header added
T+6m:  Endpoint removed
```

## Backward Compatibility

We maintain backward compatibility within major versions:
- v1.0 → v1.1: Compatible
- v1.x → v2.0: Breaking changes allowed
