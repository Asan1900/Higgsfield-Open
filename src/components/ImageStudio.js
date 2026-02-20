import { muapi } from '../lib/muapi.js';
import { t2iModels, getAspectRatiosForModel } from '../lib/models.js';
import { AuthModal } from './AuthModal.js';
import { toast } from '../lib/Toast.js';

export function ImageStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

    // Ambient mesh + grid
    const ambientLayer = document.createElement('div');
    ambientLayer.className = 'pointer-events-none absolute inset-0 overflow-hidden';
    ambientLayer.innerHTML = `
        <div class="absolute -left-32 -top-32 w-80 h-80 bg-primary/10 blur-3xl rounded-full"></div>
        <div class="absolute -right-24 top-10 w-64 h-64 bg-cyan-400/10 blur-3xl rounded-full"></div>
        <div class="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4)_1px,_transparent_0)] bg-[length:24px_24px]"></div>
    `;
    container.appendChild(ambientLayer);

    // --- State ---
    const defaultModel = t2iModels[0];
    let selectedModel = defaultModel.id;
    let selectedModelName = defaultModel.name;
    let selectedAr = '1:1';
    let dropdownOpen = null;

    // Helper: Get valid resolutions/quality options for a model
    const getResolutionsForModel = (modelId) => {
        const model = t2iModels.find(m => m.id === modelId);
        if (!model) return ['1K']; // Default

        // Check for specific resolution enum
        if (model.inputs?.resolution?.enum) {
            return model.inputs.resolution.enum.map(r => r.toUpperCase());
        }

        // Check for megapixels enum
        if (model.inputs?.megapixels?.enum) {
            return model.inputs.megapixels.enum;
        }

        // Fallback logic based on common models
        if (modelId.includes('flux')) return ['1K']; // Flux usually fixed
        if (modelId.includes('midjourney')) return ['1K'];

        // Default set for others if not specified
        return ['1K', '2K', '4K'];
    };

    // ==========================================
    // 1. HERO SECTION
    // ==========================================
    const hero = document.createElement('div');
    hero.className = 'flex flex-col items-center mb-10 md:mb-20 animate-fade-in-up transition-all duration-700';
    hero.innerHTML = `
        <div class="mb-10 relative group">
             <div class="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-1000"></div>
             <div class="relative w-24 h-24 md:w-32 md:h-32 bg-teal-900/40 rounded-3xl flex items-center justify-center border border-white/5 overflow-hidden">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-primary opacity-20 absolute -right-4 -bottom-4">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
                <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-glow relative z-10">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-primary">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                </div>
                <!-- Sparkles -->
                <div class="absolute top-4 right-4 text-primary animate-pulse">✨</div>
             </div>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-7xl font-black text-white tracking-widest uppercase mb-4 selection:bg-primary selection:text-black text-center px-4">Nano Banana Pro</h1>
        <p class="text-secondary text-sm font-medium tracking-wide opacity-60">Create stunning, high-aesthetic images in seconds</p>
    `;
    container.appendChild(hero);

    // ==========================================
    // 2. PROMPT BAR (Tailwind Refactor)
    // ==========================================
    const promptWrapper = document.createElement('div');
    promptWrapper.className = 'w-full max-w-4xl relative z-50 animate-fade-in-up';
    promptWrapper.style.animationDelay = '0.2s';

    const bar = document.createElement('div');
    bar.className = 'w-full bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-5 flex flex-col gap-3 md:gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300';

    // Top Row: Input
    const topRow = document.createElement('div');
    topRow.className = 'flex items-start gap-5 px-2';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Describe the scene you imagine';
    textarea.className = 'flex-1 bg-transparent border-none text-white text-base md:text-xl placeholder:text-muted focus:outline-none resize-none pt-2.5 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar';
    textarea.rows = 1;
    textarea.oninput = () => {
        textarea.style.height = 'auto';
        const maxHeight = window.innerWidth < 768 ? 150 : 250;
        textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    };

    topRow.appendChild(textarea);
    bar.appendChild(topRow);

    // Bottom Row: Controls
    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-2 pt-4 border-t border-white/5';

    const controlsLeft = document.createElement('div');
    controlsLeft.className = 'flex items-center gap-1.5 md:gap-2.5 relative overflow-x-auto no-scrollbar pb-1 md:pb-0';

    const createControlBtn = (icon, label, id) => {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = 'flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all border border-white/5 group whitespace-nowrap';
        btn.innerHTML = `
            ${icon}
            <span id="${id}-label" class="text-xs font-bold text-white group-hover:text-primary transition-colors">${label}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" class="opacity-20 group-hover:opacity-100 transition-opacity"><path d="M6 9l6 6 6-6"/></svg>
        `;
        return btn;
    };

    const modelBtn = createControlBtn(`
        <div class="w-5 h-5 bg-primary rounded-md flex items-center justify-center shadow-lg shadow-primary/20">
            <span class="text-[10px] font-black text-black">G</span>
        </div>
    `, selectedModelName, 'model-btn');

    const arBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
    `, selectedAr, 'ar-btn');

    const qualityBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"/></svg>
    `, '1K', 'quality-btn');

    controlsLeft.appendChild(modelBtn);
    controlsLeft.appendChild(arBtn);
    controlsLeft.appendChild(qualityBtn);

    // Initial Resolution Visibility
    const initialModel = t2iModels[0];
    const hasInitialRes = initialModel?.inputs?.resolution?.enum || initialModel?.inputs?.megapixels?.enum;
    qualityBtn.style.display = hasInitialRes ? 'flex' : 'none';

    const generateBtn = document.createElement('button');
    generateBtn.className = 'px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-base transition-all flex items-center justify-center gap-2.5 w-full sm:w-auto shadow-[0_10px_40px_rgba(0,0,0,0.35)] bg-gradient-to-r from-primary via-amber-300 to-lime-300 text-black hover:scale-105 active:scale-95 hover:shadow-[0_15px_45px_rgba(0,0,0,0.45)]';
    generateBtn.innerHTML = `Generate ✨`;

    // Focus effects
    textarea.addEventListener('focus', () => {
        bar.classList.add('shadow-glow', 'border-primary/50');
        bar.classList.remove('border-white/10');
    });

    textarea.addEventListener('blur', () => {
        bar.classList.remove('shadow-glow', 'border-primary/50');
        bar.classList.add('border-white/10');
    });

    bottomRow.appendChild(controlsLeft);
    bottomRow.appendChild(generateBtn);
    bar.appendChild(bottomRow);
    promptWrapper.appendChild(bar);
    container.appendChild(promptWrapper);

    // ==========================================
    // 3. DROPDOWNS (Refactored Helper)
    // ==========================================
    const dropdown = document.createElement('div');
    dropdown.className = 'absolute bottom-[102%] left-2 z-50 transition-all opacity-0 pointer-events-none scale-95 origin-bottom-left glass rounded-3xl p-3 translate-y-2 w-[calc(100vw-3rem)] max-w-xs shadow-4xl border border-white/10 flex flex-col';

    const toggleDropdown = (type, btn) => {
        if (dropdownOpen === type) {
            closeDropdown();
        } else {
            dropdownOpen = type;
            renderDropdownContent(type);

            const btnRect = btn.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            dropdown.classList.remove('opacity-0', 'pointer-events-none');
            dropdown.classList.add('opacity-100', 'pointer-events-auto');

            if (window.innerWidth < 768) {
                dropdown.style.left = '50%';
                dropdown.style.transform = 'translateX(-50%) translate(0, 8px)';
            } else {
                dropdown.style.left = `${btnRect.left - containerRect.left}px`;
                dropdown.style.transform = 'translate(0, 8px)';
            }
            dropdown.style.bottom = `${containerRect.bottom - btnRect.top + 8}px`;
        }
    };

    const closeDropdown = () => {
        dropdown.classList.add('opacity-0', 'pointer-events-none');
        dropdown.classList.remove('opacity-100', 'pointer-events-auto');
        dropdownOpen = null;
    };

    const renderDropdownContent = (type) => {
        dropdown.innerHTML = '';
        dropdown.className = 'absolute bottom-[102%] left-2 z-50 transition-all opacity-0 pointer-events-none scale-95 origin-bottom-left glass rounded-3xl p-3 translate-y-2 border border-white/10 flex flex-col shadow-4xl';

        if (type === 'model') {
            dropdown.classList.add('w-[calc(100vw-3rem)]', 'max-w-xs');
            dropdown.innerHTML = `
                <div class="flex flex-col h-full max-h-[70vh]">
                    <div class="px-2 pb-3 mb-2 border-b border-white/5 shrink-0">
                         <div class="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-primary/50 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-muted"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                            <input type="text" id="model-search" placeholder="Search models..." class="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 outline-none">
                        </div>
                    </div>
                    <div class="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 shrink-0">Available models</div>
                    <div id="model-list-container" class="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2"></div>
                </div>
            `;

            const list = dropdown.querySelector('#model-list-container');
            const renderModels = (filter = '') => {
                list.innerHTML = '';
                const filtered = t2iModels.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()) || m.id.toLowerCase().includes(filter.toLowerCase()));

                filtered.forEach(m => {
                    const el = document.createElement('div');
                    el.className = `flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedModel === m.id ? 'bg-white/5 border-white/5' : ''}`;
                    el.innerHTML = `
                        <div class="flex items-center gap-3.5">
                             <div class="w-10 h-10 ${m.id.includes('flux') ? 'bg-blue-500/10 text-blue-400' : 'bg-primary/10 text-primary'} border border-white/5 rounded-xl flex items-center justify-center font-black text-sm shadow-inner uppercase">${m.name.charAt(0)}</div>
                             <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-white tracking-tight">${m.name}</span>
                             </div>
                        </div>
                        ${selectedModel === m.id ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                    `;
                    el.onclick = (e) => {
                        e.stopPropagation();
                        selectModel(m);
                        closeDropdown();
                    };
                    list.appendChild(el);
                });
            };
            renderModels();

            const searchInput = dropdown.querySelector('#model-search');
            searchInput.onclick = (e) => e.stopPropagation();
            searchInput.oninput = (e) => renderModels(e.target.value);

        } else if (type === 'ar') {
            dropdown.classList.add('max-w-[240px]');
            dropdown.innerHTML = `<div class="text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Aspect Ratio</div>`;
            const list = document.createElement('div');
            list.className = 'flex flex-col gap-1';

            getAspectRatiosForModel(selectedModel).forEach(r => {
                const el = document.createElement('div');
                el.className = `flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group ${selectedAr === r ? 'bg-white/5' : ''}`;
                el.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-6 h-6 border-2 border-white/20 rounded-md shadow-inner flex items-center justify-center group-hover:border-primary/50 transition-colors">
                             <div class="w-3 h-3 bg-white/10 rounded-sm"></div>
                        </div>
                        <span class="text-xs font-bold text-white opacity-80 group-hover:opacity-100 transition-opacity">${r}</span>
                    </div>
                    ${selectedAr === r ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                `;
                el.onclick = (e) => {
                    e.stopPropagation();
                    selectedAr = r;
                    document.getElementById('ar-btn-label').textContent = r;
                    closeDropdown();
                };
                list.appendChild(el);
            });
            dropdown.appendChild(list);

        } else if (type === 'quality') {
            dropdown.classList.add('max-w-[200px]');
            dropdown.innerHTML = `<div class="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Resolution</div>`;
            const list = document.createElement('div');
            list.className = 'flex flex-col gap-1';

            getResolutionsForModel(selectedModel).forEach(opt => {
                const el = document.createElement('div');
                el.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group';
                el.innerHTML = `
                    <span class="text-xs font-bold text-white opacity-80 group-hover:opacity-100">${opt}</span>
                    ${document.getElementById('quality-btn-label').textContent === opt ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                `;
                el.onclick = (e) => {
                    e.stopPropagation();
                    document.getElementById('quality-btn-label').textContent = opt;
                    closeDropdown();
                };
                list.appendChild(el);
            });
            dropdown.appendChild(list);
        }
    };

    const selectModel = (m) => {
        selectedModel = m.id;
        selectedModelName = m.name;
        document.getElementById('model-btn-label').textContent = selectedModelName;

        const availableArs = getAspectRatiosForModel(selectedModel);
        selectedAr = availableArs[0];
        document.getElementById('ar-btn-label').textContent = selectedAr;

        const hasQuality = m.inputs?.resolution?.enum || m.inputs?.megapixels?.enum;
        qualityBtn.style.display = hasQuality ? 'flex' : 'none';

        if (hasQuality) {
            const validResolutions = getResolutionsForModel(selectedModel);
            const currentRes = document.getElementById('quality-btn-label').textContent;
            if (!validResolutions.includes(currentRes)) {
                document.getElementById('quality-btn-label').textContent = validResolutions[0];
            }
        }
    };

    modelBtn.onclick = (e) => { e.stopPropagation(); toggleDropdown('model', modelBtn); };
    arBtn.onclick = (e) => { e.stopPropagation(); toggleDropdown('ar', arBtn); };
    qualityBtn.onclick = (e) => { e.stopPropagation(); toggleDropdown('quality', qualityBtn); };

    window.onclick = () => closeDropdown();
    container.appendChild(dropdown);

    // ==========================================
    // 4. CANVAS AREA + HISTORY
    // ==========================================
    const generationHistory = [];

    const historySidebar = document.createElement('div');
    historySidebar.className = 'fixed right-0 top-0 h-full w-20 md:w-24 bg-black/60 backdrop-blur-xl border-l border-white/5 z-50 flex flex-col items-center py-4 gap-3 overflow-y-auto custom-scrollbar transition-all duration-500 translate-x-full opacity-0';
    historySidebar.id = 'history-sidebar';

    const historyHeader = document.createElement('div');
    historyHeader.className = 'flex flex-col items-center mb-2';

    const historyLabel = document.createElement('div');

    historyLabel.className = 'text-[9px] font-bold text-muted uppercase tracking-widest rotate-0';
    historyLabel.className = 'text-[9px] font-bold text-muted uppercase tracking-widest mb-2';
    historyLabel.textContent = 'History';

    const clearHistoryBtn = document.createElement('button');
    clearHistoryBtn.className = 'text-[8px] font-black text-primary/40 hover:text-primary uppercase tracking-tighter mt-1 transition-colors';
    clearHistoryBtn.textContent = 'Clear All';
    clearHistoryBtn.onclick = () => {
        if (confirm('Clear all generation history?')) {
            generationHistory.length = 0;
            localStorage.removeItem('muapi_history');
            renderHistory();
            historySidebar.classList.add('translate-x-full', 'opacity-0');
            historySidebar.classList.remove('translate-x-0', 'opacity-100');
        }
    };

    historyHeader.appendChild(historyLabel);
    historyHeader.appendChild(clearHistoryBtn);
    historySidebar.appendChild(historyHeader);

    const historyList = document.createElement('div');
    historyList.className = 'flex flex-col gap-2 w-full px-2';
    historySidebar.appendChild(historyList);

    container.appendChild(historySidebar);

    const canvas = document.createElement('div');
    canvas.className = 'absolute inset-0 flex flex-col items-center justify-center p-4 min-[800px]:p-16 z-10 opacity-0 pointer-events-none transition-all duration-1000 translate-y-10 scale-95';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative group';

    const resultImg = document.createElement('img');
    resultImg.className = 'max-h-[60vh] max-w-[80vw] rounded-3xl shadow-3xl border border-white/10 interactive-glow object-contain';
    imageContainer.appendChild(resultImg);

    const canvasControls = document.createElement('div');
    canvasControls.className = 'mt-6 flex gap-3 opacity-0 transition-opacity delay-500 duration-500 justify-center';

    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white';
    regenerateBtn.textContent = '↻ Regenerate';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'bg-primary text-black px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-glow active:scale-95';
    downloadBtn.textContent = '↓ Download';

    const newPromptBtn = document.createElement('button');
    newPromptBtn.className = 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white';
    newPromptBtn.textContent = '+ New';

    const copyPromptBtn = document.createElement('button');
    copyPromptBtn.className = 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white';
    copyPromptBtn.textContent = '📋 Copy Prompt';
    copyPromptBtn.onclick = async () => {
        const current = resultImg.src;
        const entry = generationHistory.find(e => e.url === current);
        if (entry && entry.prompt) {
            try {
                await navigator.clipboard.writeText(entry.prompt);
                const originalText = copyPromptBtn.textContent;
                copyPromptBtn.textContent = '✓ Copied!';
                copyPromptBtn.classList.add('text-primary');
                setTimeout(() => {
                    copyPromptBtn.textContent = originalText;
                    copyPromptBtn.classList.remove('text-primary');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy prompt', err);
            }
        }
    };

    canvasControls.appendChild(regenerateBtn);
    canvasControls.appendChild(copyPromptBtn);
    canvasControls.appendChild(downloadBtn);
    canvasControls.appendChild(newPromptBtn);

    canvas.appendChild(imageContainer);
    canvas.appendChild(canvasControls);
    container.appendChild(canvas);

    const showImageInCanvas = (imageUrl) => {
        hero.classList.add('hidden');
        promptWrapper.classList.add('hidden');

        resultImg.src = imageUrl;
        resultImg.onload = () => {
            canvas.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
            canvas.classList.add('opacity-100', 'translate-y-0', 'scale-100');
            canvasControls.classList.remove('opacity-0');
            canvasControls.classList.add('opacity-100');
        };
    };

    const addToHistory = (entry) => {
        generationHistory.unshift(entry);
        localStorage.setItem('muapi_history', JSON.stringify(generationHistory.slice(0, 50)));

        historySidebar.classList.remove('translate-x-full', 'opacity-0');
        historySidebar.classList.add('translate-x-0', 'opacity-100');

        renderHistory();
    };

    const renderHistory = () => {
        historyList.innerHTML = '';
        generationHistory.forEach((entry, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `relative group/thumb cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${idx === 0 ? 'border-primary shadow-glow' : 'border-white/10 hover:border-white/30'}`;

            thumb.innerHTML = `
                <img src="${entry.url}" alt="${entry.prompt?.substring(0, 30) || 'Generated'}" class="w-full aspect-square object-cover">
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div class="flex gap-1">
                        <button class="hist-copy p-1.5 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all" title="Copy Prompt">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        </button>
                        <button class="hist-remix p-1.5 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all" title="Remix">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                        </button>
                    </div>
                    <button class="hist-download p-1.5 bg-primary rounded-lg text-black hover:scale-110 transition-transform" title="Download">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </button>
                </div>
            `;

            thumb.onclick = (e) => {
                if (e.target.closest('.hist-download')) {
                    downloadImage(entry.url, `muapi-${entry.id || idx}.jpg`);
                    return;
                }
                if (e.target.closest('.hist-copy')) {
                    navigator.clipboard.writeText(entry.prompt);
                    toast.success('Prompt copied to clipboard');
                    return;
                }
                if (e.target.closest('.hist-remix')) {
                    textarea.value = entry.prompt;
                    textarea.focus();
                    textarea.dispatchEvent(new Event('input'));
                    toast.info('Prompt loaded for remix');
                    return;
                }
                showImageInCanvas(entry.url);
                historyList.querySelectorAll('div').forEach(t => {
                    t.classList.remove('border-primary', 'shadow-glow');
                    t.classList.add('border-white/10');
                });
                thumb.classList.remove('border-white/10');
                thumb.classList.add('border-primary', 'shadow-glow');
            };

            historyList.appendChild(thumb);
        });
    };

    const downloadImage = async (url, filename) => {
        try {
            toast.info('Starting download...');
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            toast.success('Image downloaded successfully');
        } catch (err) {
            window.open(url, '_blank');
            toast.error('Direct download failed. Opened in new tab.');
        }
    };

    try {
        const saved = JSON.parse(localStorage.getItem('muapi_history') || '[]');
        if (saved.length > 0) {
            saved.forEach(e => generationHistory.push(e));
            historySidebar.classList.remove('translate-x-full', 'opacity-0');
            historySidebar.classList.add('translate-x-0', 'opacity-100');
            renderHistory();
        }
    } catch (e) { /* ignore */ }

    downloadBtn.onclick = () => {
        const current = resultImg.src;
        if (current) {
            const entry = generationHistory.find(e => e.url === current);
            downloadImage(current, `muapi-${entry?.id || 'image'}.jpg`);
        }
    };

    regenerateBtn.onclick = () => {
        generateBtn.click();
    };

    newPromptBtn.onclick = () => {
        canvas.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
        canvas.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
        canvasControls.classList.add('opacity-0');
        canvasControls.classList.remove('opacity-100');
        hero.classList.remove('hidden', 'opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
        promptWrapper.classList.remove('hidden', 'opacity-40');
        textarea.value = '';
        textarea.focus();
    };

    generateBtn.onclick = async () => {
        const prompt = textarea.value.trim();
        if (!prompt) return;

        const apiKey = localStorage.getItem('muapi_key');
        if (!apiKey) {
            AuthModal(() => {
                generateBtn.click();
            });
            return;
        }

        hero.classList.add('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span class="animate-spin inline-block mr-2 text-black">◌</span> Generating...`;
        generateBtn.className += ' opacity-80 cursor-wait';

        try {
            toast.info('Processing your prompt...');
            const res = await muapi.generateImage({
                prompt,
                model: selectedModel,
                aspect_ratio: selectedAr
            });

            if (res && res.url) {
                addToHistory({
                    id: res.id || Date.now().toString(),
                    url: res.url,
                    prompt: prompt,
                    model: selectedModel,
                    aspect_ratio: selectedAr,
                    timestamp: new Date().toISOString()
                });
                showImageInCanvas(res.url);
                toast.success('Generation complete ✨');
            } else {
                throw new Error('No image URL returned by API');
            }
        } catch (e) {
            console.error(e);
            generateBtn.innerHTML = `Error: ${e.message.slice(0, 40)}`;
            toast.error(`Generation failed: ${e.message}`);
            setTimeout(() => {
                generateBtn.innerHTML = `Generate ✨`;
                generateBtn.disabled = false;
                generateBtn.classList.remove('opacity-80', 'cursor-wait');
            }, 3000);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `Generate ✨`;
            generateBtn.classList.remove('opacity-80', 'cursor-wait');
        }
    };

    setTimeout(() => {
        const remixData = localStorage.getItem('remixData');
        if (remixData) {
            try {
                const data = JSON.parse(remixData);
                if (data.prompt) {
                    textarea.value = data.prompt;
                    textarea.dispatchEvent(new Event('input'));
                }
                localStorage.removeItem('remixData');
            } catch (e) {
                console.error('Error parsing remix data', e);
            }
        }
    }, 100);

    return container;
}
