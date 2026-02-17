
import { muapi } from '../lib/muapi.js';

export function PopcornStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center bg-app-bg relative overflow-y-auto custom-scrollbar overflow-x-hidden';

    // --- State ---
    let mode = 'auto'; // 'auto' | 'manual'
    let frameCount = 4;
    let mainPrompt = '';
    let manualPrompts = Array(12).fill('');
    let isGenerating = false;
    let generatedFrames = []; // { url, prompt, id }
    let references = []; // urls

    // --- Hero Section ---
    const hero = document.createElement('div');
    hero.className = 'w-full max-w-6xl mx-auto pt-10 pb-6 px-6 flex flex-col items-center text-center animate-fade-in-up';
    hero.innerHTML = `
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-muted mb-4">
            <span>Open Higgsfield</span>
            <span class="w-1 h-1 rounded-full bg-white/20"></span>
            <span class="text-primary">Popcorn 🍿</span>
        </div>
        <h1 class="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Storyboards <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Reimagined</span>
        </h1>
        <p class="text-secondary max-w-xl text-sm md:text-base leading-relaxed">
            Generate consistent, cinematic visual sequences for your stories. 
            From a single prompt to a full storyboard in seconds.
        </p>
    `;
    container.appendChild(hero);

    // --- Main Content Wrapper ---
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'w-full max-w-6xl mx-auto px-4 md:px-6 pb-20 flex flex-col lg:flex-row gap-8';
    container.appendChild(contentWrapper);

    // --- Left Panel: Controls ---
    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-6';

    // Mode Switcher
    const modeSwitcher = document.createElement('div');
    modeSwitcher.className = 'p-1 bg-white/5 rounded-xl flex border border-white/5';
    ['Auto', 'Manual'].forEach(m => {
        const btn = document.createElement('button');
        const id = m.toLowerCase();
        btn.className = `flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === id ? 'bg-primary text-black shadow-glow' : 'text-white/50 hover:text-white'}`;
        btn.textContent = m + ' Mode';
        btn.onclick = () => setMode(id);
        modeSwitcher.appendChild(btn);
    });
    controlsPanel.appendChild(modeSwitcher);

    // Inputs Container
    const inputsContainer = document.createElement('div');
    inputsContainer.className = 'flex flex-col gap-5 bg-[#111] p-5 rounded-3xl border border-white/5 shadow-2xl';

    // Auto Mode Inputs
    const autoInputs = document.createElement('div');
    autoInputs.className = 'flex flex-col gap-4';
    autoInputs.innerHTML = `
        <div class="flex flex-col gap-2">
            <label class="text-[10px] font-bold text-muted uppercase tracking-widest">Story Prompt</label>
            <textarea id="popcorn-prompt" class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors resize-none h-32" placeholder="A detective investigating a rainy cyberpunk crime scene..."></textarea>
        </div>
        <div class="flex flex-col gap-2">
             <div class="flex justify-between">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest">Frames</label>
                <span id="frame-count-label" class="text-[10px] font-bold text-primary">4</span>
             </div>
            <input type="range" id="frame-slider" min="2" max="8" value="4" class="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer">
        </div>
    `;

    // Manual Mode Inputs
    const manualInputs = document.createElement('div');
    manualInputs.className = 'flex flex-col gap-3 hidden';
    manualInputs.innerHTML = `
        <label class="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Shot List</label>
        <div id="manual-shots-list" class="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            <!-- Dynamic Inputs -->
        </div>
        <button id="add-shot-btn" class="text-xs font-bold text-primary hover:text-white transition-colors py-2 border border-dashed border-white/10 rounded-xl hover:bg-white/5">+ Add Shot</button>
    `;

    inputsContainer.appendChild(autoInputs);
    inputsContainer.appendChild(manualInputs);

    // References Section
    const refSection = document.createElement('div');
    refSection.className = 'border-t border-white/5 pt-4 flex flex-col gap-3';
    refSection.innerHTML = `
        <label class="text-[10px] font-bold text-muted uppercase tracking-widest">Visual References (Optional)</label>
        <div class="grid grid-cols-4 gap-2" id="ref-grid">
            <button class="aspect-square rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/20 hover:text-primary hover:border-primary hover:bg-white/5 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
        </div>
    `;
    inputsContainer.appendChild(refSection);

    // Generate Button
    const generateBtn = document.createElement('button');
    generateBtn.className = 'w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    generateBtn.textContent = 'Action! 🎬';
    inputsContainer.appendChild(generateBtn);

    controlsPanel.appendChild(inputsContainer);
    contentWrapper.appendChild(controlsPanel);

    // --- Right Panel: Storyboard Display ---
    const resultsPanel = document.createElement('div');
    resultsPanel.className = 'flex-1 min-h-[500px] bg-[#0a0a0a] rounded-3xl border border-white/5 relative overflow-hidden';

    const emptyState = document.createElement('div');
    emptyState.className = 'absolute inset-0 flex flex-col items-center justify-center text-white/20 pointer-events-none p-10 text-center';
    emptyState.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mb-4"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
        <p class="text-sm font-medium">Your storyboard will appear here</p>
    `;
    resultsPanel.appendChild(emptyState);

    const storyboardGrid = document.createElement('div');
    storyboardGrid.className = 'absolute inset-0 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar opacity-0 transition-opacity duration-500';
    resultsPanel.appendChild(storyboardGrid);

    contentWrapper.appendChild(resultsPanel);

    // --- Logic Implementation ---

    // Mode Switching
    const setMode = (newMode) => {
        mode = newMode;
        // Update Buttons
        Array.from(modeSwitcher.children).forEach(btn => {
            const isActive = btn.textContent.toLowerCase().includes(mode);
            btn.className = `flex-1 py-2 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-primary text-black shadow-glow' : 'text-white/50 hover:text-white'}`;
        });

        // Toggle Inputs
        if (mode === 'auto') {
            autoInputs.classList.remove('hidden');
            manualInputs.classList.add('hidden');
        } else {
            autoInputs.classList.add('hidden');
            manualInputs.classList.remove('hidden');
            renderManualInputs();
        }
    };

    // Auto Mode Listeners
    const promptInput = autoInputs.querySelector('#popcorn-prompt');
    const slider = autoInputs.querySelector('#frame-slider');
    const label = autoInputs.querySelector('#frame-count-label');

    promptInput.oninput = (e) => mainPrompt = e.target.value;
    slider.oninput = (e) => {
        frameCount = parseInt(e.target.value);
        label.textContent = frameCount;
        if (mode === 'manual') renderManualInputs();
    };

    // Manual Mode Logic
    const renderManualInputs = () => {
        const list = manualInputs.querySelector('#manual-shots-list');
        list.innerHTML = '';

        // Ensure array size matches frameCount (or just use 12 for manual list, let user add?)
        // Let's rely on User adding shots or defaulting to Slider value to init.
        // Actually, let's sync slider with manual list size if possible, or just let user add.
        // Simple approach: Render N inputs based on slider for now to start.

        for (let i = 0; i < frameCount; i++) {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 animate-fade-in-up';
            row.style.animationDelay = `${i * 0.05}s`;
            row.innerHTML = `
                <span class="text-[10px] font-bold text-white/30 w-4">${i + 1}</span>
                <input type="text" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 focus:outline-none" 
                    placeholder="Shot description..." value="${manualPrompts[i] || ''}">
            `;
            const input = row.querySelector('input');
            input.oninput = (e) => manualPrompts[i] = e.target.value;
            list.appendChild(row);
        }
    };

    manualInputs.querySelector('#add-shot-btn').onclick = () => {
        if (frameCount < 12) {
            frameCount++;
            slider.value = frameCount;
            label.textContent = frameCount;
            renderManualInputs();
        }
    };

    // Generation Logic
    generateBtn.onclick = async () => {
        if (isGenerating) return;

        const promptsTorun = [];

        if (mode === 'auto') {
            if (!mainPrompt.trim()) return;
            // Simulate "Director" Agent splitting prompt
            // In a real app, this would call an LLM. 
            // Here we'll just create simple variations or repeat for demo purposes
            // Or ideally, we append simplistic camera angles.

            const shots = [
                "Wide shot, establishing the scene",
                "Medium shot, main character focus",
                "Close up, detail or emotion",
                "Over the shoulder view",
                "Low angle, dramatic perspective",
                "High angle, overview",
                "Action shot, dynamic motion",
                "Final wide shot, fading out"
            ];

            for (let i = 0; i < frameCount; i++) {
                promptsTorun.push(`${mainPrompt}, ${shots[i % shots.length]}, cinematic lighting, consistent style`);
            }
        } else {
            // Manual
            for (let i = 0; i < frameCount; i++) {
                if (manualPrompts[i] && manualPrompts[i].trim()) {
                    promptsTorun.push(manualPrompts[i]);
                }
            }
            if (promptsTorun.length === 0) return;
        }

        // Start Generation UI
        isGenerating = true;
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="animate-spin inline-block mr-2">◌</span> Filming...';

        emptyState.classList.add('opacity-0');
        storyboardGrid.classList.remove('opacity-0');
        storyboardGrid.innerHTML = '';

        // Create skeletons
        promptsTorun.forEach((_, idx) => {
            const card = document.createElement('div');
            card.id = `frame-${idx}`;
            card.className = 'aspect-video bg-white/5 rounded-xl border border-white/10 flex flex-col overflow-hidden relative group';
            card.innerHTML = `
                <div class="flex-1 flex items-center justify-center relative">
                    <div class="absolute inset-0 skeleton-pulse bg-white/5"></div>
                    <span class="relative z-10 text-xs font-bold text-white/30">Shot ${idx + 1}</span>
                </div>
                <div class="p-3 bg-[#0e0e0e] border-t border-white/5">
                    <p class="text-[10px] text-white/50 line-clamp-1">${promptsTorun[idx]}</p>
                </div>
            `;
            storyboardGrid.appendChild(card);
        });

        // Parallel-ish Generation (One by one for visual effect)
        try {
            for (let i = 0; i < promptsTorun.length; i++) {
                const el = document.getElementById(`frame-${i}`);
                const prompt = promptsTorun[i];

                // Call API
                const res = await muapi.generateImage({
                    prompt: prompt,
                    model: 'flux-schnell', // Fast model for storyboard
                    aspect_ratio: '16:9'
                });

                if (res && res.url) {
                    const img = new Image();
                    img.src = res.url;
                    img.className = 'absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0';
                    img.onload = () => img.classList.remove('opacity-0');

                    const container = el.querySelector('.flex-1');
                    container.innerHTML = ''; // clear skeleton
                    container.appendChild(img);

                    // Add download/expand buttonsOverlay
                    const overlay = document.createElement('div');
                    overlay.className = 'absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2';
                    overlay.innerHTML = `
                        <button class="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></button>
                    `;
                    container.appendChild(overlay);
                }
            }
        } catch (e) {
            console.error(e);
            generateBtn.innerHTML = `<span class="text-red-400">Error: Failed to film</span>`;
        } finally {
            if (!generateBtn.innerHTML.includes('Error')) {
                generateBtn.textContent = 'Action! 🎬';
            } else {
                setTimeout(() => {
                    generateBtn.disabled = false;
                    generateBtn.textContent = 'Action! 🎬';
                }, 3000);
                return; // early return to skip immediate enable
            }
            isGenerating = false;
            generateBtn.disabled = false;
        }
    };

    // Init
    setMode('auto');

    return container;
}
