import { muapi } from '../lib/muapi.js';

/**
 * Outpaint — Infinite Canvas / Generative Expansion.
 * Upload an image and extend it in any direction with AI-generated context.
 * Uses z-image-base with strength control.
 */
export function Outpaint() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

  let sourceImageUrl = '';
  let isGenerating = false;

  container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Panel -->
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-sm font-black text-cyan-400">∞</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Infinite Canvas</h1>
              <p class="text-[11px] text-secondary">Generative Outpaint · z-image-base</p>
            </div>
          </div>
        </div>

        <!-- Source Image Upload -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Source Image</label>
          <div id="outpaint-dropzone" class="relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-cyan-400/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[160px] bg-white/[0.02] hover:bg-white/[0.04]">
            <div class="text-4xl opacity-40 group-hover:opacity-80 transition-opacity">🖼️</div>
            <p class="text-xs text-secondary text-center">Drop an image or <span class="text-cyan-400 font-bold">click to upload</span></p>
            <input type="file" id="outpaint-file-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div id="outpaint-preview" class="hidden relative rounded-2xl overflow-hidden border border-white/10">
            <img id="outpaint-preview-img" class="w-full h-40 object-cover" />
            <button id="outpaint-clear-btn" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white/70 hover:text-red-400 flex items-center justify-center text-sm transition-colors">✕</button>
          </div>
          <input type="text" id="outpaint-url-input" placeholder="Or paste an image URL..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors" />
        </div>

        <!-- Expansion Prompt -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Expansion Context</label>
          <textarea id="outpaint-prompt" rows="3" placeholder="Describe what should appear in the expanded areas... e.g. 'Continue the forest landscape with more pine trees and a misty mountain range'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-cyan-400/50 transition-colors custom-scrollbar"></textarea>
        </div>

        <!-- Target Aspect Ratio -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Target Aspect Ratio</label>
          <div id="outpaint-ar-grid" class="grid grid-cols-4 gap-2">
            ${['16:9', '9:16', '21:9', '4:3'].map((ar, i) => `
              <button data-ar="${ar}" class="outpaint-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>
            `).join('')}
          </div>
        </div>

        <!-- Strength Slider -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Transformation Strength</label>
            <span id="outpaint-strength-val" class="text-xs font-bold text-cyan-400">0.65</span>
          </div>
          <input type="range" id="outpaint-strength" min="0.1" max="1.0" step="0.05" value="0.65" class="w-full accent-cyan-400" />
          <p class="text-[10px] text-muted">Lower = closer to original. Higher = more creative.</p>
        </div>

        <!-- Generate Button -->
        <div class="p-6 mt-auto">
          <button id="outpaint-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20">
            Expand Canvas
          </button>
        </div>
      </div>

      <!-- Right Panel: Output -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_60%)]">
        <div id="outpaint-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">🌌</div>
          <p class="text-secondary text-sm text-center max-w-sm">Upload an image and describe how the scene should expand beyond its borders.</p>
        </div>
        <div id="outpaint-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Expanding Canvas...</p>
        </div>
        <div id="outpaint-result" class="hidden max-w-4xl w-full">
          <img id="outpaint-result-img" class="w-full rounded-3xl border border-white/10 shadow-2xl shadow-cyan-500/10" />
          <div class="flex gap-3 mt-4 justify-center">
            <button id="outpaint-download-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download</button>
            <button id="outpaint-again-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 Expand Again</button>
          </div>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const fileInput = container.querySelector('#outpaint-file-input');
    const dropzone = container.querySelector('#outpaint-dropzone');
    const preview = container.querySelector('#outpaint-preview');
    const previewImg = container.querySelector('#outpaint-preview-img');
    const clearBtn = container.querySelector('#outpaint-clear-btn');
    const urlInput = container.querySelector('#outpaint-url-input');
    const promptInput = container.querySelector('#outpaint-prompt');
    const strengthSlider = container.querySelector('#outpaint-strength');
    const strengthVal = container.querySelector('#outpaint-strength-val');
    const generateBtn = container.querySelector('#outpaint-generate-btn');
    const outputEl = container.querySelector('#outpaint-output');
    const loadingEl = container.querySelector('#outpaint-loading');
    const resultEl = container.querySelector('#outpaint-result');
    const resultImg = container.querySelector('#outpaint-result-img');
    const downloadBtn = container.querySelector('#outpaint-download-btn');
    const againBtn = container.querySelector('#outpaint-again-btn');
    const arBtns = container.querySelectorAll('.outpaint-ar-btn');
    let selectedAR = '16:9';

    const handleFile = (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        sourceImageUrl = e.target.result;
        previewImg.src = sourceImageUrl;
        dropzone.classList.add('hidden');
        preview.classList.remove('hidden');
        urlInput.value = '';
      };
      reader.readAsDataURL(file);
    };

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-cyan-400/60'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-cyan-400/60'));
    dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('border-cyan-400/60'); handleFile(e.dataTransfer.files[0]); });

    clearBtn.addEventListener('click', () => { sourceImageUrl = ''; dropzone.classList.remove('hidden'); preview.classList.add('hidden'); });

    urlInput.addEventListener('change', () => {
      if (urlInput.value.trim()) {
        sourceImageUrl = urlInput.value.trim();
        previewImg.src = sourceImageUrl;
        dropzone.classList.add('hidden');
        preview.classList.remove('hidden');
      }
    });

    strengthSlider.addEventListener('input', () => { strengthVal.textContent = strengthSlider.value; });

    arBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        arBtns.forEach(b => { b.className = b.className.replace(/bg-cyan-500\/20 border-cyan-400\/40 text-cyan-400/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); });
        btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-cyan-500/20 border-cyan-400/40 text-cyan-400');
        selectedAR = btn.dataset.ar;
      });
    });

    generateBtn.addEventListener('click', async () => {
      if (isGenerating) return;
      if (!sourceImageUrl) { alert('Please upload a source image.'); return; }

      isGenerating = true;
      generateBtn.disabled = true;
      outputEl.classList.add('hidden');
      resultEl.classList.add('hidden');
      loadingEl.classList.remove('hidden');
      loadingEl.classList.add('flex');

      try {
        const result = await muapi.generateImage({
          model: 'z-image-base',
          prompt: promptInput.value.trim() || 'Continue and expand the scene naturally, seamless extension, matching lighting and style',
          image_url: sourceImageUrl,
          aspect_ratio: selectedAR,
          strength: parseFloat(strengthSlider.value)
        });

        if (result.url) {
          resultImg.src = result.url;
          loadingEl.classList.add('hidden');
          resultEl.classList.remove('hidden');
        }
      } catch (err) {
        console.error('Outpaint failed:', err);
        loadingEl.classList.add('hidden');
        outputEl.classList.remove('hidden');
        outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold text-center">⚠ ${err.message}</div>`;
      } finally {
        isGenerating = false;
        generateBtn.disabled = false;
      }
    });

    downloadBtn?.addEventListener('click', () => { const a = document.createElement('a'); a.href = resultImg.src; a.download = `outpaint_${Date.now()}.png`; a.click(); });
    againBtn?.addEventListener('click', () => {
      // Use the result as the new source for iterative expansion
      sourceImageUrl = resultImg.src;
      previewImg.src = sourceImageUrl;
      resultEl.classList.add('hidden');
      outputEl.classList.remove('hidden');
      outputEl.innerHTML = `<div class="text-6xl opacity-20">🌌</div><p class="text-secondary text-sm text-center max-w-sm">Ready to expand again! Adjust the prompt or aspect ratio and hit Expand.</p>`;
    });
  });

  return container;
}
