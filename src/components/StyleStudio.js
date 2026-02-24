import { muapi } from '../lib/muapi.js';

/**
 * StyleStudio — Unified style transfer and mixing tool.
 * Upload a source and 1 style (Look Transfer) or 2 styles (Style Mix).
 * Uses flux-redux.
 */
export function StyleStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';
    let isGenerating = false;
    let currentSource = null;
    let currentStyle1 = null;
    let currentStyle2 = null;

    container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Sidebar: Controls -->
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg font-black text-indigo-400">🎨</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Style Studio</h1>
              <p class="text-[11px] text-secondary">Transfer & Mix Styles · flux-redux</p>
            </div>
          </div>
        </div>

        <!-- Mode Toggle -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Mode</label>
          <div class="flex gap-2">
            <button id="ss-mode-transfer" class="flex-1 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all bg-indigo-500/20 border-indigo-400/40 text-indigo-400">
              Look Transfer (1 Style)
            </button>
            <button id="ss-mode-mix" class="flex-1 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all bg-white/5 border-white/10 text-secondary hover:bg-white/10">
              Style Mix (2 Styles)
            </button>
          </div>
        </div>

        <!-- Inputs Section -->
        <div class="p-6 border-b border-white/5 space-y-4">
          
          <!-- Source Image (Only for Look Transfer) -->
          <div id="ss-source-container" class="space-y-2">
            <label class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">1. Main Subject / Source</label>
            <div id="ss-source-upload" class="w-full aspect-[4/3] border-2 border-dashed border-white/10 rounded-2xl flex flex-col flex-wrap items-center justify-center gap-2 hover:border-indigo-400/50 hover:bg-indigo-400/5 transition-all cursor-pointer relative overflow-hidden group p-4">
              <span class="text-2xl opacity-50">🖼️</span>
              <span class="text-[10px] font-bold text-secondary text-center">Click or drag source image</span>
              <img id="ss-source-preview" class="absolute inset-0 w-full h-full object-cover hidden" />
              <input type="file" id="ss-source-file" class="hidden" accept="image/*" />
            </div>
          </div>

          <!-- Style 1 -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.2em]">2. Style Reference 1</label>
            <div id="ss-style1-upload" class="w-full h-24 border-2 border-dashed border-white/10 rounded-2xl flex flex-col flex-wrap items-center justify-center gap-2 hover:border-fuchsia-400/50 hover:bg-fuchsia-400/5 transition-all cursor-pointer relative overflow-hidden group">
              <span class="text-lg opacity-50">✨</span>
              <span class="text-[10px] font-bold text-secondary text-center">Style Reference 1</span>
              <img id="ss-style1-preview" class="absolute inset-0 w-full h-full object-cover hidden" />
              <input type="file" id="ss-style1-file" class="hidden" accept="image/*" />
            </div>
          </div>

          <!-- Style 2 (Only for Style Mix) -->
          <div id="ss-style2-container" class="space-y-2 hidden">
            <label class="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">3. Style Reference 2</label>
            <div id="ss-style2-upload" class="w-full h-24 border-2 border-dashed border-white/10 rounded-2xl flex flex-col flex-wrap items-center justify-center gap-2 hover:border-rose-400/50 hover:bg-rose-400/5 transition-all cursor-pointer relative overflow-hidden group">
              <span class="text-lg opacity-50">✨</span>
              <span class="text-[10px] font-bold text-secondary text-center">Style Reference 2</span>
              <img id="ss-style2-preview" class="absolute inset-0 w-full h-full object-cover hidden" />
              <input type="file" id="ss-style2-file" class="hidden" accept="image/*" />
            </div>
          </div>

        </div>

        <!-- Controls -->
        <div class="p-6 border-b border-white/5 space-y-4">
          <div id="ss-strength-control" class="space-y-2">
            <div class="flex justify-between">
              <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Style Intensity</label>
              <span id="ss-intensity-val" class="text-[10px] font-bold text-indigo-400">80%</span>
            </div>
            <input type="range" id="ss-intensity" min="10" max="100" value="80" class="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div id="ss-blend-control" class="space-y-2 hidden">
            <div class="flex justify-between">
              <label class="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.1em]">Style 1</label>
              <label class="text-[10px] font-black text-rose-400 uppercase tracking-[0.1em]">Style 2</label>
            </div>
            <input type="range" id="ss-blend-ratio" min="0" max="100" value="50" class="w-full accent-white bg-gradient-to-r from-fuchsia-500 to-rose-500 h-1.5 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div class="space-y-2">
            <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Description (Optional)</label>
            <textarea id="ss-prompt" rows="2" placeholder="Help the AI understand what to generate..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-indigo-400/50 custom-scrollbar"></textarea>
          </div>
        </div>

        <div class="p-6 mt-auto">
          <button id="ss-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20">
            Generate Style
          </button>
        </div>
      </div>

      <!-- Right Area: Preview -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_60%)]">
        <div id="ss-output-placeholder" class="flex flex-col items-center gap-6 animate-fade-in w-full max-w-sm text-center">
          <div class="text-6xl opacity-20">🎨</div>
          <p class="text-secondary text-sm" id="ss-help-text">Upload a source image and a style reference to apply its look and feel.</p>
        </div>
        
        <div id="ss-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Processing Styles...</p>
        </div>

        <div id="ss-result" class="hidden max-w-3xl w-full flex flex-col items-center gap-4">
          <div class="relative group rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-500/10">
            <img id="ss-result-img" class="w-full object-contain max-h-[70vh]" />
          </div>
          <div class="flex gap-3 justify-center">
            <button id="ss-download" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download result</button>
            <button id="ss-retry" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 Adjust Controls</button>
          </div>
        </div>
      </div>
    </div>
  `;

    requestAnimationFrame(() => {
        let mode = 'transfer'; // 'transfer' or 'mix'

        const modeTransferBtn = container.querySelector('#ss-mode-transfer');
        const modeMixBtn = container.querySelector('#ss-mode-mix');

        const sourceContainer = container.querySelector('#ss-source-container');
        const style2Container = container.querySelector('#ss-style2-container');
        const blendControl = container.querySelector('#ss-blend-control');
        const intensityControl = container.querySelector('#ss-strength-control');
        const helpText = container.querySelector('#ss-help-text');

        const toggleMode = (newMode) => {
            mode = newMode;
            if (mode === 'transfer') {
                modeTransferBtn.className = modeTransferBtn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/, 'bg-indigo-500/20 border-indigo-400/40 text-indigo-400');
                modeMixBtn.className = modeMixBtn.className.replace(/bg-indigo-500\/20 border-indigo-400\/40 text-indigo-400/, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10');

                sourceContainer.classList.remove('hidden');
                style2Container.classList.add('hidden');
                blendControl.classList.add('hidden');
                intensityControl.classList.remove('hidden');
                helpText.textContent = "Upload a source image and a style reference to apply its look and feel.";
            } else {
                modeMixBtn.className = modeMixBtn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/, 'bg-indigo-500/20 border-indigo-400/40 text-indigo-400');
                modeTransferBtn.className = modeTransferBtn.className.replace(/bg-indigo-500\/20 border-indigo-400\/40 text-indigo-400/, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10');

                sourceContainer.classList.add('hidden');
                style2Container.classList.remove('hidden');
                blendControl.classList.remove('hidden');
                intensityControl.classList.add('hidden');
                helpText.textContent = "Upload two style references to generate a new image blending both styles.";
            }
        };

        modeTransferBtn.addEventListener('click', () => toggleMode('transfer'));
        modeMixBtn.addEventListener('click', () => toggleMode('mix'));

        // Image Upload Handlers
        const setupUpload = (idPrefix, setter) => {
            const uploadArea = container.querySelector(`#${idPrefix}-upload`);
            const fileInput = container.querySelector(`#${idPrefix}-file`);
            const preview = container.querySelector(`#${idPrefix}-preview`);

            const handleFile = (file) => {
                if (!file) return;
                const url = URL.createObjectURL(file);
                setter(url);
                preview.src = url;
                preview.classList.remove('hidden');
            };

            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('border-indigo-400/50'); });
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('border-indigo-400/50'));
            uploadArea.addEventListener('drop', e => {
                e.preventDefault();
                uploadArea.classList.remove('border-indigo-400/50');
                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            });
            fileInput.addEventListener('change', e => handleFile(e.target.files[0]));
        };

        setupUpload('ss-source', v => currentSource = v);
        setupUpload('ss-style1', v => currentStyle1 = v);
        setupUpload('ss-style2', v => currentStyle2 = v);

        const intensitySlider = container.querySelector('#ss-intensity');
        const intensityVal = container.querySelector('#ss-intensity-val');
        intensitySlider.addEventListener('input', e => intensityVal.textContent = `${e.target.value}%`);

        const generateBtn = container.querySelector('#ss-generate-btn');
        const outputPlac = container.querySelector('#ss-output-placeholder');
        const loadingEl = container.querySelector('#ss-loading');
        const resultEl = container.querySelector('#ss-result');
        const resultImg = container.querySelector('#ss-result-img');

        generateBtn.addEventListener('click', async () => {
            if (isGenerating) return;
            if (mode === 'transfer' && (!currentSource || !currentStyle1)) { alert('Please upload both a Source and Style 1.'); return; }
            if (mode === 'mix' && (!currentStyle1 || !currentStyle2)) { alert('Please upload both Style 1 and Style 2.'); return; }

            isGenerating = true; generateBtn.disabled = true;
            outputPlac.classList.add('hidden'); resultEl.classList.add('hidden');
            loadingEl.classList.remove('hidden'); loadingEl.classList.add('flex');

            try {
                let systemPrompt = '';
                if (mode === 'transfer') {
                    systemPrompt = `Apply the artistic style, color palette, and visual mood of the style reference to the main subject. Retain the subject's core forms but transform the aesthetics strictly by the style reference. Strength: ${intensitySlider.value}%`;
                } else {
                    const ratio = container.querySelector('#ss-blend-ratio').value;
                    systemPrompt = `Create a new image that blends Style 1 (${100 - ratio}%) and Style 2 (${ratio}%). The output should harmoniously merge the textures, palettes, and visual treatments of both references into a cohesive new concept.`;
                }

                const userPrompt = container.querySelector('#ss-prompt').value.trim();
                const finalPrompt = userPrompt ? `${systemPrompt} Description: ${userPrompt}` : systemPrompt;

                // Note: Using flux-redux as the universal image/style manipulation endpoint
                const result = await muapi.generateImage({
                    model: 'flux-redux',
                    prompt: finalPrompt,
                    image_url: mode === 'transfer' ? currentSource : currentStyle1, // We pass primary image here
                });

                if (result.url) {
                    resultImg.src = result.url;
                    loadingEl.classList.add('hidden');
                    resultEl.classList.remove('hidden');
                }
            } catch (err) {
                loadingEl.classList.add('hidden');
                outputPlac.classList.remove('hidden');
                outputPlac.innerHTML = `<div class="text-red-400 text-sm font-bold bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">⚠ ${err.message || 'Model unreachable'}</div>`;
            } finally {
                isGenerating = false; generateBtn.disabled = false;
            }
        });

        container.querySelector('#ss-download')?.addEventListener('click', () => {
            const a = document.createElement('a'); a.href = resultImg.src;
            a.download = `style_studio_${Date.now()}.png`; a.click();
        });

        container.querySelector('#ss-retry')?.addEventListener('click', () => {
            resultEl.classList.add('hidden');
            outputPlac.classList.remove('hidden');
        });
    });

    return container;
}
