
import { muapi } from '../lib/muapi.js';
import { CameraControls } from './CameraControls.js';
import { buildNanoBananaPrompt, buildCinemaVideoPrompt, CAMERA_MAP, LENS_MAP, LENS_MOTION_PRESET } from '../lib/promptUtils.js';
import { AuthModal } from './AuthModal.js';
import { FilmStrip } from './FilmStrip.js';
import { AudioPanel } from './AudioPanel.js';
import { eventBus } from '../lib/EventBus.js';
import { projectStore } from '../lib/ProjectStore.js';

export function CinemaStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-black relative overflow-hidden';

    // --- State ---
    const currentSettings = {
        prompt: '',
        aspect_ratio: '16:9',
        camera: Object.keys(CAMERA_MAP)[0],
        lens: Object.keys(LENS_MAP)[0],
        focal: 35,
        aperture: "f/1.4",
        mode: 'image',
        motion: { pan: 0, tilt: 0, zoom: 0, dolly: 0 }
    };

    // ==========================================
    // 1. HERO SECTION (Empty State)
    // ==========================================
    const heroSection = document.createElement('div');
    heroSection.className = 'flex flex-col items-center justify-center text-center px-4 animate-fade-in-up';
    heroSection.innerHTML = `
        <div class="mb-4 text-xs font-bold text-white/40 tracking-[0.2em] uppercase">Cinema Studio 2.0</div>
        <h1 class="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tight leading-tight mb-2">
            What would you shoot<br>with infinite budget?
        </h1>
    `;
    container.appendChild(heroSection);

    // ==========================================
    // 2. CAMERA CONTROLS OVERLAY
    // ==========================================
    const overlayBackdrop = document.createElement('div');
    overlayBackdrop.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-40 opacity-0 pointer-events-none transition-opacity duration-300 flex items-center justify-center';

    const overlayContent = document.createElement('div');
    // Reduced padding for mobile (p-4) and added max-height/overflow handling
    overlayContent.className = 'w-full max-w-4xl bg-[#141414] border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh]';
    overlayBackdrop.appendChild(overlayContent);

    // Header for Overlay
    const overlayHeader = document.createElement('div');
    overlayHeader.className = 'flex items-center justify-between mb-8';
    overlayHeader.innerHTML = `
        <div class="flex gap-4">
            <button class="px-4 py-2 bg-white text-black text-xs font-bold rounded-full">All</button>
        </div>
        <button id="close-overlay-btn" class="text-white/50 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
    `;
    overlayContent.appendChild(overlayHeader);

    // Controls Component
    const cameraControls = CameraControls((state) => {
        const lensChanged = currentSettings.lens !== state.lens;
        currentSettings.camera = state.camera;
        currentSettings.lens = state.lens;
        currentSettings.focal = state.focal;
        currentSettings.aperture = state.aperture;

        // Auto-apply lens motion preset when lens changes
        if (lensChanged && currentSettings.mode === 'video') {
            const preset = LENS_MOTION_PRESET[state.lens];
            if (preset) {
                currentSettings.motion = { ...preset };
                updateMotionSliders();
            }
        }
        updateSummaryCard();
    });
    overlayContent.appendChild(cameraControls);

    document.body.appendChild(overlayBackdrop); // Append to body to sit above everything

    // Overlay Logic
    const openOverlay = () => {
        overlayBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        overlayContent.classList.remove('scale-95');
        overlayContent.classList.add('scale-100');
    };
    const closeOverlay = () => {
        overlayBackdrop.classList.add('opacity-0', 'pointer-events-none');
        overlayContent.classList.add('scale-95');
        overlayContent.classList.remove('scale-100');
    };
    overlayContent.querySelector('#close-overlay-btn').onclick = closeOverlay;
    overlayBackdrop.onclick = (e) => { if (e.target === overlayBackdrop) closeOverlay(); };


    // ==========================================
    // 3. FLOATING PROMPT BAR
    // ==========================================
    const promptBarWrapper = document.createElement('div');
    promptBarWrapper.className = 'absolute bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl z-30';

    const promptBar = document.createElement('div');
    promptBar.className = 'bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-4 flex justify-between shadow-3xl items-end relative';

    // --- LEFT COLUMN (Input + Settings) ---
    const leftColumn = document.createElement('div');
    leftColumn.className = 'flex-1 flex flex-col gap-3 min-h-[80px] justify-between py-1 px-1';

    // 1. Input Area
    const inputRow = document.createElement('div');
    inputRow.className = 'flex items-start gap-3 w-full';



    // Textarea
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Describe your scene - use @ to add characters & props';
    textarea.className = 'flex-1 bg-transparent border-none text-white text-lg font-medium placeholder:text-white/20 focus:outline-none resize-none h-[28px] leading-relaxed overflow-hidden';
    textarea.style.height = 'auto'; // Auto-grow check
    textarea.rows = 1;
    textarea.oninput = function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    };
    inputRow.appendChild(textarea);

    leftColumn.appendChild(inputRow);

    // 2. Settings Toolbar (Bottom Left)
    // 2. Settings Toolbar (Bottom Left)
    const settingsToolbar = document.createElement('div');
    settingsToolbar.className = 'flex items-center gap-3'; // Removed pl-11 to align left

    // Helper: Create Dropdown
    const createDropdown = (items, selected, onSelect, trigger) => {
        const existing = document.querySelectorAll('.custom-dropdown');
        existing.forEach(el => el.remove());

        const rect = trigger.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'custom-dropdown fixed bg-[#1a1a1a] border border-white/10 rounded-xl py-1 shadow-2xl z-50 flex flex-col min-w-[100px] animate-fade-in';
        menu.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
        menu.style.left = rect.left + 'px';

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = `px-3 py-2 text-xs font-bold text-left hover:bg-white/10 transition-colors ${item === selected ? 'text-primary' : 'text-white'}`;
            btn.textContent = item;
            btn.onclick = (e) => {
                e.stopPropagation();
                onSelect(item);
                menu.remove();
            };
            menu.appendChild(btn);
        });

        const closeHandler = (e) => {
            if (!menu.contains(e.target) && e.target !== trigger) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
        document.body.appendChild(menu);
    };

    // Aspect Ratio
    const arBtn = document.createElement('button');
    arBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5';
    const updateArBtn = () => {
        arBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"/></svg> ${currentSettings.aspect_ratio}`;
    };
    updateArBtn();
    arBtn.onclick = () => {
        createDropdown(['16:9', '21:9', '9:16', '1:1', '4:5'], currentSettings.aspect_ratio, (val) => {
            currentSettings.aspect_ratio = val;
            updateArBtn();
        }, arBtn);
    };
    settingsToolbar.appendChild(arBtn);

    // Resolution
    const resBtn = document.createElement('button');
    resBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5';
    const updateResBtn = (val) => {
        resBtn.dataset.value = val || '2K';
        resBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> ${resBtn.dataset.value}`;
    };
    updateResBtn('2K');
    resBtn.onclick = () => {
        createDropdown(['1K', '2K', '4K'], resBtn.dataset.value, (val) => { updateResBtn(val); }, resBtn);
    };
    settingsToolbar.appendChild(resBtn);

    // Mode Selector (Video/Image)
    const modeBtn = document.createElement('button');
    modeBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5';
    const updateModeBtn = () => {
        const isVideo = currentSettings.mode === 'video';
        modeBtn.innerHTML = isVideo
            ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> VIDEO`
            : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> IMAGE`;
        modeBtn.classList.toggle('text-primary', isVideo);
        modeBtn.classList.toggle('border-primary/30', isVideo);
    };
    updateModeBtn();
    modeBtn.onclick = () => {
        currentSettings.mode = currentSettings.mode === 'image' ? 'video' : 'image';
        updateModeBtn();
        toggleMotionPanel();
    };
    settingsToolbar.appendChild(modeBtn);

    leftColumn.appendChild(settingsToolbar);

    // ==========================================
    // MOTION CONTROL PANEL (Video Mode Only)
    // ==========================================
    const motionPanel = document.createElement('div');
    motionPanel.className = 'hidden flex items-center gap-4 px-1 py-2 animate-fade-in';

    const motionAxes = [
        { key: 'pan', label: 'PAN', iconL: '←', iconR: '→' },
        { key: 'tilt', label: 'TILT', iconL: '↓', iconR: '↑' },
        { key: 'zoom', label: 'ZOOM', iconL: '−', iconR: '+' },
        { key: 'dolly', label: 'DOLLY', iconL: '⇤', iconR: '⇥' }
    ];

    const motionSliderRefs = {};

    motionAxes.forEach(axis => {
        const group = document.createElement('div');
        group.className = 'flex flex-col items-center gap-0.5';

        const label = document.createElement('span');
        label.className = 'text-[8px] font-black text-white/30 uppercase tracking-widest';
        label.textContent = axis.label;

        const sliderRow = document.createElement('div');
        sliderRow.className = 'flex items-center gap-1';

        const iconL = document.createElement('span');
        iconL.className = 'text-[10px] text-white/20 w-3 text-center select-none';
        iconL.textContent = axis.iconL;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = -100;
        slider.max = 100;
        slider.value = currentSettings.motion[axis.key];
        slider.className = 'motion-slider w-16 h-1 appearance-none bg-white/10 rounded-full outline-none cursor-pointer accent-[#d9ff00]';
        slider.style.cssText = 'accent-color: #d9ff00;';

        motionSliderRefs[axis.key] = slider;

        slider.oninput = () => {
            currentSettings.motion[axis.key] = parseInt(slider.value);
        };

        // Double-click to reset
        slider.ondblclick = () => {
            slider.value = 0;
            currentSettings.motion[axis.key] = 0;
        };

        const iconR = document.createElement('span');
        iconR.className = 'text-[10px] text-white/20 w-3 text-center select-none';
        iconR.textContent = axis.iconR;

        sliderRow.appendChild(iconL);
        sliderRow.appendChild(slider);
        sliderRow.appendChild(iconR);

        group.appendChild(label);
        group.appendChild(sliderRow);
        motionPanel.appendChild(group);
    });

    // Reset All button
    const resetMotionBtn = document.createElement('button');
    resetMotionBtn.className = 'text-[8px] font-bold text-white/20 hover:text-white/60 uppercase tracking-widest transition-colors ml-1 self-end mb-0.5';
    resetMotionBtn.textContent = 'RESET';
    resetMotionBtn.onclick = () => {
        currentSettings.motion = { pan: 0, tilt: 0, zoom: 0, dolly: 0 };
        updateMotionSliders();
    };
    motionPanel.appendChild(resetMotionBtn);

    leftColumn.appendChild(motionPanel);

    const toggleMotionPanel = () => {
        if (currentSettings.mode === 'video') {
            motionPanel.classList.remove('hidden');
        } else {
            motionPanel.classList.add('hidden');
        }
    };

    const updateMotionSliders = () => {
        Object.keys(motionSliderRefs).forEach(key => {
            motionSliderRefs[key].value = currentSettings.motion[key];
        });
    };
    promptBar.appendChild(leftColumn);


    // ==========================================
    // IMAGE INPUT (Visual Reference)
    // ==========================================
    let selectedImage = null; // { url, file }

    const imageInputWrapper = document.createElement('div');
    imageInputWrapper.className = 'relative flex items-center justify-center w-[56px] h-[56px] flex-shrink-0 mr-2';

    const imageInputBtn = document.createElement('div');
    imageInputBtn.className = 'w-full h-full bg-[#111] rounded-xl border border-white/10 hover:border-white/30 transition-all cursor-pointer flex items-center justify-center overflow-hidden group relative';

    // File input (hidden)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'hidden';
    imageInputWrapper.appendChild(fileInput);

    const renderImageInput = () => {
        imageInputBtn.innerHTML = '';
        if (selectedImage) {
            // Selected State
            const img = document.createElement('img');
            img.src = selectedImage.url;
            img.className = 'w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity';
            imageInputBtn.appendChild(img);

            // Clear button (appears on hover)
            const clearBtn = document.createElement('button');
            clearBtn.className = 'absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity';
            clearBtn.innerHTML = `<span class="text-white text-xs font-bold">✕</span>`;
            clearBtn.onclick = (e) => {
                e.stopPropagation();
                selectedImage = null;
                renderImageInput();
                fileInput.value = '';
            };
            imageInputBtn.appendChild(clearBtn);

            imageInputBtn.classList.add('border-primary/50');
        } else {
            // Empty State
            imageInputBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white/30 group-hover:text-white/60 transition-colors"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
            imageInputBtn.classList.remove('border-primary/50');
        }
    };

    imageInputBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            selectedImage = { url, file }; // In a real app we'd upload this first
            renderImageInput();
        }
    };

    // Drag-and-drop support
    imageInputBtn.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageInputBtn.classList.add('border-primary');
    });
    imageInputBtn.addEventListener('dragleave', () => {
        imageInputBtn.classList.remove('border-primary');
    });
    imageInputBtn.addEventListener('drop', (e) => {
        e.preventDefault();
        imageInputBtn.classList.remove('border-primary');
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data && data.url) {
                // If it's a history item
                selectedImage = { url: data.url };
                renderImageInput();
            }
        } catch (err) {
            // If it's a file drop
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                selectedImage = { url, file };
                renderImageInput();
            }
        }
    });

    renderImageInput();
    imageInputWrapper.appendChild(imageInputBtn);

    // Add to inputRow (before textarea)
    inputRow.insertBefore(imageInputWrapper, textarea);

    // --- RIGHT GROUP (Summary + Generate) ---
    const rightGroup = document.createElement('div');
    rightGroup.className = 'flex items-center gap-2 h-full self-end mb-1';

    // Summary Card (Triggers Overlay)
    const summaryCard = document.createElement('button');
    // Removed 'hidden' class, added 'flex' and refined width constraints for mobile
    summaryCard.className = 'flex flex-col items-start justify-center px-4 py-2 bg-[#2a2a2a] rounded-xl border border-white/5 hover:border-white/20 transition-colors text-left flex-1 min-w-[100px] md:min-w-[140px] max-w-[240px] h-[56px] relative group overflow-hidden';

    // Dot indicator
    const dot = document.createElement('div');
    dot.className = 'absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-glow-sm';
    summaryCard.appendChild(dot);

    const summaryTitle = document.createElement('span');
    summaryTitle.className = 'text-[10px] font-bold text-white uppercase truncate w-full tracking-wide';
    summaryTitle.textContent = currentSettings.camera;

    const summaryValue = document.createElement('span');
    summaryValue.className = 'text-[10px] font-medium text-white/60 truncate w-full';
    summaryValue.textContent = formatSummaryValue();

    summaryCard.appendChild(summaryTitle);
    summaryCard.appendChild(summaryValue);

    summaryCard.onclick = openOverlay;

    function formatSummaryValue() {
        return `${currentSettings.lens}, ${currentSettings.focal}mm, ${currentSettings.aperture}`;
    }

    function updateSummaryCard() {
        summaryTitle.textContent = currentSettings.camera;
        summaryValue.textContent = formatSummaryValue();
    }

    // Generate Button
    const generateBtn = document.createElement('button');
    generateBtn.className = 'h-[56px] px-8 bg-[#d9ff00] text-black rounded-xl font-black text-xs uppercase hover:bg-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed';
    generateBtn.innerHTML = `GENERATE ✨`;
    generateBtn.onclick = async () => {
        const prompt = textarea.value.trim();
        // Allow generation if Image is present (Image-to-Video) even if prompt is empty? 
        // For now, require at least one.
        if (!prompt && !selectedImage) return;

        generateBtn.disabled = true;
        generateBtn.textContent = 'SHOOTING...';
        textarea.disabled = true;

        // Hide Audio Panel if open
        audioPanel.hide();

        try {
            const width = 1280;
            const height = 720; // Simplified for demo

            // Build the final prompt
            let fullPrompt = currentSettings.mode === 'video'
                ? buildCinemaVideoPrompt(prompt, currentSettings.camera, currentSettings.lens, currentSettings.motion)
                : buildNanoBananaPrompt(prompt); // Fallback for image mode

            if (selectedImage) {
                console.log('Generating with Image Reference:', selectedImage.url);
            }

            let res;
            if (currentSettings.mode === 'video') {
                res = await muapi.generateVideo({
                    model: 'veo3-image-to-video', // Use I2V model if image present? Or smart switch?
                    // Actually, let's stick to 'veo3-video' but pass image_url if present
                    // Most video models support both T2V and I2V
                    prompt: fullPrompt,
                    aspect_ratio: currentSettings.aspect_ratio,
                    image_url: selectedImage ? selectedImage.url : undefined
                });
            } else {
                res = await muapi.generateImage({
                    model: 'nano-banana',
                    prompt: fullPrompt,
                    aspect_ratio: currentSettings.aspect_ratio,
                    image_url: selectedImage ? selectedImage.url : undefined
                });
            }

            if (res && res.url) {
                const historyEntry = {
                    id: Date.now(),
                    url: res.url,
                    type: currentSettings.mode,
                    prompt: fullPrompt,
                    settings: { ...currentSettings }
                };
                addToHistory(historyEntry);
                lastGeneratedEntry = historyEntry;
                showCanvas(res.url);

                // Add to film strip automatically? No, user choice.
                // But we update the "Add to Story" button state
                addToStoryBtn.textContent = '🎬 Add to Story';
                addToStoryBtn.classList.remove('opacity-60');
            }

        } catch (err) {
            console.error(err);
            alert('Generation failed: ' + err.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `GENERATE ✨`;
            textarea.disabled = false;
        }
    };

    rightGroup.appendChild(summaryCard);
    rightGroup.appendChild(generateBtn);
    promptBar.appendChild(rightGroup);

    promptBarWrapper.appendChild(promptBar);

    // ==========================================
    // FILM STRIP (Storyboard Timeline)
    // ==========================================
    let lastGeneratedEntry = null;

    const filmStrip = FilmStrip((clip) => {
        // Clip selected in film strip — show it in canvas
        const fakeEntry = { url: clip.url, type: clip.type, settings: { prompt: clip.prompt } };
        showCanvas(fakeEntry.url);
    });
    promptBarWrapper.insertBefore(filmStrip, promptBar);

    container.appendChild(promptBarWrapper);


    // ==========================================
    // 3. HISTORY SIDEBAR
    // ==========================================
    const generationHistory = [];

    // History Sidebar - VISIBLE BY DEFAULT (removed translate-x-full opacity-0)
    const historySidebar = document.createElement('div');
    historySidebar.className = 'fixed right-0 top-0 h-full w-20 md:w-24 bg-black/60 backdrop-blur-xl border-l border-white/5 z-50 flex flex-col items-center py-4 gap-3 overflow-y-auto transition-all duration-500';

    const historyLabel = document.createElement('div');
    historyLabel.className = 'text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2';
    historyLabel.textContent = 'History';
    historySidebar.appendChild(historyLabel);

    const historyList = document.createElement('div');
    historyList.className = 'flex flex-col gap-2 w-full px-2';
    historySidebar.appendChild(historyList);

    container.appendChild(historySidebar);

    // ==========================================
    // 4. CANVAS AREA (Result View)
    // ==========================================
    const canvas = document.createElement('div');
    canvas.className = 'absolute inset-0 flex flex-col items-center justify-center p-4 min-[800px]:p-16 z-30 opacity-0 pointer-events-none transition-all duration-1000 translate-y-10 scale-95 bg-black/90 backdrop-blur-3xl';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative group max-w-full max-h-[70vh] flex items-center justify-center';

    const resultImg = document.createElement('img');
    resultImg.className = 'max-h-[60vh] max-w-[90vw] rounded-2xl shadow-2xl border border-white/10 object-contain';
    imageContainer.appendChild(resultImg);

    const resultVid = document.createElement('video');
    resultVid.className = 'max-h-[60vh] max-w-[90vw] rounded-2xl shadow-2xl border border-white/10 object-contain hidden';
    resultVid.controls = true;
    resultVid.autoplay = true;
    resultVid.loop = true;
    imageContainer.appendChild(resultVid);

    canvas.appendChild(imageContainer);

    // Canvas Controls
    const canvasControls = document.createElement('div');
    canvasControls.className = 'mt-8 flex gap-3 opacity-0 transition-opacity delay-500 duration-500 justify-center';

    const createActionBtn = (label, primary = false) => {
        const btn = document.createElement('button');
        btn.className = primary
            ? 'bg-[#d9ff00] text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-white transition-colors shadow-glow-sm hover:scale-105 active:scale-95'
            : 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border border-white/5 backdrop-blur-lg text-white hover:border-white/20';
        btn.textContent = label;
        return btn;
    };

    const regenerateBtn = createActionBtn('↻ Regenerate');
    const downloadBtn = createActionBtn('↓ Download', true);
    const addToStoryBtn = createActionBtn('🎬 Add to Story');
    const audioBtn = createActionBtn('🔊 Audio');
    const newPromptBtn = createActionBtn('+ New Shot');
    const sendToEditorBtn = createActionBtn('✂️ Edit');
    const sendToTimelineBtn = createActionBtn('🎬 Timeline');

    canvasControls.appendChild(regenerateBtn);
    canvasControls.appendChild(downloadBtn);
    canvasControls.appendChild(addToStoryBtn);
    canvasControls.appendChild(sendToEditorBtn);
    canvasControls.appendChild(sendToTimelineBtn);
    canvasControls.appendChild(audioBtn);
    canvasControls.appendChild(newPromptBtn);

    sendToEditorBtn.onclick = () => {
        const url = resultImg.src || resultVid.src;
        if (url) eventBus.emit('studio:navigate', { page: 'edit', imageUrl: url });
    };

    sendToTimelineBtn.onclick = () => {
        const url = resultImg.src || resultVid.src;
        const isVideo = !resultVid.classList.contains('hidden');
        if (url) {
            projectStore.addAsset({
                url,
                type: isVideo ? 'video' : 'image',
                name: textarea.value?.slice(0, 40) || 'Cinema Shot',
                prompt: textarea.value || ''
            });
            sendToTimelineBtn.textContent = '✓ Added!';
            setTimeout(() => { sendToTimelineBtn.textContent = '🎬 Timeline'; }, 1500);
        }
    };

    addToStoryBtn.onclick = () => {
        if (lastGeneratedEntry) {
            filmStrip.addClip(lastGeneratedEntry);
            // Brief flash feedback
            addToStoryBtn.textContent = '✓ Added!';
            addToStoryBtn.classList.add('opacity-60');
            setTimeout(() => {
                addToStoryBtn.textContent = '🎬 Add to Story';
                addToStoryBtn.classList.remove('opacity-60');
            }, 1200);
        }
    };

    // --- Audio Panel ---
    const audioPanel = AudioPanel({
        videoUrl: null,
        onVideoUpdate: (newUrl) => {
            // Lip-sync returned a new video, show it
            resultVid.src = newUrl;
            resultVid.classList.remove('hidden');
            resultImg.classList.add('hidden');
        }
    });
    audioBtn.onclick = () => audioPanel.toggle();
    container.appendChild(audioPanel);

    canvas.appendChild(canvasControls);

    container.appendChild(canvas);

    // --- History Logic ---
    const renderHistory = () => {
        historyList.innerHTML = '';
        generationHistory.forEach((entry, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `relative group/thumb cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 aspect-square ${idx === 0 ? 'border-[#d9ff00] shadow-glow-sm' : 'border-white/10 hover:border-white/30'}`;
            thumb.draggable = true;

            thumb.innerHTML = `
                ${entry.type === 'video' ? `<video src="${entry.url}" class="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity" muted loop></video>` : `<img src="${entry.url}" class="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity">`}
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="text-[8px] font-bold text-white uppercase">${entry.type === 'video' ? 'Play' : 'Load'}</span>
                </div>
                ${entry.type === 'video' ? `<div class="absolute top-1 right-1 bg-black/60 rounded px-1.5 py-0.5 text-[8px] font-black text-primary border border-white/10 uppercase">Video</div>` : ''}
            `;

            // Drag support for Film Strip
            thumb.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(entry));
                e.dataTransfer.effectAllowed = 'copy';
                thumb.classList.add('opacity-40');
            });
            thumb.addEventListener('dragend', () => {
                thumb.classList.remove('opacity-40');
            });

            thumb.onclick = () => loadHistoryItem(entry, thumb);
            historyList.appendChild(thumb);
        });
    };

    const addToHistory = (entry) => {
        generationHistory.unshift(entry);
        localStorage.setItem('cinema_history', JSON.stringify(generationHistory.slice(0, 50)));
        renderHistory();
    };

    const loadHistoryItem = (entry, thumbElement) => {
        // Restore Settings
        if (entry.settings) {
            currentSettings.camera = entry.settings.camera;
            currentSettings.lens = entry.settings.lens;
            currentSettings.focal = entry.settings.focal;
            currentSettings.aperture = entry.settings.aperture;
            currentSettings.aspect_ratio = entry.settings.aspect_ratio;
            currentSettings.mode = entry.type || 'image';

            // Update UI elements
            textarea.value = entry.settings.prompt || '';
            updateSummaryCard();
            updateArBtn();
            updateModeBtn();
            updateResBtn(entry.settings.resolution || '2K');
        }

        showCanvas(entry.url);

        // Highlight active history item
        if (thumbElement) {
            historyList.querySelectorAll('div').forEach(t => {
                t.classList.remove('border-[#d9ff00]', 'shadow-glow-sm');
                t.classList.add('border-white/10');
            });
            thumbElement.classList.remove('border-white/10');
            thumbElement.classList.add('border-[#d9ff00]', 'shadow-glow-sm');
        }
    };

    const showCanvas = (url) => {
        const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.includes('/video');

        if (isVideo) {
            resultVid.src = url;
            resultVid.classList.remove('hidden');
            resultImg.classList.add('hidden');
            // Enable audio panel for videos
            audioBtn.classList.remove('hidden');
            audioPanel.setVideoUrl(url);
        } else {
            resultImg.src = url;
            resultImg.classList.remove('hidden');
            resultVid.classList.add('hidden');
            // Hide audio button for images
            audioBtn.classList.add('hidden');
            audioPanel.hide();
        }

        // Hide Input UI
        heroSection.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        promptBarWrapper.classList.add('opacity-0', 'pointer-events-none', 'translate-y-20');

        // Show Canvas
        canvas.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
        canvas.classList.add('opacity-100', 'translate-y-0', 'scale-100');
        canvasControls.classList.remove('opacity-0');
        canvasControls.classList.add('opacity-100');
    };

    const resetToPrompt = () => {
        // Pause video if playing
        resultVid.pause();
        // Hide Canvas
        canvas.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
        canvas.classList.remove('opacity-100', 'translate-y-0', 'scale-100');

        // Show Input UI
        heroSection.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        promptBarWrapper.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-20');

        // Clear prompt for new shot?
        textarea.value = '';
        textarea.focus();
    };

    // Load saved history
    try {
        const saved = JSON.parse(localStorage.getItem('cinema_history') || '[]');
        if (saved.length > 0) {
            saved.forEach(e => generationHistory.push(e));
            renderHistory();
        }
    } catch (e) { }

    // Actions
    newPromptBtn.onclick = resetToPrompt;

    regenerateBtn.onclick = () => {
        resetToPrompt();
        setTimeout(() => {
            generateBtn.click();
        }, 300);
    };

    downloadBtn.onclick = async () => {
        try {
            const response = await fetch(resultImg.src);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `cinema-shot-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(resultImg.src, '_blank');
        }
    };

    // ==========================================
    // 5. GENERATION LOGIC UPDATE
    // ==========================================
    generateBtn.onclick = async () => {
        const basePrompt = textarea.value.trim();
        if (!basePrompt) return;

        const apiKey = localStorage.getItem('muapi_key');
        if (!apiKey) {
            AuthModal(() => generateBtn.click());
            return;
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = "SHOOTING...";

        // Compile Prompt — use cinema video prompt for video mode
        const finalPrompt = currentSettings.mode === 'video'
            ? buildCinemaVideoPrompt(
                basePrompt,
                currentSettings.camera,
                currentSettings.lens,
                currentSettings.focal,
                currentSettings.aperture,
                currentSettings.motion
            )
            : buildNanoBananaPrompt(
                basePrompt,
                currentSettings.camera,
                currentSettings.lens,
                currentSettings.focal,
                currentSettings.aperture
            );

        try {
            let res;
            if (currentSettings.mode === 'video') {
                res = await muapi.generateVideo({
                    model: 'veo3-text-to-video', // Default video model
                    prompt: finalPrompt,
                    aspect_ratio: currentSettings.aspect_ratio
                });
            } else {
                res = await muapi.generateImage({
                    model: 'nano-banana-pro',
                    prompt: finalPrompt,
                    aspect_ratio: currentSettings.aspect_ratio,
                    resolution: (resBtn.dataset.value || '1k').toLowerCase(),
                    negative_prompt: "blurry, low quality, distortion, bad composition"
                });
            }

            if (res && res.url) {
                // Save to history
                const historyEntry = {
                    url: res.url,
                    timestamp: Date.now(),
                    type: currentSettings.mode,
                    settings: {
                        prompt: basePrompt,
                        ...currentSettings,
                        resolution: resBtn.dataset.value
                    }
                };
                addToHistory(historyEntry);
                lastGeneratedEntry = historyEntry;

                showCanvas(res.url);
            } else {
                throw new Error('No Data');
            }

        } catch (e) {
            console.error(e);
            alert('Generation Failed: ' + e.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `GENERATE ✨`;
        }
    };

    // ==========================================
    // REMIX LOGIC (From Global State/Storage)
    // ==========================================
    setTimeout(() => {
        const remixData = localStorage.getItem('remixData');
        if (remixData) {
            try {
                const data = JSON.parse(remixData);
                console.log('Remixing:', data);
                if (data.prompt) {
                    textarea.value = data.prompt;
                    // Trigger input event to resize
                    textarea.dispatchEvent(new Event('input'));
                }
                if (data.settings) {
                    if (data.settings.camera) currentSettings.camera = data.settings.camera;
                    if (data.settings.lens) currentSettings.lens = data.settings.lens;
                    // update UI
                    if (typeof updateSummaryCard === 'function') updateSummaryCard();
                    if (typeof updateMotionSliders === 'function') updateMotionSliders();
                }
                // Clear it
                localStorage.removeItem('remixData');
            } catch (e) {
                console.error('Error parsing remix data', e);
            }
        }
    }, 100);

    return container;
}
