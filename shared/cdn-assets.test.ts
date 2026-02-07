/**
 * CDN Asset System Tests
 */

import { describe, it, expect } from "vitest";
import {
  CDN_ASSETS,
  getAssetUrl,
  getCacheControl,
  isAssetGated,
  getTutorialVideos,
  getBackgroundImages,
} from "./cdn-assets";

describe("CDN Assets", () => {
  describe("Asset Structure", () => {
    it("should have images category", () => {
      expect(CDN_ASSETS.images).toBeDefined();
      expect(typeof CDN_ASSETS.images).toBe("object");
    });

    it("should have tutorials category", () => {
      expect(CDN_ASSETS.tutorials).toBeDefined();
      expect(typeof CDN_ASSETS.tutorials).toBe("object");
    });

    it("should have wisconsin map background image", () => {
      expect(CDN_ASSETS.images.wisconsinMapBackground).toBeDefined();
      expect(CDN_ASSETS.images.wisconsinMapBackground.url).toContain("https://");
    });

    it("should have corn cob piece image", () => {
      expect(CDN_ASSETS.images.cornCobPiece).toBeDefined();
      expect(CDN_ASSETS.images.cornCobPiece.url).toContain("https://");
    });

    it("should have milk carton piece image", () => {
      expect(CDN_ASSETS.images.milkCartonPiece).toBeDefined();
      expect(CDN_ASSETS.images.milkCartonPiece.url).toContain("https://");
    });
  });

  describe("Tutorial Videos", () => {
    it("should have individual certificates tutorial", () => {
      expect(CDN_ASSETS.tutorials.individualCertificates).toBeDefined();
      expect(CDN_ASSETS.tutorials.individualCertificates.url).toContain(".mp4");
    });

    it("should have bulk certificates tutorial", () => {
      expect(CDN_ASSETS.tutorials.bulkCertificates).toBeDefined();
      expect(CDN_ASSETS.tutorials.bulkCertificates.url).toContain(".mp4");
    });

    it("should have email certificates tutorial", () => {
      expect(CDN_ASSETS.tutorials.emailCertificates).toBeDefined();
      expect(CDN_ASSETS.tutorials.emailCertificates.url).toContain(".mp4");
    });

    it("should have email templates tutorial", () => {
      expect(CDN_ASSETS.tutorials.emailTemplates).toBeDefined();
      expect(CDN_ASSETS.tutorials.emailTemplates.url).toContain(".mp4");
    });

    it("should have 4 total tutorials", () => {
      const tutorials = Object.keys(CDN_ASSETS.tutorials);
      expect(tutorials.length).toBe(4);
    });
  });

  describe("Cache Control Headers", () => {
    it("should have immutable cache control for images", () => {
      const cacheControl = getCacheControl("images", "wisconsinMapBackground");
      expect(cacheControl).toContain("immutable");
      expect(cacheControl).toContain("max-age=31536000");
    });

    it("should have immutable cache control for tutorials", () => {
      const cacheControl = getCacheControl("tutorials", "individualCertificates");
      expect(cacheControl).toContain("immutable");
      expect(cacheControl).toContain("max-age=31536000");
    });

    it("should have public cache control", () => {
      const cacheControl = getCacheControl("images", "wisconsinMapBackground");
      expect(cacheControl).toContain("public");
    });
  });

  describe("Asset URL Functions", () => {
    it("should return CDN URL for images", () => {
      const url = getAssetUrl("images", "wisconsinMapBackground");
      expect(url).toContain("https://files.manuscdn.com");
      expect(url).toContain(".png");
    });

    it("should return CDN URL for tutorials", () => {
      const url = getAssetUrl("tutorials", "individualCertificates");
      expect(url).toContain("https://files.manuscdn.com");
      expect(url).toContain(".mp4");
    });

    it("should return fallback URL when preferFallback is true", () => {
      const url = getAssetUrl("images", "wisconsinMapBackground", true);
      expect(url).toContain("/images/placeholder");
    });

    it("should return placeholder for unknown asset", () => {
      const url = getAssetUrl("images", "unknownAsset" as any);
      expect(url).toContain("placeholder");
    });
  });

  describe("Asset Gating", () => {
    it("should not gate tutorial videos", () => {
      const isGated = isAssetGated("tutorials", "individualCertificates");
      expect(isGated).toBe(false);
    });

    it("should not gate images", () => {
      const isGated = isAssetGated("images", "wisconsinMapBackground");
      expect(isGated).toBe(false);
    });
  });

  describe("Helper Functions", () => {
    it("should return all tutorial videos", () => {
      const tutorials = getTutorialVideos();
      expect(Array.isArray(tutorials)).toBe(true);
      expect(tutorials.length).toBe(4);
      expect(tutorials[0]).toHaveProperty("id");
      expect(tutorials[0]).toHaveProperty("url");
      expect(tutorials[0]).toHaveProperty("title");
    });

    it("should return all background images", () => {
      const images = getBackgroundImages();
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBe(3);
      expect(images[0]).toHaveProperty("id");
      expect(images[0]).toHaveProperty("url");
      expect(images[0]).toHaveProperty("alt");
    });
  });

  describe("Asset Metadata", () => {
    it("should have fallback URLs for all images", () => {
      const images = getBackgroundImages();
      images.forEach((image) => {
        expect(image.fallback).toBeDefined();
        expect(image.fallback).toContain("/images/placeholder");
      });
    });

    it("should have fallback URLs for all tutorials", () => {
      const tutorials = getTutorialVideos();
      tutorials.forEach((tutorial) => {
        expect(tutorial.fallback).toBeDefined();
        expect(tutorial.fallback).toContain("/videos/placeholder");
      });
    });

    it("should have cache control for all images", () => {
      const images = getBackgroundImages();
      images.forEach((image) => {
        expect(image.cacheControl).toBeDefined();
        expect(image.cacheControl).toContain("public");
      });
    });

    it("should have cache control for all tutorials", () => {
      const tutorials = getTutorialVideos();
      tutorials.forEach((tutorial) => {
        expect(tutorial.cacheControl).toBeDefined();
        expect(tutorial.cacheControl).toContain("public");
      });
    });

    it("should have titles for all tutorials", () => {
      const tutorials = getTutorialVideos();
      tutorials.forEach((tutorial) => {
        expect(tutorial.title).toBeDefined();
        expect(tutorial.title.length).toBeGreaterThan(0);
      });
    });

    it("should have alt text for all images", () => {
      const images = getBackgroundImages();
      images.forEach((image) => {
        expect(image.alt).toBeDefined();
        expect(image.alt.length).toBeGreaterThan(0);
      });
    });
  });

  describe("CDN URLs Validity", () => {
    it("should have valid CDN URLs for images", () => {
      const images = getBackgroundImages();
      images.forEach((image) => {
        expect(image.url).toMatch(/^https:\/\/files\.manuscdn\.com\//);
      });
    });

    it("should have valid CDN URLs for tutorials", () => {
      const tutorials = getTutorialVideos();
      tutorials.forEach((tutorial) => {
        expect(tutorial.url).toMatch(/^https:\/\/files\.manuscdn\.com\//);
      });
    });

    it("should have unique CDN URLs", () => {
      const allAssets = [
        ...getBackgroundImages(),
        ...getTutorialVideos(),
      ];
      const urls = allAssets.map((a) => a.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(urls.length);
    });
  });

  describe("Production Readiness", () => {
    it("should have all required assets", () => {
      const images = getBackgroundImages();
      const tutorials = getTutorialVideos();

      expect(images.length).toBeGreaterThan(0);
      expect(tutorials.length).toBeGreaterThan(0);
    });

    it("should have immutable cache headers for all assets", () => {
      const images = getBackgroundImages();
      const tutorials = getTutorialVideos();

      [...images, ...tutorials].forEach((asset) => {
        expect(asset.cacheControl).toContain("immutable");
      });
    });

    it("should have fallback for all assets", () => {
      const images = getBackgroundImages();
      const tutorials = getTutorialVideos();

      [...images, ...tutorials].forEach((asset) => {
        expect(asset.fallback).toBeDefined();
        expect(asset.fallback.length).toBeGreaterThan(0);
      });
    });
  });
});
