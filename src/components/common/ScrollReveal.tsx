import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-in' | 'fade';
  delay?: number; // ms
  duration?: number; // ms
  threshold?: number;
  className?: string;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.12,
  className = '',
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion preferences
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [threshold, once]);

  // Initial hidden transform styles
  const getInitialTransform = () => {
    switch (animation) {
      case 'fade-up':
        return 'translate3d(0, 24px, 0)';
      case 'fade-down':
        return 'translate3d(0, -24px, 0)';
      case 'fade-left':
        return 'translate3d(28px, 0, 0)';
      case 'fade-right':
        return 'translate3d(-28px, 0, 0)';
      case 'scale-in':
        return 'scale(0.96) translate3d(0, 16px, 0)';
      case 'fade':
      default:
        return 'none';
    }
  };

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : getInitialTransform(),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={elementRef} style={style} className={className}>
      {children}
    </div>
  );
};
