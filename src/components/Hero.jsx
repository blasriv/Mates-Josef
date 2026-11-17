import { useEffect, useMemo, useRef } from 'react';
import campo from '../assets/campo-bsas.jpg';

// Números "al azar" pero fijos: el pasto no cambia en cada render.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Grass({ seed, count, color, minH, maxH, className }) {
  const blades = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => {
      const x = (i / count) * 1200 + rnd() * (1200 / count);
      return {
        x,
        h: minH + rnd() * (maxH - minH),
        w: 3 + rnd() * 4,
        lean: (rnd() - 0.5) * 16,
        delay: -rnd() * 5,
        dur: 2.6 + rnd() * 2.2,
      };
    });
  }, [seed, count, minH, maxH]);

  return (
    <svg
      className={`hero-grass ${className}`}
      viewBox="0 0 1200 90"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <rect x="0" y="84" width="1200" height="6" fill={color} />
      {blades.map((b, i) => (
        <path
          key={i}
          className="blade"
          d={`M${b.x - b.w} 90 Q${b.x} ${90 - b.h * 0.6} ${b.x + b.lean} ${90 - b.h} Q${b.x + b.w * 0.3} ${90 - b.h * 0.5} ${b.x + b.w} 90 Z`}
          fill={color}
          style={{ animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }}
        />
      ))}
    </svg>
  );
}

function Wheel({ cx, cy, r, spinClass }) {
  const lugs = Math.round(r * 0.62);
  const ring = 2 * Math.PI * (r * 0.93);
  const dash = ring / lugs / 2;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g className={`tractor-wheel ${spinClass}`}>
        <circle r={r} fill="#1c1917" />
        <circle
          r={r * 0.93}
          fill="none"
          stroke="#57534e"
          strokeWidth={r * 0.14}
          strokeDasharray={`${dash} ${dash}`}
        />
        <circle r={r * 0.58} fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="0"
            x2="0"
            y2={-r * 0.55}
            stroke="#92400e"
            strokeWidth={Math.max(2, r * 0.07)}
            strokeLinecap="round"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r={r * 0.17} fill="#292524" />
        <circle r={r * 0.07} fill="#d6d3d1" />
      </g>
    </g>
  );
}

function Tractor() {
  return (
    <svg
      viewBox="0 -14 260 174"
      className="hero-tractor-svg"
      role="img"
      aria-label="Tractor clásico circulando por el campo"
    >
      <ellipse cx="135" cy="152" rx="112" ry="5" fill="rgba(0,0,0,.35)" />

      {/* polvo que levanta atrás */}
      <g fill="#d6b98c">
        {[0, 0.5, 1, 1.5].map((d) => (
          <circle key={d} className="dust" cx="30" cy="142" r="9" style={{ animationDelay: `${d}s` }} />
        ))}
      </g>

      <g className="tractor-bob">
        {/* escape + humo */}
        <rect x="174" y="34" width="7" height="40" rx="2" fill="#44403c" />
        <rect x="171" y="30" width="13" height="6" rx="2" fill="#292524" />
        <g fill="#e7e5e4">
          {[0, 0.8, 1.6].map((d) => (
            <circle key={d} className="smoke" cx="177" cy="24" r="5" style={{ animationDelay: `${d}s` }} />
          ))}
        </g>

        {/* chasis y capot */}
        <path d="M58 82 H128 L134 112 H54 Z" fill="#b91c1c" />
        <path d="M112 68 H206 Q224 68 226 84 L228 110 H112 Z" fill="#dc2626" />
        <rect x="118" y="76" width="104" height="5" rx="2" fill="#fca5a5" opacity=".7" />
        <rect x="224" y="76" width="8" height="32" rx="2" fill="#292524" />
        {[82, 88, 94, 100].map((y) => (
          <line key={y} x1="225" y1={y} x2="231" y2={y} stroke="#78716c" strokeWidth="1.5" />
        ))}
        <circle cx="229" cy="72" r="5" fill="#fde047" />
        <circle cx="229" cy="72" r="9" fill="#fde047" opacity=".25" />
        <rect x="190" y="108" width="16" height="14" fill="#44403c" />

        {/* ruedas */}
        <Wheel cx={198} cy={126} r={24} spinClass="spin-front" />
        <Wheel cx={78} cy={104} r={46} spinClass="spin-rear" />

        {/* guardabarros */}
        <path
          d="M26 104 A52 52 0 0 1 130 104 L122 104 A44 44 0 0 0 34 104 Z"
          fill="#991b1b"
        />

        {/* conductor */}
        <rect x="60" y="30" width="6" height="18" rx="3" fill="#292524" />
        <rect x="62" y="46" width="28" height="6" rx="3" fill="#292524" />
        <line x1="72" y1="46" x2="98" y2="56" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />
        <path d="M66 46 L67 28 Q76 24 83 30 L86 46 Z" fill="#2563eb" />
        <line x1="81" y1="33" x2="103" y2="40" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
        <circle cx="75" cy="19" r="7" fill="#e8b98a" />
        <ellipse cx="75" cy="14" rx="13" ry="3" fill="#d4a24c" />
        <path d="M67 14 Q75 2 83 14 Z" fill="#e0b45a" />
        <line x1="67" y1="12" x2="83" y2="12" stroke="#7c2d12" strokeWidth="1.6" />
        <line x1="106" y1="43" x2="112" y2="68" stroke="#1c1917" strokeWidth="3" />
        <ellipse
          cx="106"
          cy="40"
          rx="9"
          ry="3"
          fill="none"
          stroke="#1c1917"
          strokeWidth="2.5"
          transform="rotate(-35 106 40)"
        />
      </g>
    </svg>
  );
}

