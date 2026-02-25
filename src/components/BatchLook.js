import { muapi } from '../lib/muapi.js';

/**
 * BatchLook — Batch Consistent Look.
 * Upload a set of images and a style reference,
 * and apply the same look/grading across all of them.
 * Uses flux-redux for consistent style propagation.
 */
export function BatchLook() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

  let referenceUrl = '';
  let batchImages = []; // array of { url, name }
  let isGenerating = false;

  container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sm font-black text-sky-400">📦</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Batch Look</h1>
              <p class="text-[11px] text-secondary">Consistent Style · flux-redux</p>
            </div>
          </div>
        </div>

        <!-- Style Reference -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Style Reference (Target Look)</label>
          <div id="batch-dropzone-ref" class="relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-sky-400/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all min-h-[120px] bg-white/[0.02] hover:bg-white/[0.04]">
            <div class="text-2xl opacity-40 group-hover:opacity-80">🎨</div>
            <p class="text-[11px] text-secondary text-center">Drop or <span class="text-sky-400 font-bold">upload</span> style reference</p>
            <input type="file" id="batch-file-ref" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div id="batch-preview-ref" class="hidden relative rounded-2xl overflow-hidden border border-white/10">
            <img id="batch-img-ref" class="w-full h-28 object-cover" />
            <button id="batch-clear-ref" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white/70 hover:text-red-400 flex items-center justify-center text-xs">✕</button>
          </div>
        </div>

        <!-- Batch Images -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Batch Images</label>
            <span id="batch-count" class="text-[10px] font-bold text-sky-400">0 images</span>
          </div>
          <div id="batch-dropzone-imgs" class="relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-sky-400/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all min-h-[100px] bg-white/[0.02] hover:bg-white/[0.04]">
            <div class="text-2xl opacity-40 group-hover:opacity-80">📁</div>
            <p class="text-[11px] text-secondary text-center">Drop or <span class="text-sky-400 font-bold">upload</span> multiple images</p>
            <input type="file" id="batch-file-imgs" accept="image/*" multiple class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div id="batch-thumbs" class="grid grid-cols-4 gap-2"></div>
          <button id="batch-clear-all" class="hidden w-full px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all">✕ Clear All</button>
        </div>

        <!-- Look Description -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Look Description (Optional)</label>
          <textarea id="batch-prompt" rows="2" placeholder="Describe the target look... e.g. 'Warm golden hour grading, soft contrast, film grain'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-sky-400/50 transition-colors custom-scrollbar"></textarea>
        </div>

        <!-- Transfer Strength -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Transfer Strength</label>
            <span id="batch-strength-val" class="text-xs font-bold text-sky-400">0.65</span>
          </div>
          <input type="range" id="batch-strength" min="0.3" max="0.9" step="0.05" value="0.65" class="w-full accent-sky-400" />
        </div>

        <div class="p-6 mt-auto">
          <button id="batch-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20">
            Process Batch
          </button>
        </div>
      </div>

      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.05),transparent_60%)]">
        <div id="batch-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">📦</div>
          <p class="text-secondary text-sm text-center max-w-sm">Upload a style reference and multiple images to apply a consistent look across all of them.</p>
        </div>
        <div id="batch-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <p id="batch-progress" class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Processing 0/0...</p>
        </div>
        <div id="batch-results" class="hidden w-full max-w-4xl">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-sm font-black uppercase tracking-wider text-white/60">Results</h2>
            <button id="batch-download-all" class="px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-400 text-xs font-bold hover:bg-sky-500/30 transition-all">⬇ Download All</button>
          </div>
          <div id="batch-result-grid" class="grid grid-cols-2 lg:grid-cols-3 gap-4"></div>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const refFileInput = container.querySelector('#batch-file-ref');
    const refDropzone = container.querySelector('#batch-dropzone-ref');
    const refPreview = container.querySelector('#batch-preview-ref');
    const refImg = container.querySelector('#batch-img-ref');
    const refClear = container.querySelector('#batch-clear-ref');
    const imgFileInput = container.querySelector('#batch-file-imgs');
    const thumbsEl = container.querySelector('#batch-thumbs');
    const countEl = container.querySelector('#batch-count');
    const clearAll = container.querySelector('#batch-clear-all');
    const promptInput = container.querySelector('#batch-prompt');
    const strengthSlider = container.querySelector('#batch-strength');
    const strengthVal = container.querySelector('#batch-strength-val');
    const generateBtn = container.querySelector('#batch-generate-btn');
    const outputEl = container.querySelector('#batch-output');
    const loadingEl = container.querySelector('#batch-loading');
    const progressEl = container.querySelector('#batch-progress');
    const resultsEl = container.querySelector('#batch-results');
    const resultGrid = container.querySelector('#batch-result-grid');

    // Reference upload
    const handleRefFile = (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => { referenceUrl = e.target.result; refImg.src = referenceUrl; refDropzone.classList.add('hidden'); refPreview.classList.remove('hidden'); };
      reader.readAsDataURL(file);
    };
    refFileInput.addEventListener('change', (e) => handleRefFile(e.target.files[0]));
    refDropzone.addEventListener('dragover', (e) => e.preventDefault());
    refDropzone.addEventListener('drop', (e) => { e.preventDefault(); handleRefFile(e.dataTransfer.files[0]); });
    refClear.addEventListener('click', () => { referenceUrl = ''; refDropzone.classList.remove('hidden'); refPreview.classList.add('hidden'); });

    // Batch images upload
    const updateThumbs = () => {
      thumbsEl.innerHTML = batchImages.map((img, i) => `
        <div class="relative rounded-xl overflow-hidden border border-white/10 aspect-square">
          <img src="${img.url}" class="w-full h-full object-cover" />
          <button data-idx="${i}" class="batch-remove-thumb absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white/60 hover:text-red-400 text-[10px] flex items-center justify-center">✕</button>
        </div>
      `).join('');
      countEl.textContent = `${batchImages.length} image${batchImages.length !== 1 ? 's' : ''}`;
      clearAll.classList.toggle('hidden', batchImages.length === 0);
      thumbsEl.querySelectorAll('.batch-remove-thumb').forEach(btn => {
        btn.addEventListener('click', () => { batchImages.splice(parseInt(btn.dataset.idx), 1); updateThumbs(); });
      });
    };

    const addFiles = (files) => {
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => { batchImages.push({ url: e.target.result, name: file.name }); updateThumbs(); };
        reader.readAsDataURL(file);
      });
    };

    imgFileInput.addEventListener('change', (e) => addFiles(e.target.files));
    container.querySelector('#batch-dropzone-imgs').addEventListener('dragover', (e) => e.preventDefault());
    container.querySelector('#batch-dropzone-imgs').addEventListener('drop', (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });
    clearAll.addEventListener('click', () => { batchImages = []; updateThumbs(); });
    strengthSlider.addEventListener('input', () => { strengthVal.textContent = strengthSlider.value; });

    generateBtn.addEventListener('click', async () => {
      if (isGenerating) return;
      if (!referenceUrl) { alert('Please upload a style reference.'); return; }
      if (batchImages.length === 0) { alert('Please upload at least one image to process.'); return; }

      isGenerating = true; generateBtn.disabled = true;
      outputEl.classList.add('hidden'); resultsEl.classList.add('hidden');
      loadingEl.classList.remove('hidden'); loadingEl.classList.add('flex');
      resultGrid.innerHTML = '';

      const lookDesc = promptInput.value.trim();
      const strength = parseFloat(strengthSlider.value);
      const results = [];

      for (let i = 0; i < batchImages.length; i++) {
        progressEl.textContent = `Processing ${i + 1}/${batchImages.length}...`;
        try {
          const result = await muapi.generateImage({
            model: 'flux-redux',
            prompt: `Apply the style, color grading, and visual mood from the reference to this image. ${lookDesc} Maintain the original composition and subject.`,
            image_url: batchImages[i].url,
            aspect_ratio: '1:1',
            strength: strength
          });
          if (result.url) results.push(result.url);
        } catch (err) {
          console.error(`Batch item ${i} failed:`, err);
          results.push(null);
        }
      }

      loadingEl.classList.add('hidden');
      resultsEl.classList.remove('hidden');
      results.forEach((url, i) => {
        if (url) {
          resultGrid.innerHTML += `
            <div class="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
              <img src="${url}" class="w-full aspect-square object-cover" />
              <button data-url="${url}" class="batch-dl-single w-full py-2 text-[10px] font-bold text-secondary hover:text-white hover:bg-white/5 transition-colors">⬇ Download</button>
            </div>`;
        } else {
          resultGrid.innerHTML += `<div class="rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center aspect-square text-red-400 text-xs font-bold">Failed #${i + 1}</div>`;
        }
      });
      resultGrid.querySelectorAll('.batch-dl-single').forEach(btn => btn.addEventListener('click', () => { const a = document.createElement('a'); a.href = btn.dataset.url; a.download = `batch_${Date.now()}.png`; a.click(); }));
      isGenerating = false; generateBtn.disabled = false;
    });

    container.querySelector('#batch-download-all')?.addEventListener('click', () => {
      resultGrid.querySelectorAll('img').forEach((img, i) => {
        setTimeout(() => { const a = document.createElement('a'); a.href = img.src; a.download = `batch_${i + 1}_${Date.now()}.png`; a.click(); }, i * 300);
      });
    });
  });

  return container;
}
