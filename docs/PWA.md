# PWA (Progressive Web App) Documentation

## Overview

AdminAra is a fully functional Progressive Web App that can be installed on mobile and desktop devices for a native app-like experience.

## Features

### ✅ Installable
- Add to Home Screen (iOS/Android)
- Desktop installation (Chrome/Edge)
- Standalone display mode
- Custom app icon and splash screen

### ✅ Offline Support
- Service Worker caching
- Offline fallback page
- Background sync
- Push notifications (future)

### ✅ Native Experience
- Full-screen mode
- Custom theme color
- App shortcuts
- Splash screen

## Installation

### Mobile (iOS)

1. Open https://adminara.onrender.com in Safari
2. Tap the Share button (⬆️)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

### Mobile (Android)

1. Open https://adminara.onrender.com in Chrome
2. Tap the menu (⋮)
3. Tap "Add to Home screen"
4. Tap "Add" to confirm

**Or**: Look for the install prompt at the bottom of the screen

### Desktop (Chrome/Edge)

1. Open https://adminara.onrender.com
2. Click the install icon (⊕) in the address bar
3. Click "Install" to confirm

**Or**: Click the "📱 Uygulamayı Yükle" button

## Manifest Configuration

**File**: `public/manifest.json`

```json
{
  "name": "AdminAra - Video Destek",
  "short_name": "AdminAra",
  "display": "standalone",
  "theme_color": "#667eea",
  "background_color": "#667eea",
  "orientation": "portrait-primary"
}
```

## Icons

| Size | Purpose | File |
|------|---------|------|
| 16x16 | Browser tab | favicon.ico |
| 32x32 | Browser tab | favicon.ico |
| 180x180 | Apple Touch Icon | apple-touch-icon.png |
| 192x192 | Android | icon-192x192.png |
| 512x512 | Splash screen | icon-512x512.png |

## App Shortcuts

Quick actions from home screen:

1. **Müşteri Destek** → `/`
2. **Admin Panel** → `/admin`

## Screenshots

PWA install prompt shows app screenshots:
- Mobile view (540x720)
- Desktop view (future)

## Service Worker

**File**: `public/service-worker.js`

**Caching Strategy**:
- Static assets: Cache-first
- API calls: Network-first
- Images: Cache-first with fallback

**Cache Duration**: 7 days

## Testing

### Lighthouse PWA Audit

```bash
# Run Lighthouse
npx lighthouse https://adminara.onrender.com --view

# Check PWA score
# Target: 90+
```

### Manual Testing

**iOS Safari**:
- [ ] Add to Home Screen works
- [ ] App opens in standalone mode
- [ ] Theme color applied
- [ ] Splash screen shows

**Android Chrome**:
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] Shortcuts work
- [ ] Offline mode works

**Desktop Chrome**:
- [ ] Install icon appears
- [ ] App installs to desktop
- [ ] Window opens standalone
- [ ] Uninstall works

## Troubleshooting

### Install prompt not showing

**Causes**:
- Already installed
- Not HTTPS (except localhost)
- Service Worker not registered
- Manifest invalid

**Solutions**:
```bash
# Check manifest
curl https://adminara.onrender.com/manifest.json

# Check service worker
# DevTools → Application → Service Workers

# Clear cache and reload
# DevTools → Application → Clear storage
```

### App not updating

**Solution**:
```javascript
// Force service worker update
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update());
});
```

### Icons not showing

**Causes**:
- Wrong file path
- Invalid image format
- Missing sizes

**Solution**:
- Verify files exist in `/public`
- Check manifest.json paths
- Validate image dimensions

## Best Practices

1. **Always use HTTPS** (required for PWA)
2. **Test on real devices** (not just emulators)
3. **Optimize icons** (use PNG, not SVG for icons)
4. **Update service worker** on each deployment
5. **Monitor install rate** (analytics)

## Future Enhancements

- [ ] Push notifications
- [ ] Background sync
- [ ] Periodic background sync
- [ ] Web Share API
- [ ] Badging API
- [ ] File handling

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- [Icon Generator](https://realfavicongenerator.net/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## Metrics

**Target Scores**:
- PWA Score: 90+
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

**Current Status**: ✅ PWA Ready
