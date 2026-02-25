import { muapi } from '../lib/muapi.js';

/**
 * Persona Studio — Face & Identity Lock using flux-pulid.
 * Upload a reference photo, write a scenario prompt, and generate 
 * the same person in any scene while preserving their likeness.
 */
export function PersonaStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

    let referenceImageUrl = '';
    let isGenerating = false;

    // --- Layout ---
    container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Panel: Controls -->
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <!-- Header -->
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-sm font-black text-pink-400">ID</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Persona Studio</h1>
              <p class="text-[11px] text-secondary">Face & Identity Lock · flux-pulid</p>
            </div>
          </div>
        </div>

        <!-- Reference Photo Upload -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Reference Photo</label>
          <div id="persona-dropzone" class="relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-primary/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[180px] bg-white/[0.02] hover:bg-white/[0.04]">
            <div class="text-4xl opacity-40 group-hover:opacity-80 transition-opacity">📸</div>
            <p class="text-xs text-secondary text-center">Drop a face photo here or <span class="text-primary font-bold">click to upload</span></p>
            <p class="text-[10px] text-muted">Best: Clear, front-facing portrait</p>
            <input type="file" id="persona-file-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div id="persona-preview" class="hidden relative rounded-2xl overflow-hidden border border-white/10">
            <img id="persona-preview-img" class="w-full h-48 object-cover" />
            <button id="persona-clear-btn" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white/70 hover:text-red-400 flex items-center justify-center text-sm transition-colors">✕</button>
          </div>
          <input type="text" id="persona-url-input" placeholder="Or paste an image URL..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors" />
        </div>

        <!-- Scenario Prompt -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Scenario Prompt</label>
          <textarea id="persona-prompt" rows="4" placeholder="Describe the scene... e.g. 'Standing on a cliff at sunset wearing a medieval cape, cinematic lighting'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-primary/50 transition-colors custom-scrollbar"></textarea>
        </div>

        <!-- Aspect Ratio -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Aspect Ratio</label>
          <div id="persona-ar-grid" class="grid grid-cols-5 gap-2">
            ${['1:1', '16:9', '9:16', '4:3', '3:4'].map((ar, i) => `
              <button data-ar="${ar}" class="persona-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>
            `).join('')}
          </div>
        </div>

        <!-- Generate Button -->
        <div class="p-6 mt-auto">
          <button id="persona-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-pink-500/20">
            Generate Persona
          </button>
        </div>
      </div>

      <!-- Right Panel: Output -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.05),transparent_60%)]">
        <div id="persona-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">🎭</div>
          <p class="text-secondary text-sm text-center max-w-sm">Upload a reference face and describe a scenario to generate your persona in any setting.</p>
        </div>
        <div id="persona-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Generating Persona...</p>
        </div>
        <div id="persona-result" class="hidden max-w-3xl w-full">
          <img id="persona-result-img" class="w-full rounded-3xl border border-white/10 shadow-2xl shadow-pink-500/10" />
          <div class="flex gap-3 mt-4 justify-center">
            <button id="persona-download-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download</button>
            <button id="persona-remix-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 New Scenario</button>
          </div>
        </div>
      </div>
    </div>
  `;

    // --- Event Wiring ---
    requestAnimationFrame(() => {
        const fileInput = container.querySelector('#persona-file-input');
        const dropzone = container.querySelector('#persona-dropzone');
        const preview = container.querySelector('#persona-preview');
        const previewImg = container.querySelector('#persona-preview-img');
        const clearBtn = container.querySelector('#persona-clear-btn');
        const urlInput = container.querySelector('#persona-url-input');
        const promptInput = container.querySelector('#persona-prompt');
        const generateBtn = container.querySelector('#persona-generate-btn');
        const outputEl = container.querySelector('#persona-output');
        const loadingEl = container.querySelector('#persona-loading');
        const resultEl = container.querySelector('#persona-result');
        const resultImg = container.querySelector('#persona-result-img');
        const downloadBtn = container.querySelector('#persona-download-btn');
        const remixBtn = container.querySelector('#persona-remix-btn');
        const arBtns = container.querySelectorAll('.persona-ar-btn');
        let selectedAR = '1:1';

        // File upload
        const handleFile = (file) => {
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                referenceImageUrl = e.target.result;
                previewImg.src = referenceImageUrl;
                dropzone.classList.add('hidden');
                preview.classList.remove('hidden');
                urlInput.value = '';
            };
            reader.readAsDataURL(file);
        };

        fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-primary/60'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-primary/60'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-primary/60');
            handleFile(e.dataTransfer.files[0]);
        });

        clearBtn.addEventListener('click', () => {
            referenceImageUrl = '';
            dropzone.classList.remove('hidden');
            preview.classList.add('hidden');
        });

        urlInput.addEventListener('change', () => {
            if (urlInput.value.trim()) {
                referenceImageUrl = urlInput.value.trim();
                previewImg.src = referenceImageUrl;
                dropzone.classList.add('hidden');
                preview.classList.remove('hidden');
            }
        });

        // Aspect ratio
        arBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                arBtns.forEach(b => { b.className = b.className.replace(/bg-primary\/20 border-primary\/40 text-primary/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); });
                btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-primary/20 border-primary/40 text-primary');
                selectedAR = btn.dataset.ar;
            });
        });

        // Generate
        generateBtn.addEventListener('click', async () => {
            if (isGenerating) return;
            if (!referenceImageUrl) { alert('Please upload a reference photo first.'); return; }
            if (!promptInput.value.trim()) { alert('Please describe a scenario.'); return; }

            isGenerating = true;
            generateBtn.disabled = true;
            outputEl.classList.add('hidden');
            resultEl.classList.add('hidden');
            loadingEl.classList.remove('hidden');
            loadingEl.classList.add('flex');

            try {
                const result = await muapi.generateImage({
                    model: 'flux-pulid',
                    prompt: promptInput.value.trim(),
                    image_url: referenceImageUrl,
                    aspect_ratio: selectedAR
                });

                if (result.url) {
                    resultImg.src = result.url;
                    loadingEl.classList.add('hidden');
                    resultEl.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Persona generation failed:', err);
                loadingEl.classList.add('hidden');
                outputEl.classList.remove('hidden');
                outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold text-center">⚠ ${err.message}</div>`;
            } finally {
                isGenerating = false;
                generateBtn.disabled = false;
            }
        });

        // Download
        downloadBtn?.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = resultImg.src;
            a.download = `persona_${Date.now()}.png`;
            a.click();
        });

        // Remix
        remixBtn?.addEventListener('click', () => {
            resultEl.classList.add('hidden');
            outputEl.classList.remove('hidden');
            outputEl.innerHTML = `<div class="text-6xl opacity-20">🎭</div><p class="text-secondary text-sm text-center max-w-sm">Write a new scenario and hit Generate again!</p>`;
            promptInput.value = '';
            promptInput.focus();
        });
    });

    return container;
}
