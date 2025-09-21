// Clase para generar números aleatorios a partir de una palabra (la semilla)
class SeededRandom {
    constructor(seed) { this.setSeed(seed); }
    setSeed(seed) {
        if (typeof seed === 'string') { this.seed = this.hashString(seed); } 
        else { this.seed = seed; }
        this.current = this.seed;
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    random() {
        this.current = (this.current * 1664525 + 1013904223) % Math.pow(2, 32);
        return this.current / Math.pow(2, 32);
    }
}

// NUEVO GENERADOR DE MANDALAS SIMÉTRICOS
class MandalaGenerator {
    constructor(seed, colors) {
        this.seed = seed;
        this.colors = colors;
        this.rng = new SeededRandom(seed);
        this.svgSize = 300;
        this.center = this.svgSize / 2;
        this.paths = [];
        this.pathColors = {};
    }

    generate() {
        // Número de "gajos" o repeticiones. Entre 6 y 10 para un buen balance.
        const numSlices = 6 + Math.floor(this.rng.random() * 5);
        // Número de capas de formas, de dentro hacia afuera.
        const numLayers = 2 + Math.floor(this.rng.random() * 3);

        for (let layer = 0; layer < numLayers; layer++) {
            this.generateSymmetricalLayer(layer, numLayers, numSlices);
        }

        return { paths: this.paths, colors: this.pathColors };
    }
    
    // Genera una capa de formas simétricas
    generateSymmetricalLayer(layerIndex, totalLayers, numSlices) {
        const anglePerSlice = 360 / numSlices;

        // Generamos una o dos formas base para la "porción de pizza"
        const shapesPerSlice = 1 + Math.floor(this.rng.random() * 2);
        for (let shapeIndex = 0; shapeIndex < shapesPerSlice; shapeIndex++) {
            
            const baseShapePath = this.generateBaseShape(layerIndex, totalLayers, anglePerSlice);
            const color = this.colors[Math.floor(this.rng.random() * this.colors.length)];

            // Repetimos la forma base en cada "gajo"
            for (let i = 0; i < numSlices; i++) {
                const rotation = i * anglePerSlice;
                const pathId = `path-${layerIndex}-${shapeIndex}-${i}`;

                this.paths.push({
                    id: pathId,
                    d: baseShapePath,
                    transform: `rotate(${rotation}, ${this.center}, ${this.center})`
                });
                this.pathColors[pathId] = color;
            }
        }
    }

    // Genera la forma para una sola "porción"
    generateBaseShape(layerIndex, totalLayers, angle) {
        // Calculamos el radio para que las formas sean grandes y no se solapen mucho
        const baseRadius = 40 + layerIndex * 35;
        const randomFactor = 10 + this.rng.random() * 20;

        // Puntos de la curva de Bezier para crear formas orgánicas
        const p1x = this.center + Math.cos(0) * baseRadius;
        const p1y = this.center + Math.sin(0) * baseRadius;

        const p2x = this.center + Math.cos(this.rng.random() * angle * Math.PI / 180) * (baseRadius + randomFactor);
        const p2y = this.center + Math.sin(this.rng.random() * angle * Math.PI / 180) * (baseRadius + randomFactor);
        
        const p3x = this.center + Math.cos(angle * Math.PI / 180) * baseRadius;
        const p3y = this.center + Math.sin(angle * Math.PI / 180) * baseRadius;

        // Punto de control para la curva
        const cp1x = this.center + Math.cos(angle / 2 * Math.PI / 180) * (baseRadius + 20 + this.rng.random() * 30);
        const cp1y = this.center + Math.sin(angle / 2 * Math.PI / 180) * (baseRadius + 20 + this.rng.random() * 30);
        
        // Unimos los puntos con una curva suave y cerramos la forma en el centro
        return `M ${this.center},${this.center} L ${p1x},${p1y} Q ${cp1x},${cp1y} ${p3x},${p3y} Z`;
    }
}


// Esta es la función mágica que Vercel ejecutará
export default function handler(request, response) {
  const { word, colors } = request.body;

  if (!word || !colors) {
    return response.status(400).json({ error: 'Falta la palabra o los colores' });
  }

  const generator = new MandalaGenerator(word, colors);
  const mandalaData = generator.generate();
  
  response.status(200).json(mandalaData);
}