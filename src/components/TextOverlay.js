/**
 * TextOverlay.js – Titles & text overlay system for the video timeline.
 * Supports preset templates, font controls, animation presets,
 * and positioning on the preview canvas.
 */

const TITLE_PRESETS = [
    { id: 'lower-third', name: 'Lower Third', x: 10, y: 80, fontSize: 20, fontWeight: 700, align: 'left', bg: true },
    { id: 'center-title', name: 'Center Title', x: 50, y: 50, fontSize: 42, fontWeight: 900, align: 'center', bg: false },
    { id: 'subtitle', name: 'Subtitle', x: 50, y: 90, fontSize: 16, fontWeight: 500, align: 'center', bg: true },
    { id: 'end-credits', name: 'End Credits', x: 50, y: 50, fontSize: 24, fontWeight: 300, align: 'center', bg: false },
    { id: 'caption', name: 'Caption', x: 50, y: 85, fontSize: 14, fontWeight: 600, align: 'center', bg: true },
    { id: 'chapter', name: 'Chapter Title', x: 50, y: 45, fontSize: 32, fontWeight: 800, align: 'center', bg: false }
];

const ANIMATION_PRESETS = [
    { id: 'none', name: 'None', icon: '—' },
    { id: 'fade-in', name: 'Fade In', icon: '◐' },
    { id: 'slide-up', name: 'Slide Up', icon: '↑' },
    { id: 'typewriter', name: 'Typewriter', icon: '⌨' },
    { id: 'scale-in', name: 'Scale In', icon: '⤢' },
    { id: 'blur-in', name: 'Blur In', icon: '◌' }
];

const FONT_FAMILIES = [
    'Inter', 'Roboto Mono', 'Georgia', 'Arial Black', 'Courier New', 'Impact'
];

