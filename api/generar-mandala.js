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

// GENERADOR FINAL DE MANDALAS SIMÉTRICOS CON MÚLTIPLES POLÍGONOS
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
        const numSlices = 6 + Math.floor(this.rng.random() * 5); // Entre 6 y 10 gajos
        const numLayers = 2 + Math.floor(this.rng.random() * 2); // 2 o 3 capas de formas

        for (let layer = 0; layer < numLayers; layer++) {
            this.generateSymmetricalLayer(layer, numLayers, numSlices);
        }

        return { paths: this.paths, colors: this.pathColors };
    }

    generateSymmetricalLayer(layerIndex, totalLayers, numSlices) {
        const anglePerSlice = 360 / numSlices;
        
        // Obtenemos un array de formas base (interior y exterior)
        const baseShapes = this.generateBaseShapes(layerIndex, anglePerSlice);
        
        // Asignamos colores distintos para la parte interior y exterior
        const innerColor = this.colors[layerIndex % this.colors.length];
        const outerColor = this.colors[(layerIndex + 1) % this.colors.length];
        const shapeColors = [innerColor, outerColor];

        // Para cada tipo de forma (interior, exterior), creamos todas sus repeticiones
        baseShapes.forEach((shapeData, shapeIndex) => {
            for (let i = 0; i < numSlices; i++) {
                const rotation = i * anglePerSlice;
                const pathId = `path-${layerIndex}-${shapeIndex}-${i}`;

                this.paths.push({
                    id: pathId,
                    d: shapeData,
                    transform: `rotate(${rotation}, ${this.center}, ${this.center})`
                });
                this.pathColors[pathId] = shapeColors[shapeIndex];
            }
        });
    }

    // ¡NUEVA FUNCIÓN! Ahora genera MÚLTIPLES formas (interior y exterior) para cada pétalo
    generateBaseShapes(layerIndex, angle) {
        const angleRad = angle * Math.PI / 180;
        
        // Definimos dos radios: uno para el borde interior y otro para el exterior
        const innerRadius = 40 + layerIndex * 40;
        const outerRadius = innerRadius + 30 + this.rng.random() * 20;

        // Puntos del borde interior
        const p1_inner = { x: this.center + innerRadius, y: this.center };
        const p2_inner = { 
            x: this.center + Math.cos(angleRad) * innerRadius,
            y: this.center + Math.sin(angleRad) * innerRadius
        };

        // Puntos del borde exterior
        const p1_outer = { x: this.center + outerRadius, y: this.center };
        const p2_outer = { 
            x: this.center + Math.cos(angleRad) * outerRadius,
            y: this.center + Math.sin(angleRad) * outerRadius
        };

        // Puntos de control para las curvas
        const cp_inner = {
            x: this.center + Math.cos(angleRad / 2) * (innerRadius + this.rng.random() * 10),
            y: this.center + Math.sin(angleRad / 2) * (innerRadius + this.rng.random() * 10)
        };
        const cp_outer = {
            x: this.center + Math.cos(angleRad / 2) * (outerRadius - this.rng.random() * 10),
            y: this.center + Math.sin(angleRad / 2) * (outerRadius - this.rng.random() * 10)
        };

        // Creamos los dos polígonos como strings de path SVG
        const pathInterior = `M ${this.center},${this.center} L ${p1_inner.x},${p1_inner.y} Q ${cp_inner.x},${cp_inner.y} ${p2_inner.x},${p2_inner.y} Z`;
        const pathExterior = `M ${p1_inner.x},${p1_inner.y} L ${p1_outer.x},${p1_outer.y} Q ${cp_outer.x},${cp_outer.y} ${p2_outer.x},${p2_outer.y} L ${p2_inner.x},${p2_inner.y} Q ${cp_inner.x},${cp_inner.y} ${p1_inner.x},${p1_inner.y} Z`;
        
        // Devolvemos un array con las dos formas
        return [pathInterior, pathExterior];
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
