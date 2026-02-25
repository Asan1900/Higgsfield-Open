import { muapi } from '../lib/muapi.js';

/**
 * MagicEditor — Unified image editing interface.
 * Merges guided action edits (Remove, Replace, etc.) and freeform prompt edits.
 * Uses nano-banana for all modifications.
 */
export function MagicEditor() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';
    let currentImage = null;
    let isGenerating = false;

    const editActions = [
        { id: 'freeform', label: '💭 Freeform Prompt', desc: 'Describe any edit you want' },
        { id: 'remove', label: '🧹 Remove', desc: 'Remove an object completely' },
        { id: 'replace', label: '🔄 Replace', desc: 'Swap one object for another' },
        { id: 'add', label: '➕ Add', desc: 'Insert a new object' },
        { id: 'reposition', label: '↔️ Move', desc: 'Move an object' },
        { id: 'resize', label: '📏 Resize', desc: 'Change size of an object' },
        { id: 'color', label: '🎨 Color', desc: 'Change color of an object or background' }
    ];

    container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Sidebar: Controls -->
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/30 flex items-center justify-center text-lg font-black text-fuchsia-400">🪄</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Magic Editor</h1>
              <p class="text-[11px] text-secondary">Text-guided edits · nano-banana</p>
            </div>
          </div>
        </div>

        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Source Image</label>
          <div id="me-upload-area" class="w-full aspect-video border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-fuchsia-400/50 hover:bg-fuchsia-400/5 transition-all cursor-pointer relative overflow-hidden group">
            <div id="me-upload-placeholder" class="flex flex-col items-center gap-2">
              <span class="text-3xl opacity-50 group-hover:scale-110 transition-transform">🖼️</span>
              <span class="text-xs font-bold text-secondary group-hover:text-white transition-colors">Click or drag image</span>
            </div>
            <img id="me-source-preview" class="absolute inset-0 w-full h-full object-contain hidden" />
            <input type="file" id="me-file-input" class="hidden" accept="image/*" />
          </div>
          <div class="flex gap-2 items-center">
            <div class="h-[1px] flex-1 bg-white/5"></div>
            <span class="text-[10px] text-muted font-bold uppercase">OR</span>
            <div class="h-[1px] flex-1 bg-white/5"></div>
          </div>
          <input type="url" id="me-url-input" placeholder="Paste image URL..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-fuchsia-400/50 transition-colors" />
        </div>

        <!-- Edit Mode -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Edit Action</label>
          <div class="grid grid-cols-2 gap-2">
            ${editActions.map((a, i) => `
              <button data-action="${a.id}" class="me-action-btn px-3 py-2 rounded-xl text-[11px] font-bold border text-left transition-all ${i === 0 ? 'bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">
                ${a.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Prompt Area -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <div id="me-prompt-container">
            <!-- Dynamic content based on action -->
          </div>
        </div>

        <div class="p-6 mt-auto">
          <button id="me-generate-btn" disabled class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-fuchsia-500/20">
            Apply Magic Edit
          </button>
        </div>
      </div>

      <!-- Right Area: Preview -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(217,70,239,0.05),transparent_60%)]">
        <div id="me-output-placeholder" class="flex flex-col items-center gap-6 animate-fade-in w-full max-w-sm text-center">
          <div class="text-6xl opacity-20">🪄</div>
          <p class="text-secondary text-sm">Upload an image and tell the AI what to change. Use specific actions or freeform text.</p>
        </div>
        
        <div id="me-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Applying Magic...</p>
        </div>

        <div id="me-result" class="hidden max-w-3xl w-full flex flex-col items-center gap-4">
          <div class="relative group rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-fuchsia-500/10">
            <img id="me-result-img" class="w-full object-contain max-h-[70vh]" />
          </div>
          <div class="flex gap-3 justify-center">
            <button id="me-download" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download</button>
            <button id="me-use-as-source" class="px-5 py-2.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-400 text-xs font-bold hover:bg-fuchsia-500/30 transition-all">🪄 Edit This Result</button>
          </div>
        </div>
      </div>
    </div>
  `;

    requestAnimationFrame(() => {
        const uploadArea = container.querySelector('#me-upload-area');
        const fileInput = container.querySelector('#me-file-input');
        const urlInput = container.querySelector('#me-url-input');
        const sourcePreview = container.querySelector('#me-source-preview');
        const placeholder = container.querySelector('#me-upload-placeholder');
        const actionBtns = container.querySelectorAll('.me-action-btn');
        const promptContainer = container.querySelector('#me-prompt-container');
        const generateBtn = container.querySelector('#me-generate-btn');
        const outputPlac = container.querySelector('#me-output-placeholder');
        const loadingEl = container.querySelector('#me-loading');
        const resultEl = container.querySelector('#me-result');
        const resultImg = container.querySelector('#me-result-img');

        let currentAction = 'freeform';

        const renderPromptUI = () => {
            if (currentAction === 'freeform') {
                promptContainer.innerHTML = `
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Instructions</label>
          <textarea id="me-main-prompt" rows="3" placeholder="e.g. 'Make it winter', 'Make the dog wear a hat'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-fuchsia-400/50 mt-2 custom-scrollbar"></textarea>
        `;
            } else if (currentAction === 'remove') {
                promptContainer.innerHTML = `
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Object to Remove</label>
          <input type="text" id="me-main-prompt" placeholder="e.g. 'the person in the background'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-fuchsia-400/50 mt-2" />
        `;
            } else if (currentAction === 'replace') {
                promptContainer.innerHTML = `
          <div class="space-y-3">
            <div>
              <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Replace This</label>
              <input type="text" id="me-target-prompt" placeholder="e.g. 'the coffee cup'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-fuchsia-400/50 mt-2" />
            </div>
            <div>
              <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">With This</label>
              <input type="text" id="me-main-prompt" placeholder="e.g. 'a glass of wine'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-fuchsia-400/50 mt-2" />
            </div>
          </div>
        `;
            } else if (currentAction === 'color') {
                promptContainer.innerHTML = `
          <div class="space-y-3">
            <div>
              <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Change Color Of</label>
              <input type="text" id="me-target-prompt" placeholder="e.g. 'the car', 'the background'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-fuchsia-400/50 mt-2" />
            </div>
            <div>
              <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">To This Color</label>
              <input type="text" id="me-main-prompt" placeholder="e.g. 'cherry red', 'dark blue'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-fuchsia-400/50 mt-2" />
            </div>
          </div>
        `;
            } else {
                // Add, reposition, resize
                promptContainer.innerHTML = `
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Instructions</label>
          <textarea id="me-main-prompt" rows="3" placeholder="e.g. 'Add a bird to the sky', 'Move the tree to the left'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-fuchsia-400/50 mt-2 custom-scrollbar"></textarea>
        `;
            }
        };

        renderPromptUI();

        actionBtns.forEach(btn => btn.addEventListener('click', () => {
            actionBtns.forEach(b => {
                b.className = b.className.replace(/bg-fuchsia-500\/20 border-fuchsia-400\/40 text-fuchsia-400/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10');
            });
            btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-400');
            currentAction = btn.dataset.action;
            renderPromptUI();
        }));

        const handleImageSet = (url) => {
            currentImage = url;
            sourcePreview.src = url;
            sourcePreview.classList.remove('hidden');
            placeholder.classList.add('hidden');
            generateBtn.disabled = false;
            urlInput.value = url.startsWith('blob:') ? '' : url;
        };

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('border-fuchsia-400/50'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('border-fuchsia-400/50'));
        uploadArea.addEventListener('drop', e => {
            e.preventDefault();
            uploadArea.classList.remove('border-fuchsia-400/50');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleImageSet(URL.createObjectURL(e.dataTransfer.files[0]));
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleImageSet(URL.createObjectURL(e.target.files[0]));
            }
        });

        urlInput.addEventListener('change', () => {
            if (urlInput.value) handleImageSet(urlInput.value);
        });

        generateBtn.addEventListener('click', async () => {
            if (isGenerating || !currentImage) return;

            const mainInput = container.querySelector('#me-main-prompt');
            const targetInput = container.querySelector('#me-target-prompt');
            let finalPrompt = '';

            if (currentAction === 'freeform') {
                finalPrompt = mainInput.value.trim();
            } else if (currentAction === 'remove') {
                finalPrompt = `Remove ${mainInput.value.trim()}`;
            } else if (currentAction === 'replace') {
                finalPrompt = `Replace ${targetInput?.value?.trim() || ''} with ${mainInput.value.trim()}`;
            } else if (currentAction === 'color') {
                finalPrompt = `Change color of ${targetInput?.value?.trim() || ''} to ${mainInput.value.trim()}`;
            } else {
                finalPrompt = mainInput.value.trim();
            }

            if (!finalPrompt) { alert('Please provide an edit instruction.'); return; }

            isGenerating = true; generateBtn.disabled = true;
            outputPlac.classList.add('hidden'); resultEl.classList.add('hidden');
            loadingEl.classList.remove('hidden'); loadingEl.classList.add('flex');

            try {
                const result = await muapi.generateImage({
                    model: 'nano-banana',
                    prompt: finalPrompt,
                    image_url: currentImage
                });

                if (result.url) {
                    resultImg.src = result.url;
                    loadingEl.classList.add('hidden');
                    resultEl.classList.remove('hidden');
                }
            } catch (err) {
                console.error('MagicEditor failed:', err);
                loadingEl.classList.add('hidden');
                outputPlac.classList.remove('hidden');
                outputPlac.innerHTML = `<div class="text-red-400 text-sm font-bold bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">⚠ ${err.message || 'Model is currently unreachable. Please try again later.'}</div>`;
            } finally {
                isGenerating = false; generateBtn.disabled = false;
            }
        });

        container.querySelector('#me-download')?.addEventListener('click', () => {
            const a = document.createElement('a'); a.href = resultImg.src;
            a.download = `magic_edit_${Date.now()}.png`; a.click();
        });

        container.querySelector('#me-use-as-source')?.addEventListener('click', () => {
            handleImageSet(resultImg.src);
            resultEl.classList.add('hidden');
            outputPlac.classList.remove('hidden');
            outputPlac.innerHTML = `<div class="text-6xl opacity-20">🪄</div><p class="text-secondary text-sm">Image updated. Apply another edit to continue refining.</p>`;
        });
    });

    return container;
}
