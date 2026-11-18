import { useEffect, useRef, useState } from 'react';

/**
 * Reveal: Revelación suave al hacer scroll anticipando la visibilidad para eliminar saltos bruscos.
 */
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '100px 0px -20px 0px', 
        threshold: 0.05 
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-smooth ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