export function TextOverlay({ onApply, onAddToTimeline }) {
    let activePreset = 'center-title';
    let textContent = 'Your Title Here';
    let fontFamily = 'Inter';
    let fontSize = 42;
    let fontWeight = 900;
    let textColor = '#FFFFFF';
    let bgColor = '#000000';
    let bgOpacity = 60;
    let showBg = false;
    let textAlign = 'center';
    let posX = 50;
    let posY = 50;
    let animation = 'fade-in';
    let duration = 3;

    const root = document.createElement('div');
    root.className = 'vfx-panel text-overlay-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'vfx-panel-header';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-[12px]">✏️</span>
            <span class="text-[10px] font-black text-white/60 uppercase tracking-[0.15em]">Text & Titles</span>
        </div>
    `;
    root.appendChild(header);

    const content = document.createElement('div');
    content.className = 'vfx-panel-content';

    // ==========================================
    // PRESET TEMPLATES
    // ==========================================
    const presetsSection = document.createElement('div');
    presetsSection.className = 'vfx-control-group';

    const presetsLabel = document.createElement('label');
    presetsLabel.className = 'vfx-label';
    presetsLabel.textContent = 'Templates';
    presetsSection.appendChild(presetsLabel);

    const presetsGrid = document.createElement('div');
    presetsGrid.className = 'text-presets-grid';

    TITLE_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = `text-preset-btn ${activePreset === preset.id ? 'active' : ''}`;
        btn.innerHTML = `
            <div class="text-preset-preview">
                <div class="text-preset-line" style="font-size:${Math.min(preset.fontSize / 4, 8)}px; font-weight:${preset.fontWeight}; text-align:${preset.align}">Aa</div>
            </div>
            <span class="text-[8px] text-white/40 mt-1">${preset.name}</span>
        `;
        btn.onclick = () => {
            activePreset = preset.id;
            fontSize = preset.fontSize;
            fontWeight = preset.fontWeight;
            textAlign = preset.align;
            posX = preset.x;
            posY = preset.y;
            showBg = preset.bg;
            render();
            emitUpdate();
        };
        presetsGrid.appendChild(btn);
    });
    presetsSection.appendChild(presetsGrid);
    content.appendChild(presetsSection);

    // ==========================================
    // TEXT INPUT
    // ==========================================
    const textSection = document.createElement('div');
    textSection.className = 'vfx-control-group';

    const textLabel = document.createElement('label');
    textLabel.className = 'vfx-label';
    textLabel.textContent = 'Text';
    textSection.appendChild(textLabel);

    const textInput = document.createElement('textarea');
    textInput.value = textContent;
    textInput.className = 'vfx-textarea';
    textInput.rows = 2;
    textInput.placeholder = 'Enter your title text...';
    textInput.oninput = () => {
        textContent = textInput.value;
        emitUpdate();
    };
    textSection.appendChild(textInput);
    content.appendChild(textSection);

    // ==========================================
    // FONT CONTROLS
    // ==========================================
    const fontSection = document.createElement('div');
    fontSection.className = 'vfx-control-group';

    const fontLabel = document.createElement('label');
    fontLabel.className = 'vfx-label';
    fontLabel.textContent = 'Font';
    fontSection.appendChild(fontLabel);

    const fontRow = document.createElement('div');
    fontRow.className = 'flex items-center gap-2 flex-wrap';

    // Font family selector
    const fontSelect = document.createElement('select');
    fontSelect.className = 'vfx-select';
    FONT_FAMILIES.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        opt.selected = f === fontFamily;
        fontSelect.appendChild(opt);
    });
    fontSelect.onchange = () => {
        fontFamily = fontSelect.value;
        emitUpdate();
    };
    fontRow.appendChild(fontSelect);

    // Font size
    const sizeInput = document.createElement('input');
    sizeInput.type = 'number';
    sizeInput.min = 8;
    sizeInput.max = 120;
    sizeInput.value = fontSize;
    sizeInput.className = 'vfx-num-input';
    sizeInput.oninput = () => {
        fontSize = parseInt(sizeInput.value) || 24;
        emitUpdate();
    };
    fontRow.appendChild(sizeInput);

    // Color picker
    const textColorInput = document.createElement('input');
    textColorInput.type = 'color';
    textColorInput.value = textColor;
    textColorInput.className = 'vfx-color-picker small';
    textColorInput.oninput = () => {
        textColor = textColorInput.value;
        emitUpdate();
    };
    fontRow.appendChild(textColorInput);

    // Text align
    const alignBtns = ['left', 'center', 'right'];
    const alignIcons = { left: '◧', center: '◫', right: '◨' };
    alignBtns.forEach(a => {
        const btn = document.createElement('button');
        btn.className = `vfx-align-btn ${textAlign === a ? 'active' : ''}`;
        btn.textContent = alignIcons[a];
        btn.title = a;
        btn.onclick = () => {
            textAlign = a;
            render();
            emitUpdate();
        };
        fontRow.appendChild(btn);
    });

    fontSection.appendChild(fontRow);
    content.appendChild(fontSection);

    // ==========================================
    // ANIMATION
    // ==========================================
    const animSection = document.createElement('div');
    animSection.className = 'vfx-control-group';

    const animLabel = document.createElement('label');
    animLabel.className = 'vfx-label';
    animLabel.textContent = 'Animation';
    animSection.appendChild(animLabel);

    const animRow = document.createElement('div');
    animRow.className = 'flex items-center gap-1 flex-wrap';

    ANIMATION_PRESETS.forEach(anim => {
        const btn = document.createElement('button');
        btn.className = `text-anim-btn ${animation === anim.id ? 'active' : ''}`;
        btn.innerHTML = `<span class="text-[10px]">${anim.icon}</span><span class="text-[8px]">${anim.name}</span>`;
        btn.onclick = () => {
            animation = anim.id;
            render();
            emitUpdate();
        };
        animRow.appendChild(btn);
    });
    animSection.appendChild(animRow);
    content.appendChild(animSection);

    // ==========================================
    // DURATION
    // ==========================================
    const durSection = document.createElement('div');
    durSection.className = 'vfx-control-group';

    const durRow = document.createElement('div');
    durRow.className = 'vfx-label-row';
    durRow.innerHTML = `
        <label class="vfx-label">Duration</label>
        <span class="vfx-value">${duration}s</span>
    `;
    durSection.appendChild(durRow);

    const durSlider = document.createElement('input');
    durSlider.type = 'range';
    durSlider.min = 0.5;
    durSlider.max = 15;
    durSlider.step = 0.5;
    durSlider.value = duration;
    durSlider.className = 'vfx-slider';
    durSlider.oninput = () => {
        duration = parseFloat(durSlider.value);
        durRow.querySelector('.vfx-value').textContent = duration + 's';
        emitUpdate();
    };
    durSection.appendChild(durSlider);
    content.appendChild(durSection);

    // ==========================================
    // ADD TO TIMELINE BUTTON
    // ==========================================
    const addBtn = document.createElement('button');
    addBtn.className = 'vfx-add-btn';
    addBtn.innerHTML = `<span>+ Add to FX Track</span>`;
    addBtn.onclick = () => {
        if (onAddToTimeline) {
            onAddToTimeline({
                type: 'text',
                name: textContent.substring(0, 20) || 'Title',
                duration: duration,
                settings: getSettings()
            });
        }
    };
    content.appendChild(addBtn);

    root.appendChild(content);

    // ==========================================
    // RENDER LOGIC
    // ==========================================
    function render() {
        // Update preset active states
        presetsGrid.querySelectorAll('.text-preset-btn').forEach((btn, i) => {
            btn.classList.toggle('active', TITLE_PRESETS[i].id === activePreset);
        });
        // Update animation active states
        animRow.querySelectorAll('.text-anim-btn').forEach((btn, i) => {
            btn.classList.toggle('active', ANIMATION_PRESETS[i].id === animation);
        });
        // Update align active states
        fontRow.querySelectorAll('.vfx-align-btn').forEach((btn, i) => {
            btn.classList.toggle('active', alignBtns[i] === textAlign);
        });
    }

    function emitUpdate() {
        if (onApply) onApply(getSettings());
    }

    function getSettings() {
        return {
            textContent, fontFamily, fontSize, fontWeight, textColor,
            bgColor, bgOpacity, showBg, textAlign, posX, posY,
            animation, duration, preset: activePreset
        };
    }

    // Canvas rendering for preview
    function renderToCanvas(ctx, canvasWidth, canvasHeight, progress = 1) {
        if (!textContent) return;

        const x = (posX / 100) * canvasWidth;
        const y = (posY / 100) * canvasHeight;
        const scaledSize = fontSize * (canvasWidth / 800);

        // Animation progress
        let alpha = 1;
        let offsetY = 0;
        let scale = 1;
        let blur = 0;
        let charCount = textContent.length;

        if (progress < 1) {
            switch (animation) {
                case 'fade-in': alpha = progress; break;
                case 'slide-up': offsetY = (1 - progress) * 30; alpha = progress; break;
                case 'scale-in': scale = 0.5 + progress * 0.5; alpha = progress; break;
                case 'blur-in': blur = (1 - progress) * 10; alpha = progress; break;
                case 'typewriter': charCount = Math.floor(progress * textContent.length); break;
            }
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y + offsetY);

        if (scale !== 1) {
            ctx.scale(scale, scale);
        }

        // Background
        if (showBg) {
            ctx.fillStyle = bgColor;
            ctx.globalAlpha = alpha * (bgOpacity / 100);
            const text = animation === 'typewriter' ? textContent.substring(0, charCount) : textContent;
            ctx.font = `${fontWeight} ${scaledSize}px ${fontFamily}`;
            const metrics = ctx.measureText(text);
            const pad = scaledSize * 0.4;
            const bgX = textAlign === 'center' ? -metrics.width / 2 - pad : textAlign === 'right' ? -metrics.width - pad : -pad;
            ctx.fillRect(bgX, -scaledSize * 0.8, metrics.width + pad * 2, scaledSize * 1.4);
            ctx.globalAlpha = alpha;
        }

        // Text
        ctx.font = `${fontWeight} ${scaledSize}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'middle';

        if (blur > 0) {
            ctx.filter = `blur(${blur}px)`;
        }

        const displayText = animation === 'typewriter' ? textContent.substring(0, charCount) : textContent;
        ctx.fillText(displayText, 0, 0);

        ctx.restore();
    }

    // Public API
    root.getSettings = getSettings;
    root.renderToCanvas = renderToCanvas;

    return root;
}
