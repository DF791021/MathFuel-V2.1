import { useRef, useCallback } from "react";

interface UseCompositionOptions<T extends HTMLElement> {
  onKeyDown?: (e: React.KeyboardEvent<T>) => void;
  onCompositionStart?: (e: React.CompositionEvent<T>) => void;
  onCompositionEnd?: (e: React.CompositionEvent<T>) => void;
}

export function useComposition<T extends HTMLElement>(options: UseCompositionOptions<T>) {
  const isComposing = useRef(false);

  const onCompositionStart = useCallback(
    (e: React.CompositionEvent<T>) => {
      isComposing.current = true;
      options.onCompositionStart?.(e);
    },
    [options.onCompositionStart]
  );

  const onCompositionEnd = useCallback(
    (e: React.CompositionEvent<T>) => {
      isComposing.current = false;
      options.onCompositionEnd?.(e);
    },
    [options.onCompositionEnd]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<T>) => {
      if (isComposing.current) return;
      options.onKeyDown?.(e);
    },
    [options.onKeyDown]
  );

  return {
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
    isComposing: isComposing.current,
  };
}
