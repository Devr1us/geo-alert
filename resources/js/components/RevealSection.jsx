import React, { useRef, useState, useEffect } from 'react';

/**
 * Reusable RevealSection component with bi-directional IntersectionObserver trigger
 * and support for custom animation variants (e.g., 'glow-in', 'zoom-in', 'fade-up').
 */
export default function RevealSection({ children, className = '', id = '', animation = '', style = {} }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Re-trigger animation on scroll up / down
          setIsVisible(false);
        }
      },
      { threshold: 0.12 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const animClass = animation ? `reveal-${animation}` : '';

  return (
    <div
      ref={ref}
      id={id}
      style={style}
      className={`reveal-on-scroll ${animClass} ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
