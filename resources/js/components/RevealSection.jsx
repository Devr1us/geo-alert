import React, { useRef, useState, useEffect } from 'react';

/**
 * Reusable RevealSection component with bi-directional IntersectionObserver trigger
 * and support for custom animation variants (e.g., 'glow-in', 'zoom-in', 'fade-up').
 */
export default function RevealSection({ children, className = '', id = '', animation = '', style = {}, once = false }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [once]);

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
