import { RefObject, useEffect, useRef } from "react";

export const useIntersectionObserver = (
  target: RefObject<HTMLElement>,
  load: IntersectionObserverCallback,
  options?: {
    root?: HTMLElement;
    rootMargin?: string;
    threshold?: number | number[];
  }
) => {
  const observer = useRef(new IntersectionObserver(load, options));
  const prevTarget = useRef<HTMLElement>();

  useEffect(() => {
    if (target.current && prevTarget.current !== target.current) {
      if (prevTarget.current) observer.current.unobserve(prevTarget.current);
      prevTarget.current = target.current;
      observer.current.observe(target.current);
    }
  });
  return observer;
};
