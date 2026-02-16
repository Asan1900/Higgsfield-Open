/**
 * ColorGrading.js — Color correction panel with LUT presets
 * and manual adjustment controls (brightness, contrast, saturation, etc.)
 * Applied via Canvas 2D color matrix transformations.
 */
import { createSlider } from '../ui-kit/index.js';

const LUT_PRESETS = [
    {
        id: 'cinematic', name: 'Cinematic', icon: '🎬',
        matrix: { brightness: 5, contrast: 15, saturation: -10, temperature: -5, tint: 0, r: 1.05, g: 0.98, b: 0.92 }
    },
    {
        id: 'vintage', name: 'Vintage', icon: '📼',
        matrix: { brightness: 10, contrast: -5, saturation: -25, temperature: 15, tint: 5, r: 1.1, g: 1.0, b: 0.85 }
    },
    {
        id: 'film-noir', name: 'Film Noir', icon: '🎞',
        matrix: { brightness: -10, contrast: 30, saturation: -100, temperature: -5, tint: 0, r: 1.0, g: 1.0, b: 1.0 }
    },
    {
        id: 'orange-teal', name: 'Orange & Teal', icon: '🌅',
        matrix: { brightness: 0, contrast: 10, saturation: 15, temperature: -10, tint: -5, r: 1.15, g: 0.95, b: 0.88 }
    },
    {
        id: 'bleach-bypass', name: 'Bleach Bypass', icon: '⚗️',
        matrix: { brightness: 5, contrast: 25, saturation: -40, temperature: 0, tint: 0, r: 1.0, g: 1.0, b: 1.0 }
    },
    {
        id: 'high-contrast', name: 'High Contrast', icon: '◐',
        matrix: { brightness: 0, contrast: 35, saturation: 10, temperature: 0, tint: 0, r: 1.0, g: 1.0, b: 1.0 }
    },
    {
        id: 'desaturated', name: 'Desaturated', icon: '🌫',
        matrix: { brightness: 5, contrast: 5, saturation: -50, temperature: 0, tint: 0, r: 1.0, g: 1.0, b: 1.0 }
    },
    {
        id: 'warm-sunset', name: 'Warm Sunset', icon: '🌇',
        matrix: { brightness: 10, contrast: 5, saturation: 5, temperature: 25, tint: 5, r: 1.15, g: 1.0, b: 0.82 }
    }
];

