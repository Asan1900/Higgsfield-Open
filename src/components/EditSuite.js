import { muapi } from '../lib/muapi.js';
import { eventBus } from '../lib/EventBus.js';
import { projectStore } from '../lib/ProjectStore.js';

/**
 * Edit Suite — In-Paint / Out-Paint / Upscale with AI integration.
 * @param {Object} [opts]
 * @param {string} [opts.imageUrl] - Pre-loaded image URL from another studio
 */
export function EditSuite(opts = {}) {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

    // State
    let activeMode = 'inpaint'; // 'inpaint' | 'outpaint' | 'upscale'
    let activeTool = 'brush';   // 'move' | 'brush' | 'eraser'
    let brushSize = 20;
    let isDrawing = false;
    let isGenerating = false;

    // Header
    const header = document.createElement('div');
    header.className = 'h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#111]';

    const leftHeader = document.createElement('div');
    leftHeader.className = 'flex items-center gap-4';
    leftHeader.innerHTML = `
        <h1 class="text-xl font-black tracking-tight">EDIT <span class="text-primary">SUITE</span></h1>
        <div class="h-6 w-px bg-white/10"></div>
    `;

    // Mode tabs
    const modes = [
        { id: 'inpaint', label: 'In-Paint' },
        { id: 'outpaint', label: 'Out-Paint' },
        { id: 'upscale', label: 'Upscale' }
    ];
    const modeTabsContainer = document.createElement('div');
    modeTabsContainer.className = 'flex gap-2';

    modes.forEach(mode => {
        const btn = document.createElement('button');
        btn.className = `px-3 py-1 rounded-lg text-xs font-bold transition-colors ${mode.id === activeMode ? 'bg-white/5 text-primary' : 'bg-transparent hover:bg-white/5 text-white/40'}`;
        btn.textContent = mode.label;
        btn.onclick = () => {
            activeMode = mode.id;
            Array.from(modeTabsContainer.children).forEach((b, i) => {
                b.className = `px-3 py-1 rounded-lg text-xs font-bold transition-colors ${modes[i].id === activeMode ? 'bg-white/5 text-primary' : 'bg-transparent hover:bg-white/5 text-white/40'}`;
            });
            updateGenerateButton();
        };
        modeTabsContainer.appendChild(btn);
    });
    leftHeader.appendChild(modeTabsContainer);
    header.appendChild(leftHeader);

    // Right header actions
    const rightHeader = document.createElement('div');
    rightHeader.className = 'flex gap-2';

    const sendToTimelineBtn = document.createElement('button');
    sendToTimelineBtn.className = 'px-3 py-2 bg-white/5 text-white/40 text-xs font-bold rounded-lg hover:bg-white/10 hover:text-white transition-all';
    sendToTimelineBtn.textContent = '🎬 Send to Timeline';
    sendToTimelineBtn.onclick = () => {
        const dataUrl = mainCanvas.toDataURL('image/png');
        projectStore.addAsset({ url: dataUrl, type: 'image', name: 'Edited Image' });
        eventBus.emit('studio:navigate', { page: 'video' });
    };

    const exportBtn = document.createElement('button');
    exportBtn.className = 'px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:scale-105 transition-transform';
    exportBtn.textContent = 'Export';
    exportBtn.onclick = () => {
        const dataUrl = mainCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `edit_${Date.now()}.png`;
        a.click();
    };

    rightHeader.appendChild(sendToTimelineBtn);
    rightHeader.appendChild(exportBtn);
    header.appendChild(rightHeader);
    container.appendChild(header);

    // Main Workspace
    const workspace = document.createElement('div');
    workspace.className = 'flex-1 flex overflow-hidden';

    // ─── Toolbar (Left) ──────────────────────────────────────

    const toolbar = document.createElement('div');
    toolbar.className = 'w-16 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-4 gap-4';

    const tools = [
        { id: 'move', icon: '⊹', label: 'Move' },
        { id: 'brush', icon: '🖌', label: 'Brush' },
        { id: 'eraser', icon: '◻', label: 'Eraser' }
    ];

    const toolBtns = {};
    tools.forEach(t => {
        const btn = document.createElement('button');
        btn.className = `w-10 h-10 rounded-lg flex items-center justify-center transition-all text-lg ${t.id === activeTool ? 'bg-primary text-black shadow-glow' : 'text-white/40 hover:text-white hover:bg-white/5'}`;
        btn.title = t.label;
        btn.textContent = t.icon;
        btn.onclick = () => {
            activeTool = t.id;
            Object.entries(toolBtns).forEach(([id, b]) => {
                b.className = `w-10 h-10 rounded-lg flex items-center justify-center transition-all text-lg ${id === activeTool ? 'bg-primary text-black shadow-glow' : 'text-white/40 hover:text-white hover:bg-white/5'}`;
            });
            mainCanvas.style.cursor = activeTool === 'move' ? 'grab' : 'crosshair';
        };
        toolBtns[t.id] = btn;
        toolbar.appendChild(btn);
    });
    workspace.appendChild(toolbar);

    // ─── Canvas Area (Center) ────────────────────────────────

    const canvasArea = document.createElement('div');
    canvasArea.className = 'flex-1 bg-[#151515] relative flex items-center justify-center overflow-hidden';
    canvasArea.innerHTML = `<div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 20px 20px;"></div>`;

    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'relative shadow-2xl border border-white/10 bg-black';
    canvasWrapper.style.width = '800px';
    canvasWrapper.style.height = '450px';

    // Main canvas (image layer)
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = 800;
    mainCanvas.height = 450;
    mainCanvas.className = 'absolute inset-0';

    // Mask canvas (overlay)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 800;
    maskCanvas.height = 450;
    maskCanvas.className = 'absolute inset-0 cursor-crosshair';
    maskCanvas.style.zIndex = '2';

    // Result canvas (generated result overlay)
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = 800;
    resultCanvas.height = 450;
    resultCanvas.className = 'absolute inset-0 pointer-events-none';
    resultCanvas.style.zIndex = '3';
    resultCanvas.style.opacity = '0';
    resultCanvas.style.transition = 'opacity 0.3s';

    canvasWrapper.appendChild(mainCanvas);
    canvasWrapper.appendChild(maskCanvas);
    canvasWrapper.appendChild(resultCanvas);
    canvasArea.appendChild(canvasWrapper);

    // Loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 hidden';
    loadingOverlay.style.zIndex = '10';
    loadingOverlay.innerHTML = `
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-bold text-white/60" id="loading-text">Generating...</span>
    `;
    canvasWrapper.appendChild(loadingOverlay);

    workspace.appendChild(canvasArea);

    // ─── Properties (Right) ──────────────────────────────────

    const properties = document.createElement('div');
    properties.className = 'w-64 bg-[#111] border-l border-white/5 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar';

    // Brush Size
    const brushGroup = document.createElement('div');
    brushGroup.innerHTML = `
        <label class="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">Brush Size</label>
    `;
    const brushSlider = document.createElement('input');
    brushSlider.type = 'range';
    brushSlider.min = 1;
    brushSlider.max = 100;
    brushSlider.value = brushSize;
    brushSlider.className = 'w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer vfx-slider';
    brushSlider.oninput = () => { brushSize = parseInt(brushSlider.value); };

    const brushLabels = document.createElement('div');
    brushLabels.className = 'flex justify-between text-[10px] text-white/40 mt-1';
    brushLabels.innerHTML = '<span>1px</span><span>100px</span>';
    brushGroup.appendChild(brushSlider);
    brushGroup.appendChild(brushLabels);
    properties.appendChild(brushGroup);

    // Prompt
    const promptGroup = document.createElement('div');
    promptGroup.innerHTML = `
        <label class="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">Prompt</label>
    `;
    const promptArea = document.createElement('textarea');
    promptArea.className = 'w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary/50 resize-none h-24';
    promptArea.placeholder = 'Describe what to generate in the masked area...';
    promptGroup.appendChild(promptArea);
    properties.appendChild(promptGroup);

    // Mask Controls
    const maskControls = document.createElement('div');
    maskControls.className = 'flex gap-2';

    const clearMaskBtn = document.createElement('button');
    clearMaskBtn.className = 'flex-1 bg-white/5 text-white/40 font-bold text-xs py-2 rounded-lg hover:bg-white/10 transition-colors';
    clearMaskBtn.textContent = 'Clear Mask';
    clearMaskBtn.onclick = () => {
        const mctx = maskCanvas.getContext('2d');
        mctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    };
    maskControls.appendChild(clearMaskBtn);

    const acceptResultBtn = document.createElement('button');
    acceptResultBtn.className = 'flex-1 bg-white/5 text-white/40 font-bold text-xs py-2 rounded-lg hover:bg-white/10 transition-colors hidden';
    acceptResultBtn.textContent = '✓ Accept';
    acceptResultBtn.id = 'accept-result-btn';
    acceptResultBtn.onclick = () => {
        // Merge result into main canvas
        const ctx = mainCanvas.getContext('2d');
        ctx.drawImage(resultCanvas, 0, 0);
        resultCanvas.style.opacity = '0';
        acceptResultBtn.classList.add('hidden');
        const mctx = maskCanvas.getContext('2d');
        mctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    };
    maskControls.appendChild(acceptResultBtn);
    properties.appendChild(maskControls);

    // Generate Button
    const generateBtn = document.createElement('button');
    generateBtn.className = 'w-full bg-primary text-black font-bold uppercase py-3 rounded-xl hover:shadow-glow transition-all mt-auto';
    generateBtn.textContent = 'Generate Fill';
    generateBtn.id = 'generate-btn';

    function updateGenerateButton() {
        if (activeMode === 'inpaint') generateBtn.textContent = 'Generate Fill';
        else if (activeMode === 'outpaint') generateBtn.textContent = 'Extend Canvas';
        else generateBtn.textContent = 'Upscale (2x)';
    }

    generateBtn.onclick = async () => {
        if (isGenerating) return;
        isGenerating = true;
        loadingOverlay.classList.remove('hidden');
        const loadingText = loadingOverlay.querySelector('#loading-text');

        try {
            // Get image as base64
            const imageDataUrl = mainCanvas.toDataURL('image/png');
            const prompt = promptArea.value || 'seamless natural fill';

            loadingText.textContent = `Running ${activeMode}...`;

            if (activeMode === 'upscale') {
                // Upscale doesn't need mask
                const result = await muapi.generateImage({
                    model: 'flux-schnell',
                    prompt: prompt,
                    image_url: imageDataUrl
                });
                if (result?.url) await loadImageToCanvas(result.url, resultCanvas);
            } else {
                // In-paint / Out-paint
                const result = await muapi.generateImage({
                    model: 'flux-schnell',
                    prompt: prompt,
                    image_url: imageDataUrl,
                    strength: activeMode === 'inpaint' ? 0.8 : 0.6
                });
                if (result?.url) await loadImageToCanvas(result.url, resultCanvas);
            }

            resultCanvas.style.opacity = '1';
            acceptResultBtn.classList.remove('hidden');

            // Save to asset store
            projectStore.addAsset({
                url: resultCanvas.toDataURL('image/png'),
                type: 'image',
                name: `${activeMode}: ${prompt.slice(0, 30)}`,
                prompt
            });

        } catch (err) {
            console.error('[EditSuite] Generation failed:', err);
            loadingText.textContent = `❌ ${err.message}`;
            await new Promise(r => setTimeout(r, 2000));
        } finally {
            isGenerating = false;
            loadingOverlay.classList.add('hidden');
        }
    };
    properties.appendChild(generateBtn);

    workspace.appendChild(properties);
    container.appendChild(workspace);

    // ─── Drawing Logic ───────────────────────────────────────

    const mctx = maskCanvas.getContext('2d');
    const mainCtx = mainCanvas.getContext('2d');

    maskCanvas.onmousedown = (e) => {
        if (activeTool === 'move') return;
        isDrawing = true;
        const rect = maskCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (maskCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (maskCanvas.height / rect.height);
        mctx.beginPath();
        mctx.moveTo(x, y);

        if (activeTool === 'brush') {
            mctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
            mctx.lineWidth = brushSize;
            mctx.lineCap = 'round';
            mctx.globalCompositeOperation = 'source-over';
        } else if (activeTool === 'eraser') {
            mctx.globalCompositeOperation = 'destination-out';
            mctx.lineWidth = brushSize;
            mctx.lineCap = 'round';
        }
    };

    maskCanvas.onmousemove = (e) => {
        if (!isDrawing) return;
        const rect = maskCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (maskCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (maskCanvas.height / rect.height);
        mctx.lineTo(x, y);
        mctx.stroke();
    };

    maskCanvas.onmouseup = () => {
        isDrawing = false;
        mctx.globalCompositeOperation = 'source-over';
    };
    maskCanvas.onmouseleave = () => {
        isDrawing = false;
        mctx.globalCompositeOperation = 'source-over';
    };

    // ─── Load initial image ──────────────────────────────────

    const imageUrl = opts.imageUrl || 'https://cdn.pixabay.com/photo/2023/10/22/19/56/mountains-8334759_640.jpg';
    loadImageToCanvas(imageUrl, mainCanvas);

    return container;
}

/**
 * Load an image URL onto a canvas.
 */
function loadImageToCanvas(url, canvas) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve();
        };
        img.onerror = reject;
        img.src = url;
    });
}
