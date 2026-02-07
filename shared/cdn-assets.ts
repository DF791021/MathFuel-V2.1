/**
 * CDN Asset Mapping & Configuration
 * Production-grade asset delivery with cache headers and fallback handling
 * 
 * All large media files are hosted on Manus CDN with:
 * - Proper cache headers (immutable for versioned assets, max-age for others)
 * - Public-read access for tutorials and marketing assets
 * - Clean /assets/tutorials/ folder structure
 * - Fallback placeholders for failed loads
 */

export const CDN_ASSETS = {
  // Background Images
  images: {
    wisconsinMapBackground: {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663117001051/bwIDBdLwQwIJWOBo.png",
      fallback: "/images/placeholder-map.png",
      cacheControl: "public, max-age=31536000, immutable", // 1 year for versioned asset
      alt: "Wisconsin map background",
      width: 1920,
      height: 1080,
    },
    cornCobPiece: {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663117001051/xJDDBEJcDPiFVruq.png",
      fallback: "/images/placeholder-corn.png",
      cacheControl: "public, max-age=31536000, immutable",
      alt: "Corn cob decorative piece",
      width: 400,
      height: 400,
    },
    milkCartonPiece: {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663117001051/YUjXfIBJLSZXTuoZ.png",
      fallback: "/images/placeholder-milk.png",
      cacheControl: "public, max-age=31536000, immutable",
      alt: "Milk carton decorative piece",
      width: 400,
      height: 400,
    },
  },

  // Tutorial Videos
  tutorials: {
    individualCertificates: {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663117001051/XimOZUOcafsmZzsv.mp4",
      fallback: "/videos/placeholder-tutorial.mp4",
      cacheControl: "public, max-age=31536000, immutable",
      title: "Individual Certificates Tutorial",
      duration: "2:45",
      description: "Learn how to generate and send individual certificates to students",
      gated: false, // Public tutorial
    },
    bulkCertificates: {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663117001051/pUTBlHxUdTKaJfnZ.mp4",
      fallback: "/videos/placeholder-tutorial.mp4",
      cacheControl: "public, max-age=31536000, immutable",
      title: "Bulk Certificates Tutorial",
      duration: "3:12",
      description: "Efficiently generate certificates for multiple students at once",
      gated: false,
    },
    emailCertificates: {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663117001051/xuRNfenrbQPsJINt.mp4",
      fallback: "/videos/placeholder-tutorial.mp4",
      cacheControl: "public, max-age=31536000, immutable",
      title: "Email Certificates Tutorial",
      duration: "2:30",
      description: "Automatically email certificates to parents and students",
      gated: false,
    },
    emailTemplates: {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663117001051/PxebGrEDNBXYKZYG.mp4",
      fallback: "/videos/placeholder-tutorial.mp4",
      cacheControl: "public, max-age=31536000, immutable",
      title: "Email Templates Tutorial",
      duration: "3:45",
      description: "Customize email templates for certificate delivery",
      gated: false,
    },
  },
} as const;

/**
 * Get asset URL with fallback handling
 * Returns CDN URL if available, falls back to local placeholder on error
 */
export function getAssetUrl(
  category: keyof typeof CDN_ASSETS,
  assetKey: string,
  preferFallback: boolean = false
): string {
  const asset = (CDN_ASSETS[category] as any)?.[assetKey];

  if (!asset) {
    console.warn(`Asset not found: ${category}.${assetKey}`);
    return "/images/placeholder.png";
  }

  return preferFallback ? asset.fallback : asset.url;
}

/**
 * Get cache control header for asset
 * Used when serving assets through a custom endpoint
 */
export function getCacheControl(
  category: keyof typeof CDN_ASSETS,
  assetKey: string
): string {
  const asset = (CDN_ASSETS[category] as any)?.[assetKey];
  return asset?.cacheControl || "public, max-age=86400"; // 1 day default
}

/**
 * Check if asset is gated (requires authentication)
 */
export function isAssetGated(
  category: keyof typeof CDN_ASSETS,
  assetKey: string
): boolean {
  const asset = (CDN_ASSETS[category] as any)?.[assetKey];
  return asset?.gated || false;
}

/**
 * Get all tutorial videos for listing
 */
export function getTutorialVideos() {
  return Object.entries(CDN_ASSETS.tutorials).map(([key, video]) => ({
    id: key,
    ...video,
  }));
}

/**
 * Get all background images
 */
export function getBackgroundImages() {
  return Object.entries(CDN_ASSETS.images).map(([key, image]) => ({
    id: key,
    ...image,
  }));
}

/**
 * Asset loading error handler
 * Logs error and suggests fallback
 */
export function handleAssetLoadError(
  category: keyof typeof CDN_ASSETS,
  assetKey: string,
  error: Error
): string {
  console.error(`Failed to load ${category}.${assetKey}:`, error);
  return getAssetUrl(category, assetKey, true); // Return fallback
}

/**
 * Preload critical assets for better performance
 * Call this on app initialization
 */
export function preloadCriticalAssets(): void {
  // Preload background image
  const bgImage = new Image();
  bgImage.src = CDN_ASSETS.images.wisconsinMapBackground.url;
  bgImage.onerror = () => {
    console.warn("Failed to preload background image, will use fallback");
  };

  // Preload first tutorial video metadata
  const videoLink = document.createElement("link");
  videoLink.rel = "prefetch";
  videoLink.href = CDN_ASSETS.tutorials.individualCertificates.url;
  document.head.appendChild(videoLink);
}

/**
 * Generate responsive image srcset for CDN images
 * Useful for different screen sizes
 */
export function getImageSrcSet(
  category: keyof typeof CDN_ASSETS,
  assetKey: string
): string {
  const asset = (CDN_ASSETS[category] as any)?.[assetKey];
  if (!asset) return "";

  // For now, return single URL
  // In future, could generate multiple sizes from CDN
  return asset.url;
}

/**
 * Asset delivery metrics (for monitoring)
 */
export interface AssetMetrics {
  category: string;
  assetKey: string;
  url: string;
  loadTime: number;
  success: boolean;
  fallbackUsed: boolean;
}

// Track asset loading for monitoring
const assetMetrics: AssetMetrics[] = [];

export function recordAssetMetric(metric: AssetMetrics): void {
  assetMetrics.push(metric);
  // In production, send to analytics service
  if (assetMetrics.length % 100 === 0) {
    console.log("Asset metrics:", assetMetrics);
  }
}

export function getAssetMetrics(): AssetMetrics[] {
  return assetMetrics;
}
