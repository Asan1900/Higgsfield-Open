import { muapi } from '../lib/muapi.js';
import { setupUploader, setupButtonGroup, downloadMedia } from '../lib/uiUtils.js';

/**
 * Upscale — Smart 4K Refinement.
 * Upload an image and enhance it with AI that adds realistic detail,
 * not just pixel stretching. Uses google-imagen4-ultra for generative upscaling.
 */
export function Upscale() {
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
            <div class="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sm font-black text-sky-400">4K</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Smart Upscaler</h1>
              <p class="text-[11px] text-secondary">AI Enhancement · google-imagen4-ultra</p>
            </div>
          </div>
        </div>

        <!-- Source Image Upload -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Image to Enhance</label>
          <div id="upscale-dropzone" class="relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-sky-400/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[180px] bg-white/[0.02] hover:bg-white/[0.04]">
            <div class="text-4xl opacity-40 group-hover:opacity-80 transition-opacity">🔍</div>
            <p class="text-xs text-secondary text-center">Drop an image or <span class="text-sky-400 font-bold">click to upload</span></p>
            <p class="text-[10px] text-muted">Works best with images under 1024px</p>
            <input type="file" id="upscale-file-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div id="upscale-preview" class="hidden relative rounded-2xl overflow-hidden border border-white/10">
            <img id="upscale-preview-img" class="w-full h-48 object-cover" />
            <button id="upscale-clear-btn" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white/70 hover:text-red-400 flex items-center justify-center text-sm transition-colors">✕</button>
          </div>
          <input type="text" id="upscale-url-input" placeholder="Or paste an image URL..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-400/50 transition-colors" />
        </div>

        <!-- Enhancement Description -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Enhancement Guide (Optional)</label>
          <textarea id="upscale-prompt" rows="3" placeholder="Describe what to enhance... e.g. 'sharp facial details, clear eyes, crisp fabric textures, professional photography quality'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-sky-400/50 transition-colors custom-scrollbar"></textarea>
        </div>

        <!-- Quick Enhance Presets -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Quick Enhance</label>
          <div class="grid grid-cols-2 gap-2">
            ${[
      { id: 'portrait', label: '👤 Portrait', prompt: 'Enhance facial details, clear sharp eyes, smooth skin texture, studio-quality portrait photography' },
      { id: 'landscape', label: '🏞️ Landscape', prompt: 'Enhance foliage detail, sharp distant mountains, realistic sky textures, professional landscape photography' },
      { id: 'product', label: '📦 Product', prompt: 'Enhance material textures, sharp edges, even lighting, professional product photography quality' },
      { id: 'art', label: '🎨 Digital Art', prompt: 'Enhance artistic detail, crisp linework, vibrant colors, professional illustration quality' }
    ].map((p, i) => `
              <button data-preset="${p.id}" data-prompt="${p.prompt}" class="upscale-preset-btn px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-sky-500/20 border-sky-400/40 text-sky-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${p.label}</button>
            `).join('')}
          </div>
        </div>

        <!-- Output Aspect Ratio -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Output AR (preserves original if same)</label>
          <div class="grid grid-cols-5 gap-2">
            ${['1:1', '16:9', '9:16', '4:3', '3:4'].map((ar, i) => `
              <button data-ar="${ar}" class="upscale-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-sky-500/20 border-sky-400/40 text-sky-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>
            `).join('')}
          </div>
        </div>

        <!-- Generate -->
        <div class="p-6 mt-auto">
          <button id="upscale-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20">
            ⚡ Enhance to 4K
          </button>
        </div>
      </div>

      <!-- Right Panel: Before/After -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.05),transparent_60%)]">
        <div id="upscale-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">✨</div>
          <p class="text-secondary text-sm text-center max-w-sm">Upload any image to enhance with AI-powered 4K refinement that adds realistic detail and clarity.</p>
        </div>
        <div id="upscale-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Enhancing...</p>
        </div>
        <div id="upscale-result" class="hidden max-w-4xl w-full space-y-4">
          <!-- Before/After Comparison -->
          <div class="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-sky-500/10">
            <img id="upscale-result-img" class="w-full" />
            <div class="absolute top-3 right-3 px-3 py-1 rounded-full bg-sky-500/90 text-[10px] font-black uppercase tracking-wider">Enhanced</div>
          </div>
          <div class="flex gap-3 justify-center">
            <button id="upscale-download-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download 4K</button>
            <button id="upscale-new-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 Enhance Another</button>
          </div>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const fileInput = container.querySelector('#upscale-file-input');
    const dropzone = container.querySelector('#upscale-dropzone');
    const preview = container.querySelector('#upscale-preview');
    const previewImg = container.querySelector('#upscale-preview-img');
    const clearBtn = container.querySelector('#upscale-clear-btn');
    const urlInput = container.querySelector('#upscale-url-input');
    const promptInput = container.querySelector('#upscale-prompt');
    const generateBtn = container.querySelector('#upscale-generate-btn');
    const outputEl = container.querySelector('#upscale-output');
    const loadingEl = container.querySelector('#upscale-loading');
    const resultEl = container.querySelector('#upscale-result');
    const resultImg = container.querySelector('#upscale-result-img');
    const downloadBtn = container.querySelector('#upscale-download-btn');
    const newBtn = container.querySelector('#upscale-new-btn');
    const presetBtns = container.querySelectorAll('.upscale-preset-btn');
    const arBtns = container.querySelectorAll('.upscale-ar-btn');

    let selectedPresetPrompt = 'Enhance facial details, clear sharp eyes, smooth skin texture, studio-quality portrait photography';
    let selectedAR = '1:1';

    const handleImageSet = (url) => {
      sourceImageUrl = url;
    };

    setupUploader({
      fileInput,
      dropzone,
      preview,
      previewImg,
      clearBtn,
      urlInput,
      onImageSet: handleImageSet
    });

    setupButtonGroup(presetBtns, {
      activeClasses: ['bg-sky-500/20', 'border-sky-400/40', 'text-sky-400'],
      inactiveClasses: ['bg-white/5', 'border-white/10', 'text-secondary', 'hover:bg-white/10'],
      onSelect: (dataset) => {
        selectedPresetPrompt = dataset.prompt;
      }
    });

    setupButtonGroup(arBtns, {
      activeClasses: ['bg-sky-500/20', 'border-sky-400/40', 'text-sky-400'],
      inactiveClasses: ['bg-white/5', 'border-white/10', 'text-secondary', 'hover:bg-white/10'],
      onSelect: (dataset) => {
        selectedAR = dataset.ar;
      }
    });

    generateBtn.addEventListener('click', async () => {
      if (isGenerating) return;
      if (!sourceImageUrl) { alert('Please upload an image to enhance.'); return; }

      isGenerating = true;
      generateBtn.disabled = true;
      outputEl.classList.add('hidden');
      resultEl.classList.add('hidden');
      loadingEl.classList.remove('hidden');
      loadingEl.classList.add('flex');

      const enhancePrompt = promptInput.value.trim() || selectedPresetPrompt;

      try {
        const result = await muapi.generateImage({
          model: 'z-image-base',
          prompt: `Ultra high-resolution, extremely detailed version of this image. ${enhancePrompt}. 4K quality, sharp details, professional photography.`,
          image_url: sourceImageUrl,
          aspect_ratio: selectedAR
        });

        if (result.url) {
          resultImg.src = result.url;
          loadingEl.classList.add('hidden');
          resultEl.classList.remove('hidden');
        }
      } catch (err) {
        console.error('Upscale failed:', err);
        loadingEl.classList.add('hidden');
        outputEl.classList.remove('hidden');
        outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold text-center">⚠ ${err.message}</div>`;
      } finally {
        isGenerating = false;
        generateBtn.disabled = false;
      }
    });

    downloadBtn?.addEventListener('click', () => downloadMedia(resultImg.src, `upscale_4k_${Date.now()}.png`));
    newBtn?.addEventListener('click', () => {
      sourceImageUrl = '';
      dropzone.classList.remove('hidden');
      preview.classList.add('hidden');
      resultEl.classList.add('hidden');
      outputEl.classList.remove('hidden');
      outputEl.innerHTML = `<div class="text-6xl opacity-20">✨</div><p class="text-secondary text-sm text-center max-w-sm">Upload another image to enhance!</p>`;
    });
  });

  return container;
}
