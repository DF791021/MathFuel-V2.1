/**
 * useAsset Hook
 * Manages CDN asset loading with fallback handling and error recovery
 */

import { useState, useEffect, useCallback } from "react";
import { getAssetUrl, handleAssetLoadError, recordAssetMetric } from "@shared/cdn-assets";

interface UseAssetOptions {
  category: "images" | "tutorials";
  assetKey: string;
  preferFallback?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

interface UseAssetResult {
  url: string;
  isLoading: boolean;
  error: Error | null;
  isFallback: boolean;
  retry: () => void;
}

/**
 * Hook to load CDN assets with fallback handling
 * Automatically retries on failure and tracks metrics
 */
export function useAsset({
  category,
  assetKey,
  preferFallback = false,
  onError,
  onSuccess,
}: UseAssetOptions): UseAssetResult {
  const [url, setUrl] = useState<string>(() =>
    getAssetUrl(category, assetKey, preferFallback)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFallback, setIsFallback] = useState(preferFallback);
  const [retryCount, setRetryCount] = useState(0);

  const loadAsset = useCallback(async () => {
    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      const assetUrl = getAssetUrl(category, assetKey, false);

      // For images, test if they load
      if (category === "images") {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () =>
            reject(new Error(`Failed to load image: ${assetKey}`));
          img.src = assetUrl;
        });
      }

      // For videos, just set the URL (browser will handle loading)
      setUrl(assetUrl);
      setIsFallback(false);

      const loadTime = performance.now() - startTime;
      recordAssetMetric({
        category,
        assetKey,
        url: assetUrl,
        loadTime,
        success: true,
        fallbackUsed: false,
      });

      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      // Use fallback URL
      const fallbackUrl = handleAssetLoadError(category, assetKey, error);
      setUrl(fallbackUrl);
      setIsFallback(true);

      const loadTime = performance.now() - startTime;
      recordAssetMetric({
        category,
        assetKey,
        url: fallbackUrl,
        loadTime,
        success: false,
        fallbackUsed: true,
      });

      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [category, assetKey, onError, onSuccess]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  const retry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount((prev) => prev + 1);
      loadAsset();
    }
  }, [retryCount, loadAsset]);

  return {
    url,
    isLoading,
    error,
    isFallback,
    retry,
  };
}

/**
 * Hook to preload multiple assets
 */
export function usePreloadAssets(
  assets: Array<{ category: "images" | "tutorials"; assetKey: string }>
): { isLoading: boolean; errors: Map<string, Error> } {
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  useEffect(() => {
    const preloadPromises = assets.map(({ category, assetKey }) => {
      const url = getAssetUrl(category, assetKey, false);

      if (category === "images") {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => {
            setErrors((prev) =>
              new Map(prev).set(`${category}.${assetKey}`, new Error("Failed to load"))
            );
            resolve(); // Don't block on error
          };
          img.src = url;
        });
      }

      return Promise.resolve(); // Videos don't need preloading
    });

    Promise.all(preloadPromises).then(() => setIsLoading(false));
  }, [assets]);

  return { isLoading, errors };
}
