# CDN Asset Deployment & Configuration

## Overview

MathFuel uses Manus CDN for all large media assets (videos, high-res images). This ensures:

- **Fast delivery** - Global CDN with edge caching
- **Reduced bandwidth** - Local project stays lean (~500KB vs ~13MB)
- **Proper cache headers** - Immutable versioning for production
- **Fallback handling** - Graceful degradation if CDN fails
- **Clean architecture** - Separation of concerns between code and assets

## Asset Inventory

### Production Assets (CDN-Hosted)

| Asset | Type | Size | CDN URL | Cache Control |
|-------|------|------|---------|---|
| wisconsin-map-background.png | Image | 2.2MB | `https://files.manuscdn.com/.../bwIDBdLwQwIJWOBo.png` | immutable, 1 year |
| tutorial_01_individual_certificates.mp4 | Video | 1.6MB | `https://files.manuscdn.com/.../XimOZUOcafsmZzsv.mp4` | immutable, 1 year |
| tutorial_02_bulk_certificates.mp4 | Video | 1.9MB | `https://files.manuscdn.com/.../pUTBlHxUdTKaJfnZ.mp4` | immutable, 1 year |
| tutorial_03_email_certificates.mp4 | Video | 1.8MB | `https://files.manuscdn.com/.../xuRNfenrbQPsJINt.mp4` | immutable, 1 year |
| tutorial_04_email_templates.mp4 | Video | 2.0MB | `https://files.manuscdn.com/.../PxebGrEDNBXYKZYG.mp4` | immutable, 1 year |
| corn-cob-piece.png | Image | 1.0MB | `https://files.manuscdn.com/.../xJDDBEJcDPiFVruq.png` | immutable, 1 year |
| milk-carton-piece.png | Image | 1.0MB | `https://files.manuscdn.com/.../YUjXfIBJLSZXTuoZ.png` | immutable, 1 year |

**Total CDN Size:** ~13MB (removed from project)

### Local Placeholders (Fallback)

Located in `client/public/`:

- `images/placeholder-map.png` - Fallback for wisconsin-map-background
- `images/placeholder-corn.png` - Fallback for corn-cob-piece
- `images/placeholder-milk.png` - Fallback for milk-carton-piece
- `images/placeholder.png` - Generic fallback
- `videos/placeholder-tutorial.mp4` - Fallback for all tutorials

## Usage in Code

### Using the CDN Asset Hook

```typescript
import { useAsset } from "@/_core/hooks/useAsset";

export function MyComponent() {
  const { url, isLoading, error, isFallback } = useAsset({
    category: "images",
    assetKey: "wisconsinMapBackground",
    onError: (error) => console.error("Failed to load:", error),
  });

  return (
    <div>
      {isLoading && <div>Loading image...</div>}
      <img src={url} alt="Wisconsin map" />
      {isFallback && <p className="text-sm text-gray-500">Using cached version</p>}
    </div>
  );
}
```

### Using the CDN Asset Configuration

```typescript
import { CDN_ASSETS, getAssetUrl, getTutorialVideos } from "@shared/cdn-assets";

// Get single asset URL
const mapUrl = getAssetUrl("images", "wisconsinMapBackground");

// Get all tutorials
const tutorials = getTutorialVideos();
tutorials.forEach((video) => {
  console.log(video.title, video.url);
});

// Direct access to asset metadata
const asset = CDN_ASSETS.images.wisconsinMapBackground;
console.log(asset.cacheControl); // "public, max-age=31536000, immutable"
```

### In React Components

```typescript
import { CDN_ASSETS } from "@shared/cdn-assets";

export function TutorialCard() {
  const video = CDN_ASSETS.tutorials.individualCertificates;

  return (
    <video
      src={video.url}
      poster={video.url.replace(".mp4", ".jpg")}
      controls
      onError={(e) => {
        console.error("Video failed to load");
        e.currentTarget.src = video.fallback;
      }}
    />
  );
}
```

## Cache Headers Explained

### Immutable Assets (1 Year Cache)

```
Cache-Control: public, max-age=31536000, immutable
```

Used for versioned assets that never change:
- Tutorial videos (once recorded, never modified)
- Background images (static assets)
- Decorative images (static assets)

**Why immutable?**
- Browser caches forever
- CDN caches forever
- Zero cache validation overhead
- Fastest possible delivery

### Dynamic Assets (1 Day Cache)

```
Cache-Control: public, max-age=86400
```

Used for assets that might update:
- User-generated content
- Dynamic images
- Frequently updated videos

## Fallback Handling

The system automatically handles CDN failures:

