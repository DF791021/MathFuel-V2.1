import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  initGA,
  trackPageView,
  trackEvent as _trackEvent,
  trackCTAClick,
  trackNavClick,
  trackFormStart,
  trackFormComplete,
  trackFormError,
  trackScrollDepth,
  trackTimeOnPage,
  setUserId,
  setUserProperties,
  trackSessionStart,
  trackQuestionAnswered,
  trackSessionComplete,
} from "@/lib/analytics";

export function useAnalytics() {
  const [location] = useLocation();
  const prevLocation = useRef(location);
  const pageEnteredAt = useRef(Date.now());

  // Initialize GA on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (location !== prevLocation.current) {
      // Record time on previous page
      const secondsOnPrevPage = Math.round((Date.now() - pageEnteredAt.current) / 1000);
      if (secondsOnPrevPage > 0) {
        trackTimeOnPage(secondsOnPrevPage, prevLocation.current);
      }

      prevLocation.current = location;
      pageEnteredAt.current = Date.now();
    }
    trackPageView(location);
  }, [location]);

  // Scroll depth tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    const thresholds = [25, 50, 75, 90];
    const fired = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const t of thresholds) {
        if (percent >= t && !fired.has(t)) {
          fired.add(t);
          trackScrollDepth(t);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]); // reset on route change

  const trackEvent = useCallback(
    (category: string, action: string, label?: string, value?: number) => {
      _trackEvent(category, action, label, value);
    },
    [],
  );

  return {
    trackEvent,
    trackCTAClick,
    trackNavClick,
    trackFormStart,
    trackFormComplete,
    trackFormError,
    trackScrollDepth,
    trackTimeOnPage,
    setUserId,
    setUserProperties,
    trackSessionStart,
    trackQuestionAnswered,
    trackSessionComplete,
  };
}