const CLOUDS = [
  { top: '7%', width: '19%', dur: 95, delay: -25, opacity: 0.55 },
  { top: '17%', width: '12%', dur: 135, delay: -80, opacity: 0.4 },
  { top: '27%', width: '9%', dur: 175, delay: -130, opacity: 0.3 },
];

const BLADES = Array.from({ length: 18 }, (_, i) => i * 20);

export default function Hero({ cartCount = 0, onCartClick }) {
  const heroRef = useRef(null);
  const layerRef = useRef(null);

  // Parallax suave de la foto al hacer scroll
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const hero = heroRef.current;
      const layer = layerRef.current;
      if (!hero || !layer) return;
      const s = Math.min(window.scrollY, hero.offsetHeight);
      layer.style.transform = `translate3d(0, ${s * 0.12}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const goToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={heroRef} className="hero">
      {/* Foto + molino con aspas giratorias (alineadas con la foto) */}
      <div ref={layerRef} className="hero-layer" aria-hidden="true">
        <div className="hero-stage">
          <img src={campo} alt="" className="hero-photo" />
          <div className="hero-mill">
            <svg viewBox="0 0 100 100" className="mill-spin">
              <defs>
                <radialGradient id="millSky">
                  <stop offset="0%" stopColor="#dedbd8" stopOpacity="1" />
                  <stop offset="78%" stopColor="#dedbd8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#dedbd8" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="50" fill="url(#millSky)" />
              {BLADES.map((deg) => (
                <path
                  key={deg}
                  d="M47.6 36 L52.4 36 L53.6 6 L46.4 6 Z"
                  fill="#161616"
                  transform={`rotate(${deg} 50 50)`}
                />
              ))}
              <circle cx="50" cy="50" r="7" fill="#262626" />
              <circle cx="50" cy="50" r="2.5" fill="#d6d3d1" />
            </svg>
          </div>
        </div>
      </div>

      <div className="hero-sun" aria-hidden="true" />

      {CLOUDS.map((c, i) => (
        <svg
          key={i}
          viewBox="0 0 200 70"
          className="hero-cloud"
          aria-hidden="true"
          style={{
            top: c.top,
            width: c.width,
            opacity: c.opacity,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          <path
            d="M30 62 Q8 62 12 44 Q15 30 35 32 Q39 12 63 14 Q77 2 97 14 Q123 4 135 24 Q165 20 169 42 Q187 46 183 58 Q181 63 171 63 Z"
            fill="#ffffff"
          />
        </svg>
      ))}

      <div className="hero-shade" aria-hidden="true" />

      <Grass seed={7} count={70} color="#3f4a1d" minH={26} maxH={52} className="grass-back" />

      <div className="hero-tractor" aria-hidden="false">
        <Tractor />
      </div>

      <Grass seed={21} count={90} color="#1c2410" minH={20} maxH={44} className="grass-front" />

      <div className="hero-content">
        <p className="hero-kicker fade-up" style={{ animationDelay: '0.1s' }}>
          Balcarce · Buenos Aires
        </p>
        <h1 className="hero-title fade-up" style={{ animationDelay: '0.25s' }}>
          Regener<span>AR</span>
        </h1>
        <p className="hero-sub fade-up" style={{ animationDelay: '0.45s' }}>
          Insumos agrícolas pesados de Balcarce a tu campo
        </p>
        <button type="button" onClick={goToCatalog} className="hero-cta fade-up" style={{ animationDelay: '0.65s' }}>
          Ver catálogo <span className="hero-cta-arrow">↓</span>
        </button>
      </div>

      <button type="button" onClick={onCartClick} className="hero-cart" aria-label="Ver carrito">
        🛒
        {cartCount > 0 && <span className="hero-cart-badge">{cartCount}</span>}
      </button>
    </section>
  );
}