1. **Initial Load** - Tries to load from CDN
2. **On Error** - Falls back to local placeholder
3. **Retry** - Can manually retry (up to 3 times)
4. **Metrics** - Logs error for monitoring

```typescript
const { url, error, isFallback, retry } = useAsset({
  category: "images",
  assetKey: "wisconsinMapBackground",
});

if (error) {
  return (
    <div>
      <p>Failed to load image. Using cached version.</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
}
```

## Monitoring & Metrics

Asset loading is tracked automatically:

```typescript
import { getAssetMetrics } from "@shared/cdn-assets";

// Get all asset loading metrics
const metrics = getAssetMetrics();
metrics.forEach((m) => {
  console.log(`${m.assetKey}: ${m.loadTime}ms, success: ${m.success}`);
});
```

Metrics include:
- Asset key
- Load time (ms)
- Success/failure
- Fallback usage
- CDN URL vs fallback URL

## Adding New Assets

### Step 1: Upload to CDN

```bash
manus-upload-file path/to/asset.mp4
```

### Step 2: Add to cdn-assets.ts

```typescript
export const CDN_ASSETS = {
  tutorials: {
    newTutorial: {
      url: "https://files.manuscdn.com/.../newAsset.mp4",
      fallback: "/videos/placeholder-tutorial.mp4",
      cacheControl: "public, max-age=31536000, immutable",
      title: "New Tutorial",
      duration: "3:00",
      description: "Description of the tutorial",
      gated: false,
    },
  },
};
```

### Step 3: Archive Original

```bash
mv path/to/asset.mp4 /home/ubuntu/webdev-static-assets/tutorials/
```

### Step 4: Use in Code

```typescript
const { url } = useAsset({
  category: "tutorials",
  assetKey: "newTutorial",
});
```

## Performance Optimization

### Preload Critical Assets

```typescript
import { preloadCriticalAssets } from "@shared/cdn-assets";

// Call on app initialization
useEffect(() => {
  preloadCriticalAssets();
}, []);
```

### Preload Multiple Assets

```typescript
import { usePreloadAssets } from "@/_core/hooks/useAsset";

export function HomePage() {
  const { isLoading } = usePreloadAssets([
    { category: "images", assetKey: "wisconsinMapBackground" },
    { category: "tutorials", assetKey: "individualCertificates" },
  ]);

  if (isLoading) return <LoadingSpinner />;
  return <HomePage />;
}
```

## Troubleshooting

### Video Not Playing

**Problem:** Video shows placeholder instead of CDN video

**Solution:**
1. Check browser console for CORS errors
2. Verify CDN URL is correct in `cdn-assets.ts`
3. Check if video codec is supported (H.264 for MP4)
4. Try manual retry: `retry()` button

### Image Not Loading

**Problem:** Image shows placeholder

**Solution:**
1. Verify CDN URL is accessible in browser
2. Check image format (PNG, JPG supported)
3. Check if image dimensions match expected size
4. Try clearing browser cache and reloading

### Slow Load Times

**Problem:** Assets take too long to load

**Solution:**
1. Check network tab in DevTools
2. Verify CDN is being used (not local fallback)
3. Check if browser cache is working (should be instant on reload)
4. Consider preloading critical assets

## Archive Storage

Original files are archived in `/home/ubuntu/webdev-static-assets/`:

```
webdev-static-assets/
├── images/
│   ├── wisconsin-map-background.png (2.2MB)
│   ├── corn-cob-piece.png (1.0MB)
│   └── milk-carton-piece.png (1.0MB)
└── tutorials/
    ├── tutorial_01_individual_certificates.mp4 (1.6MB)
    ├── tutorial_02_bulk_certificates.mp4 (1.9MB)
    ├── tutorial_03_email_certificates.mp4 (1.8MB)
    └── tutorial_04_email_templates.mp4 (2.0MB)
```

These are kept for:
- Backup/recovery
- Re-uploading if CDN URLs change
- Local testing without CDN
- Archival purposes

## Production Deployment

When deploying to production:

1. ✅ All CDN URLs are already configured
2. ✅ Cache headers are set to immutable (1 year)
3. ✅ Fallback placeholders are in place
4. ✅ Error handling is automatic
5. ✅ Metrics are tracked

**No additional configuration needed** - the system is production-ready.

## Future Enhancements

- [ ] Generate multiple image sizes for responsive design
- [ ] Implement video thumbnail generation
- [ ] Add CDN analytics dashboard
- [ ] Implement automatic retry with exponential backoff
- [ ] Add service worker caching for offline support
- [ ] Implement adaptive bitrate streaming for videos
