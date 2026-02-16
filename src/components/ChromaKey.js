/**
 * ChromaKey.js — Green screen (chroma key) compositing tool.
 * Uses Canvas 2D pixel manipulation for real-time preview.
 */

export function ChromaKey({ onApply }) {
    let keyColor = { r: 0, g: 255, b: 0 };
    let tolerance = 40;
    let edgeSoftness = 5;
    let spillSuppression = 50;
    let isEnabled = false;

    const root = document.createElement('div');
    root.className = 'vfx-panel chroma-key-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'vfx-panel-header';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-[12px]">🟩</span>
            <span class="text-[10px] font-black text-white/60 uppercase tracking-[0.15em]">Chroma Key</span>
        </div>
    `;

    const enableToggle = document.createElement('button');
    enableToggle.className = 'vfx-enable-toggle';
    enableToggle.textContent = isEnabled ? 'ON' : 'OFF';
    enableToggle.onclick = () => {
        isEnabled = !isEnabled;
        enableToggle.textContent = isEnabled ? 'ON' : 'OFF';
        enableToggle.classList.toggle('active', isEnabled);
        if (onApply) onApply(getSettings());
    };
    header.appendChild(enableToggle);
    root.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'vfx-panel-content';

    // Color Picker
    const colorSection = document.createElement('div');
    colorSection.className = 'vfx-control-group';

    const colorLabel = document.createElement('label');
    colorLabel.className = 'vfx-label';
    colorLabel.textContent = 'Key Color';
    colorSection.appendChild(colorLabel);

    const colorRow = document.createElement('div');
    colorRow.className = 'flex items-center gap-2';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#00ff00';
    colorInput.className = 'vfx-color-picker';
    colorInput.oninput = () => {
        const hex = colorInput.value;
        keyColor = hexToRgb(hex);
        colorPreview.style.backgroundColor = hex;
        if (isEnabled && onApply) onApply(getSettings());
    };
    colorRow.appendChild(colorInput);

    const colorPreview = document.createElement('div');
    colorPreview.className = 'vfx-color-preview';
    colorPreview.style.backgroundColor = '#00ff00';
    colorRow.appendChild(colorPreview);

    const colorHex = document.createElement('span');
    colorHex.className = 'text-[9px] font-mono text-white/40';
    colorHex.textContent = '#00FF00';
    colorInput.addEventListener('input', () => {
        colorHex.textContent = colorInput.value.toUpperCase();
    });
    colorRow.appendChild(colorHex);

    // Preset colors
    const presetColors = ['#00FF00', '#00CC00', '#0000FF', '#FF00FF'];
    presetColors.forEach(c => {
        const preset = document.createElement('button');
        preset.className = 'vfx-color-preset';
        preset.style.backgroundColor = c;
        preset.onclick = () => {
            colorInput.value = c;
            keyColor = hexToRgb(c);
            colorPreview.style.backgroundColor = c;
            colorHex.textContent = c;
            if (isEnabled && onApply) onApply(getSettings());
        };
        colorRow.appendChild(preset);
    });

    colorSection.appendChild(colorRow);
    content.appendChild(colorSection);

    // Sliders
    const sliders = [
        { key: 'tolerance', label: 'Tolerance', min: 0, max: 100, value: tolerance, unit: '%' },
        { key: 'edgeSoftness', label: 'Edge Softness', min: 0, max: 30, value: edgeSoftness, unit: 'px' },
        { key: 'spillSuppression', label: 'Spill Suppression', min: 0, max: 100, value: spillSuppression, unit: '%' }
    ];

    sliders.forEach(s => {
        const group = createSliderControl(s, (val) => {
            if (s.key === 'tolerance') tolerance = val;
            else if (s.key === 'edgeSoftness') edgeSoftness = val;
            else if (s.key === 'spillSuppression') spillSuppression = val;
            if (isEnabled && onApply) onApply(getSettings());
        });
        content.appendChild(group);
    });

    root.appendChild(content);

    // ==========================================
    // PROCESSING (Canvas pixel manipulation)
    // ==========================================
    function processFrame(sourceCanvas, destCanvas) {
        if (!isEnabled) return;

        const ctx = sourceCanvas.getContext('2d');
        const destCtx = destCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const dist = colorDistance(r, g, b, keyColor.r, keyColor.g, keyColor.b);

            if (dist < tolerance) {
                // Fully transparent
                data[i + 3] = 0;
            } else if (dist < tolerance + edgeSoftness) {
                // Soft edge
                const alpha = ((dist - tolerance) / edgeSoftness) * 255;
                data[i + 3] = Math.min(255, alpha);

                // Spill suppression
                if (spillSuppression > 0) {
                    const factor = spillSuppression / 100;
                    data[i + 1] = Math.max(0, g - (g - Math.max(r, b)) * factor);
                }
            }
        }

        destCtx.putImageData(imageData, 0, 0);
    }

    function colorDistance(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 255, b: 0 };
    }

    function getSettings() {
        return { isEnabled, keyColor, tolerance, edgeSoftness, spillSuppression };
    }

    // ==========================================
    // HELPERS
    // ==========================================
    function createSliderControl({ key, label, min, max, value, unit }, onChange) {
        const group = document.createElement('div');
        group.className = 'vfx-control-group';

        const row = document.createElement('div');
        row.className = 'vfx-label-row';
        row.innerHTML = `
            <label class="vfx-label">${label}</label>
            <span class="vfx-value">${value}${unit}</span>
        `;
        group.appendChild(row);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = value;
        slider.className = 'vfx-slider';
        slider.oninput = () => {
            const val = parseInt(slider.value);
            row.querySelector('.vfx-value').textContent = val + unit;
            onChange(val);
        };
        group.appendChild(slider);

        return group;
    }

    // Public API
    root.processFrame = processFrame;
    root.getSettings = getSettings;

    return root;
}
