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

// GENERADOR MEJORADO DE MANDALAS SIMÉTRICOS
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
        const numSlices = 6 + Math.floor(this.rng.random() * 7); // Entre 6 y 12 gajos
        const numLayers = 3 + Math.floor(this.rng.random() * 3); // Entre 3 y 5 capas

        for (let layer = 0; layer < numLayers; layer++) {
            this.generateSymmetricalLayer(layer, numLayers, numSlices);
        }

        return { paths: this.paths, colors: this.pathColors };
    }

    generateSymmetricalLayer(layerIndex, totalLayers, numSlices) {
        const anglePerSlice = 360 / numSlices;
        const shapesPerSlice = 1 + Math.floor(this.rng.random() * 2); // 1 o 2 tipos de forma por capa
        const layerColor = this.colors[layerIndex % this.colors.length]; // Usamos un color por capa para más orden

        for (let shapeIndex = 0; shapeIndex < shapesPerSlice; shapeIndex++) {
            const baseShapePath = this.generateBaseShape(layerIndex, shapeIndex, anglePerSlice);
            
            for (let i = 0; i < numSlices; i++) {
                const rotation = i * anglePerSlice;
                const pathId = `path-${layerIndex}-${shapeIndex}-${i}`;

                this.paths.push({
                    id: pathId,
                    d: baseShapePath,
                    transform: `rotate(${rotation}, ${this.center}, ${this.center})`
                });
                // Hacemos que formas alternas dentro de una capa tengan un color ligeramente distinto para más variedad
                const finalColor = (i % 2 === 0) ? layerColor : this.colors[(layerIndex + 1) % this.colors.length];
                this.pathColors[pathId] = finalColor;
            }
        }
    }

    generateBaseShape(layerIndex, shapeIndex, angle) {
        const minRadius = 25 + layerIndex * 30;
        const maxRadius = minRadius + 20;
        
        const r1 = minRadius + this.rng.random() * (maxRadius - minRadius);
        const r2 = minRadius + this.rng.random() * (maxRadius - minRadius);

        const angleRad = angle * Math.PI / 180;
        const halfAngleRad = angleRad / 2;
        
        // Puntos de la forma
        const p1x = this.center + Math.cos(0) * r1;
        const p1y = this.center + Math.sin(0) * r1;
        const p2x = this.center + Math.cos(angleRad) * r1;
        const p2y = this.center + Math.sin(angleRad) * r1;

        // Puntos de control para curvas más interesantes
        const cp1x = this.center + Math.cos(halfAngleRad) * (r2 + shapeIndex * 10);
        const cp1y = this.center + Math.sin(halfAngleRad) * (r2 + shapeIndex * 10);
        
        return `M ${this.center},${this.center} L ${p1x},${p1y} Q ${cp1x},${cp1y} ${p2x},${p2y} Z`;
    }
}

// Función handler de Vercel (sin cambios)
export default function handler(request, response) {
  const { word, colors } = request.body;
  if (!word || !colors) {
    return response.status(400).json({ error: 'Falta la palabra o los colores' });
  }
  const generator = new MandalaGenerator(word, colors);
  const mandalaData = generator.generate();
  response.status(200).json(mandalaData);
}
