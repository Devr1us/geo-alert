import React, { useRef, useState, useEffect } from 'react';

/**
 * Reusable RevealSection component with bi-directional IntersectionObserver trigger
 * and support for custom animation variants ('fade-up', 'fade-in', 'zoom-in', 'slide-left', 'slide-right', 'glow-in')
 * and stagger delay (e.g., delay={80}).
 */
export default function RevealSection({
  children,
  className = '',
  id = '',
  animation = '',
  delay = 0,
  style = {},
  as: Component = 'div',
  ...props
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Toggle keadaan tampil/sembunyi saat elemen masuk/keluar viewport di kedua arah
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -15px 0px'
      }
    );

    const el = ref.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, []);

  const animClass = animation ? `reveal-${animation}` : '';
  const delayStyle = delay > 0 ? { transitionDelay: `${delay}ms` } : {};
  const combinedStyle = { ...style, ...delayStyle };

  return (
    <Component
      ref={ref}
      id={id}
      style={combinedStyle}
      className={`reveal-on-scroll ${animClass} ${isVisible ? 'is-visible' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