export function ColorGrading({ onApply }) {
    let activeLut = null;
    let showSplit = false;
    let manual = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0
    };

    const root = document.createElement('div');
    root.className = 'vfx-panel color-grading-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'vfx-panel-header';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-[12px]">🎨</span>
            <span class="text-[10px] font-black text-white/60 uppercase tracking-[0.15em]">Color Grading</span>
        </div>
    `;

    // Before/After toggle
    const splitBtn = document.createElement('button');
    splitBtn.className = 'vfx-enable-toggle';
    splitBtn.textContent = 'A/B';
    splitBtn.title = 'Before/After split view';
    splitBtn.onclick = () => {
        showSplit = !showSplit;
        splitBtn.classList.toggle('active', showSplit);
        emitUpdate();
    };
    header.appendChild(splitBtn);
    root.appendChild(header);

    const content = document.createElement('div');
    content.className = 'vfx-panel-content';

    // ==========================================
    // LUT PRESETS
    // ==========================================
    const lutSection = document.createElement('div');
    lutSection.className = 'vfx-control-group';

    const lutLabel = document.createElement('label');
    lutLabel.className = 'vfx-label';
    lutLabel.textContent = 'LUT Presets';
    lutSection.appendChild(lutLabel);

    const lutGrid = document.createElement('div');
    lutGrid.className = 'lut-grid';

    // None option
    const noneBtn = document.createElement('button');
    noneBtn.className = `lut-preset-btn ${!activeLut ? 'active' : ''}`;
    noneBtn.innerHTML = `
        <div class="lut-preview none">∅</div>
        <span class="text-[8px] text-white/40">None</span>
    `;
    noneBtn.onclick = () => {
        activeLut = null;
        renderLutGrid();
        emitUpdate();
    };
    lutGrid.appendChild(noneBtn);

    LUT_PRESETS.forEach(lut => {
        const btn = document.createElement('button');
        btn.className = `lut-preset-btn ${activeLut === lut.id ? 'active' : ''}`;

        // Create a gradient preview based on the LUT values
        const hue = lut.matrix.temperature > 0 ? '30' : lut.matrix.temperature < 0 ? '200' : '0';
        const sat = Math.abs(lut.matrix.saturation);
        const bg = lut.matrix.saturation === -100
            ? 'linear-gradient(135deg, #666, #222)'
            : `linear-gradient(135deg, hsl(${hue}, ${40 + sat}%, ${40 + lut.matrix.brightness}%), hsl(${parseInt(hue) + 30}, ${30 + sat}%, ${25 + lut.matrix.brightness}%))`;

        btn.innerHTML = `
            <div class="lut-preview" style="background:${bg}">
                <span class="text-[10px]">${lut.icon}</span>
            </div>
            <span class="text-[8px] text-white/40">${lut.name}</span>
        `;
        btn.onclick = () => {
            activeLut = lut.id;
            // Apply LUT values to manual sliders
            const preset = LUT_PRESETS.find(l => l.id === lut.id);
            if (preset) {
                manual = { ...preset.matrix };
                renderSliders();
            }
            renderLutGrid();
            emitUpdate();
        };
        lutGrid.appendChild(btn);
    });
    lutSection.appendChild(lutGrid);
    content.appendChild(lutSection);

    // ==========================================
    // MANUAL CONTROLS
    // ==========================================
    const manualSection = document.createElement('div');
    manualSection.className = 'vfx-control-group';

    const manualLabel = document.createElement('label');
    manualLabel.className = 'vfx-label';
    manualLabel.textContent = 'Manual Adjustments';
    manualSection.appendChild(manualLabel);

    const slidersContainer = document.createElement('div');
    slidersContainer.className = 'cg-sliders';

    const sliderDefs = [
        { key: 'brightness', label: 'Brightness', min: -100, max: 100, icon: '☀' },
        { key: 'contrast', label: 'Contrast', min: -100, max: 100, icon: '◑' },
        { key: 'saturation', label: 'Saturation', min: -100, max: 100, icon: '🎨' },
        { key: 'temperature', label: 'Temperature', min: -100, max: 100, icon: '🌡' },
        { key: 'tint', label: 'Tint', min: -100, max: 100, icon: '💧' }
    ];

    const sliderRefs = {};

    function renderSliders() {
        slidersContainer.innerHTML = '';
        sliderDefs.forEach(def => {
            const slider = createSlider({
                label: def.label,
                icon: def.icon,
                min: def.min,
                max: def.max,
                value: manual[def.key],
                onChange: (v) => {
                    manual[def.key] = v;
                    activeLut = null; // Deselect LUT
                    renderLutGrid();
                    emitUpdate();
                },
                className: 'cg-slider'
            });

            // Add reference for manual updates if needed
            sliderRefs[def.key] = slider;

            slidersContainer.appendChild(slider);
        });
    }
    renderSliders();
    manualSection.appendChild(slidersContainer);

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'vfx-reset-btn';
    resetBtn.textContent = 'Reset All';
    resetBtn.onclick = () => {
        manual = { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0 };
        activeLut = null;
        renderSliders();
        renderLutGrid();
        emitUpdate();
    };
    manualSection.appendChild(resetBtn);

    content.appendChild(manualSection);
    root.appendChild(content);

    // ==========================================
    // RENDERING
    // ==========================================
    function renderLutGrid() {
        lutGrid.querySelectorAll('.lut-preset-btn').forEach((btn, i) => {
            if (i === 0) {
                btn.classList.toggle('active', !activeLut);
            } else {
                btn.classList.toggle('active', LUT_PRESETS[i - 1]?.id === activeLut);
            }
        });
    }

    function emitUpdate() {
        if (onApply) onApply(getSettings());
    }

    function getSettings() {
        return { activeLut, manual: { ...manual }, showSplit };
    }

    // Canvas processing
    function processFrame(sourceCanvas, destCanvas) {
        const ctx = sourceCanvas.getContext('2d');
        const destCtx = destCanvas.getContext('2d');
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const splitX = showSplit ? Math.floor(w / 2) : w;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < splitX; x++) {
                const i = (y * w + x) * 4;

                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Brightness
                r += manual.brightness * 2.55;
                g += manual.brightness * 2.55;
                b += manual.brightness * 2.55;

                // Contrast
                const cf = (259 * (manual.contrast + 255)) / (255 * (259 - manual.contrast));
                r = cf * (r - 128) + 128;
                g = cf * (g - 128) + 128;
                b = cf * (b - 128) + 128;

                // Saturation
                const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
                const sf = 1 + manual.saturation / 100;
                r = gray + sf * (r - gray);
                g = gray + sf * (g - gray);
                b = gray + sf * (b - gray);

                // Temperature (warm/cool shift)
                r += manual.temperature * 1.5;
                b -= manual.temperature * 1.5;

                // Tint (green/magenta)
                g += manual.tint * 1.0;

                // Clamp
                data[i] = Math.max(0, Math.min(255, r));
                data[i + 1] = Math.max(0, Math.min(255, g));
                data[i + 2] = Math.max(0, Math.min(255, b));
            }
        }

        destCtx.putImageData(imageData, 0, 0);

        // Draw split line
        if (showSplit) {
            destCtx.strokeStyle = '#d9ff00';
            destCtx.lineWidth = 2;
            destCtx.setLineDash([4, 4]);
            destCtx.beginPath();
            destCtx.moveTo(splitX, 0);
            destCtx.lineTo(splitX, h);
            destCtx.stroke();
            destCtx.setLineDash([]);

            // Labels
            destCtx.font = 'bold 10px Inter';
            destCtx.fillStyle = '#d9ff00';
            destCtx.fillText('GRADED', 10, h - 10);
            destCtx.fillText('ORIGINAL', splitX + 10, h - 10);
        }
    }

    // Public API
    root.getSettings = getSettings;
    root.processFrame = processFrame;

    return root;
}
