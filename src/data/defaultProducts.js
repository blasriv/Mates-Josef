// Fuente única del catálogo inicial. Tanto Home.jsx como Admin.jsx importan
// de acá para no volver a tener dos "verdades" distintas sobre productos
// y categorías (eso fue lo que rompió la sincronización la última vez).

export const DEFAULT_CATEGORIES = [
  'Semillas Certificadas',
  'Bioestimulantes',
  'Discos de Arado',
  'Insumos Pesados',
];

export const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Semilla Maíz Híbrido DK7210 - Bolsa 80.000 sem',
    category: 'Semillas Certificadas',
    description: 'Híbrido de ciclo intermedio-tardío (FAO 700). Excelente comportamiento en sequía. Potencial de rendimiento: 14-16 tn/ha.',
    price: 165000,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?fm=jpg&q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 2,
    name: 'Semilla Girasol Alto Oleico N45 - Bolsa 150.000 sem',
    category: 'Semillas Certificadas',
    description: 'Variedad de alto rendimiento en ambientes de media y alta productividad. Tolerancia a Downy Mildew y esclerotinia. Rinde 2.8-3.2 tn/ha.',
    price: 140000,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1542456447-0d5071168f86?fm=jpg&q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 3,
    name: 'Bioestimulante Foliar Orgánico Pro-Grow 5L',
    category: 'Bioestimulantes',
    description: 'Extractos de algas marinas + aminoácidos libres. Mejora resistencia al estrés hídrico y térmico. Certificado orgánico.',
    price: 7800,
    stock: 100,
    image: 'https://images.unsplash.com/photo-1596700072557-0ceb68a4d46b?fm=jpg&q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 4,
    name: 'Bioestimulante Microbiano a Base de Rizobacterias 1L',
    category: 'Bioestimulantes',
    description: 'Inoculante líquido que favorece la fijación de nitrógeno y el desarrollo radicular. Ideal para soja y leguminosas.',
    price: 9500,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?fm=jpg&q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 5,
    name: 'Discos de Arado Cóncavos 24" Premium',
    category: 'Discos de Arado',
    description: 'Discos de acero templado con aleación especial. Resistencia superior para suelos duros y pedregosos. Vida útil extendida.',
    price: 85000,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?fm=jpg&q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 6,
    name: 'Discos de Arado Rastra Doble Acción 20"',
    category: 'Discos de Arado',
    description: 'Set de discos para rastra de doble acción. Corte parejo en rastrojo pesado. Ideal para labranza secundaria.',
    price: 78000,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?fm=jpg&q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 7,
    name: 'Kit de Riego por Goteo Automatizado para Cultivos Extensivos',
    category: 'Insumos Pesados',
    description: 'Sistema modular con sensores de humedad y programador WiFi. Incluye 500m de tubería y 200 goteros. Ahorro del 60% de agua.',
    price: 240000,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1523348833917-744036732389?fm=jpg&q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 8,
    name: 'Tractor Agrícola de Última Generación X800 - 300HP',
    category: 'Insumos Pesados',
    description: 'Motor diésel de 300HP. Transmisión PowerShift 16x16. Cabina de lujo con climatizador. GPS integrado y piloto automático.',
    price: 35000000,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1582210797379-373809051052?fm=jpg&q=80&w=600&auto=format&fit=crop',
  },
];