// Variables globales
let selectedColors = ["#FF3B30", "#FF9500", "#FFCC02", "#34C759", "#007AFF"];
let currentColor = '#FF3B30';
let currentTool = 'fill';
let mandalaData = {};
let userPainting = {};

// Selección de colores
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        selectedColors = JSON.parse(this.dataset.colors);
        currentColor = selectedColors[0];
    });
});

// Crear mandala
async function createMandala() {
    const word = document.getElementById('word-input').value.trim();
    if (!word) {
        alert('Por favor, escribe una palabra para crear tu mandala');
        return;
    }

    const createBtn = document.querySelector('.create-btn');
    createBtn.textContent = 'Generando...';
    createBtn.disabled = true;

    const response = await fetch('/api/generar-mandala', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: word, colors: selectedColors }),
    });

    mandalaData = await response.json();

    createBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> Crear mi Mandala';
    createBtn.disabled = false;
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('paint-screen').style.display = 'block';
    
    createMandalaDisplay();
    createPaintInterface();
}

// Crear display del mandala
function createMandalaDisplay() {
    const container = document.getElementById('original-mandala');
    let svg = `<svg width="100%" height="100%" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="100%" height="100%" fill="#FEFEFE"/>`;
    
    mandalaData.paths.forEach(path => {
        const color = mandalaData.colors[path.id];
        // Añadimos el atributo transform para las rotaciones
        svg += `<path id="${path.id}" d="${path.d}" transform="${path.transform || ''}" fill="${color}" stroke="none" opacity="0.9"/>`;
    });

    svg += '</svg>';
    container.innerHTML = svg;
}

// --- LÓGICA DE PINTURA (MODIFICADA PARA EL ZOOM) ---

// Reemplazamos la función paintShape por la lógica del zoom
function createPaintInterface() {
    const container = document.getElementById('paint-mandala');
    let svgContent = `<svg width="100%" height="100%" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">`;
    svgContent += `<rect width="100%" height="100%" fill="white"/>`;

    mandalaData.paths.forEach(path => {
        // El onclick ahora llama a la función para abrir el zoom
        svgContent += `<path id="${path.id}" d="${path.d}" transform="${path.transform || ''}" fill="white" stroke="#333" stroke-width="0.5" opacity="1" style="cursor: pointer;" onclick="openZoom('${path.id}', this.ownerSVGElement)"/>`;
    });

    svgContent += '</svg>';
    container.innerHTML = svgContent;
    createPaintPalette();
}

const zoomContainer = document.getElementById('zoom-container');
const zoomMandalaContainer = document.getElementById('zoom-mandala');

function openZoom(shapeId, originalSvg) {
    const shapeElement = originalSvg.getElementById(shapeId);
    if (!shapeElement) return;

    // Calculamos la vista para centrar la forma que se ha tocado
    const bbox = shapeElement.getBBox();
    const viewBox = `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`;

    // Clonamos el SVG para no perder los colores ya pintados
    const clonedSvg = originalSvg.cloneNode(true);
    clonedSvg.setAttribute('viewBox', viewBox);

    // Hacemos que todas las formas sean "clickables" dentro del zoom
    clonedSvg.querySelectorAll('path').forEach(path => {
        path.onclick = () => applyColorAndClose(path.id);
    });

    zoomMandalaContainer.innerHTML = '';
    zoomMandalaContainer.appendChild(clonedSvg);
    zoomContainer.style.display = 'flex';
}

function applyColorAndClose(shapeId) {
    const originalSvg = document.getElementById('paint-mandala').querySelector('svg');
    const shapeToPaint = originalSvg.getElementById(shapeId);

    if (currentTool === 'fill') {
        shapeToPaint.setAttribute('fill', currentColor);
        userPainting[shapeId] = currentColor;
    } else if (currentTool === 'erase') {
        shapeToPaint.setAttribute('fill', 'white');
        delete userPainting[shapeId];
    }
    
    closeZoom();
}

function closeZoom() {
    zoomContainer.style.display = 'none';
}

zoomContainer.addEventListener('click', (event) => {
    if (event.target === zoomContainer) {
        closeZoom();
    }
});


// --- RESTO DE FUNCIONES (SIN CAMBIOS) ---

function createPaintPalette() {
    const container = document.getElementById('paint-colors');
    container.innerHTML = '';
    const allColors = ['#FF3B30', '#FF9500', '#FFCC02', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D92', '#00C7BE', '#30D158'];
    allColors.forEach((color, index) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'paint-color' + (index === 0 ? ' active' : '');
        colorDiv.style.backgroundColor = color;
        colorDiv.addEventListener('click', function() {
            document.querySelectorAll('.paint-color').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentColor = color;
        });
        container.appendChild(colorDiv);
    });
}

document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTool = this.dataset.tool;
    });
});

function finishPainting() {
    const score = calculateScore();
    document.getElementById('paint-screen').style.display = 'none';
    document.getElementById('results-screen').style.display = 'block';
    document.getElementById('final-score').textContent = score + '%';
    document.getElementById('comparison-original').innerHTML = document.getElementById('original-mandala').innerHTML;
    document.getElementById('comparison-painted').innerHTML = document.getElementById('paint-mandala').innerHTML;
    createConfetti();
}

function calculateScore() {
    let correct = 0;
    let total = mandalaData.paths.length;
    mandalaData.paths.forEach(path => {
        const userColor = userPainting[path.id];
        const originalColor = mandalaData.colors[path.id];
        if (userColor === originalColor) {
            correct++;
        }
    });
    return Math.round((correct / total) * 100);
}

function createConfetti() {
    const colors = selectedColors;
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '1000';
            confetti.style.animation = 'fall 3s linear forwards';
            document.body.appendChild(confetti);
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 100);
    }
}

function downloadImage() {
    const container = document.getElementById('comparison-painted');
    const svg = container.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    canvas.width = 300;
    canvas.height = 300;
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = 'mi-mandala-vicente.png';
        link.href = canvas.toDataURL();
        link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function restart() {
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
    document.getElementById('word-input').value = '';
    userPainting = {};
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
        }
    }
`;
document.head.appendChild(style);