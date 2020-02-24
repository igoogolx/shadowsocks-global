import { RefObject, useEffect } from "react";
import { useIntersectionObserver } from "./index";

export const useInfiniteScroll = ({
  target,
  hasMore,
  onLoadMore,
  options
}: {
  onLoadMore: Function;
  hasMore: boolean;
  target: RefObject<HTMLElement>;
  options?: {
    root?: HTMLElement;
    rootMargin?: string;
    threshold?: number | number[];
  };
}) => {
  const load: IntersectionObserverCallback = entries => {
    entries.forEach(entry => {
      if (entry && entry.isIntersecting) {
        onLoadMore();
      }
    });
  };

  const observer = useIntersectionObserver(target, load, options);

  useEffect(() => {
    if (!hasMore && target.current) {
      observer.current.unobserve(target.current);
    }
  }, [hasMore, observer, target]);
};
