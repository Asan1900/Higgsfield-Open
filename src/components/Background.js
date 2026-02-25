import { muapi } from '../lib/muapi.js';

/**
 * Background — Background Removal & Replacement.
 * Upload an image, remove the background cleanly,
 * or replace it with an AI-generated scene.
 * Uses bria-rmbg for removal and z-image-base for replacement.
 */
export function Background() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

  let sourceImageUrl = '';
  let isGenerating = false;

  const scenePresets = [
    { id: 'remove', label: '✂️ Remove Only', prompt: '' },
    { id: 'studio', label: '📷 Studio', prompt: 'Professional photography studio background, soft gradient lighting, clean neutral backdrop, subtle shadow, commercial quality' },
    { id: 'nature', label: '🌿 Nature', prompt: 'Beautiful natural landscape background, lush green forest, soft sunlight filtering through leaves, dreamy bokeh, golden hour' },
    { id: 'city', label: '🏙️ Urban', prompt: 'Modern city skyline background, sleek architecture, golden hour light, professional urban photography, soft bokeh city lights' },
    { id: 'gradient', label: '🎨 Gradient', prompt: 'Smooth abstract gradient background, soft pastel colors blending, clean modern aesthetic, professional product photography' },
    { id: 'marble', label: '🪨 Marble', prompt: 'Luxurious white marble background with subtle gold veins, elegant premium feel, soft directional lighting, high-end product display' },
    { id: 'beach', label: '🏖️ Beach', prompt: 'Beautiful tropical beach background, crystal clear turquoise water, white sand, palm trees, warm sunset lighting, paradise vibes' },
    { id: 'neon', label: '💜 Neon', prompt: 'Dark background with vivid neon glow effects, cyberpunk lighting, pink and blue neon reflections, edgy modern aesthetic' }
  ];

  container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Panel -->
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/30 flex items-center justify-center text-sm font-black text-fuchsia-400">🪄</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Background Lab</h1>
              <p class="text-[11px] text-secondary">Remove & Replace · bria-rmbg</p>
            </div>
          </div>
        </div>

        <!-- Source Image Upload -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Source Image</label>
          <div id="bg-dropzone" class="relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-fuchsia-400/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[180px] bg-white/[0.02] hover:bg-white/[0.04]">
            <div class="text-4xl opacity-40 group-hover:opacity-80 transition-opacity">🪄</div>
            <p class="text-xs text-secondary text-center">Drop an image or <span class="text-fuchsia-400 font-bold">click to upload</span></p>
            <p class="text-[10px] text-muted">Works best with clear subjects</p>
            <input type="file" id="bg-file-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div id="bg-preview" class="hidden relative rounded-2xl overflow-hidden border border-white/10">
            <img id="bg-preview-img" class="w-full h-48 object-cover" />
            <button id="bg-clear-btn" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white/70 hover:text-red-400 flex items-center justify-center text-sm transition-colors">✕</button>
          </div>
          <input type="text" id="bg-url-input" placeholder="Or paste an image URL..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-fuchsia-400/50 transition-colors" />
        </div>

        <!-- Scene Replacement Presets -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Background Action</label>
          <div id="bg-scene-grid" class="grid grid-cols-2 gap-2">
            ${scenePresets.map((s, i) => `
              <button data-scene="${s.id}" class="bg-scene-btn px-3 py-2.5 rounded-xl text-[11px] font-bold border text-left transition-all ${i === 0 ? 'bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${s.label}</button>
            `).join('')}
          </div>
        </div>

        <!-- Custom Scene Description -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Custom Background (Optional)</label>
          <textarea id="bg-prompt" rows="3" placeholder="Describe a custom background scene... e.g. 'Cozy coffee shop interior with warm lighting and exposed brick walls'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-fuchsia-400/50 transition-colors custom-scrollbar"></textarea>
        </div>

        <!-- Aspect Ratio -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Output Aspect Ratio</label>
          <div class="grid grid-cols-5 gap-2">
            ${['1:1', '16:9', '9:16', '4:3', '3:4'].map((ar, i) => `
              <button data-ar="${ar}" class="bg-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>
            `).join('')}
          </div>
        </div>

        <!-- Generate -->
        <div class="p-6 mt-auto">
          <button id="bg-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20">
            Process Background
          </button>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(217,70,239,0.05),transparent_60%)]">
        <div id="bg-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">🪄</div>
          <p class="text-secondary text-sm text-center max-w-sm">Upload a photo to remove or replace the background. Choose "Remove Only" for a transparent cutout, or pick a scene preset.</p>
        </div>
        <div id="bg-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Processing Background...</p>
        </div>
        <div id="bg-result" class="hidden max-w-3xl w-full">
          <!-- Checkerboard pattern behind result to show transparency -->
          <div class="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-fuchsia-500/10" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22><rect width=%2210%22 height=%2210%22 fill=%22%23222%22/><rect x=%2210%22 y=%2210%22 width=%2210%22 height=%2210%22 fill=%22%23222%22/><rect x=%2210%22 width=%2210%22 height=%2210%22 fill=%22%231a1a1a%22/><rect y=%2210%22 width=%2210%22 height=%2210%22 fill=%22%231a1a1a%22/></svg>');">
            <img id="bg-result-img" class="w-full relative z-10" />
            <div id="bg-result-badge" class="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-fuchsia-500/90 text-[10px] font-black uppercase tracking-wider"></div>
          </div>
          <div class="flex gap-3 mt-4 justify-center">
            <button id="bg-download-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download</button>
            <button id="bg-new-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 Try Another</button>
          </div>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const fileInput = container.querySelector('#bg-file-input');
    const dropzone = container.querySelector('#bg-dropzone');
    const preview = container.querySelector('#bg-preview');
    const previewImg = container.querySelector('#bg-preview-img');
    const clearBtn = container.querySelector('#bg-clear-btn');
    const urlInput = container.querySelector('#bg-url-input');
    const promptInput = container.querySelector('#bg-prompt');
    const generateBtn = container.querySelector('#bg-generate-btn');
    const outputEl = container.querySelector('#bg-output');
    const loadingEl = container.querySelector('#bg-loading');
    const resultEl = container.querySelector('#bg-result');
    const resultImg = container.querySelector('#bg-result-img');
    const resultBadge = container.querySelector('#bg-result-badge');
    const downloadBtn = container.querySelector('#bg-download-btn');
    const newBtn = container.querySelector('#bg-new-btn');
    const sceneBtns = container.querySelectorAll('.bg-scene-btn');
    const arBtns = container.querySelectorAll('.bg-ar-btn');

    let selectedScene = scenePresets[0];
    let selectedAR = '1:1';

    // File handling
    const handleFile = (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => { sourceImageUrl = e.target.result; previewImg.src = sourceImageUrl; dropzone.classList.add('hidden'); preview.classList.remove('hidden'); urlInput.value = ''; };
      reader.readAsDataURL(file);
    };

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-fuchsia-400/60'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-fuchsia-400/60'));
    dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('border-fuchsia-400/60'); handleFile(e.dataTransfer.files[0]); });
    clearBtn.addEventListener('click', () => { sourceImageUrl = ''; dropzone.classList.remove('hidden'); preview.classList.add('hidden'); });
    urlInput.addEventListener('change', () => { if (urlInput.value.trim()) { sourceImageUrl = urlInput.value.trim(); previewImg.src = sourceImageUrl; dropzone.classList.add('hidden'); preview.classList.remove('hidden'); } });

    // Scene presets
    sceneBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sceneBtns.forEach(b => { b.className = b.className.replace(/bg-fuchsia-500\/20 border-fuchsia-400\/40 text-fuchsia-400/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); });
        btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-400');
        selectedScene = scenePresets.find(s => s.id === btn.dataset.scene);
      });
    });

    // Aspect ratio
    arBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        arBtns.forEach(b => { b.className = b.className.replace(/bg-fuchsia-500\/20 border-fuchsia-400\/40 text-fuchsia-400/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); });
        btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-400');
        selectedAR = btn.dataset.ar;
      });
    });

    generateBtn.addEventListener('click', async () => {
      if (isGenerating) return;
      if (!sourceImageUrl) { alert('Please upload an image first.'); return; }

      isGenerating = true;
      generateBtn.disabled = true;
      outputEl.classList.add('hidden');
      resultEl.classList.add('hidden');
      loadingEl.classList.remove('hidden');
      loadingEl.classList.add('flex');

      const customPrompt = promptInput.value.trim();
      const isRemoveOnly = selectedScene.id === 'remove' && !customPrompt;

      try {
        let result;
        if (isRemoveOnly) {
          // Background removal only — use flux-schnell endpoint
          result = await muapi.generateImage({
            model: 'flux-schnell',
            prompt: 'Remove background, pure white or transparent background, single object focus',
            image_url: sourceImageUrl
          });
          resultBadge.textContent = 'BG Removed';
        } else {
          // Background replacement — reimagine with new background
          const bgPrompt = customPrompt || selectedScene.prompt;
          result = await muapi.generateImage({
            model: 'z-image-base',
            prompt: `Subject from the original image placed on a new background: ${bgPrompt}. Preserve the subject exactly, only change the background.`,
            image_url: sourceImageUrl,
            aspect_ratio: selectedAR,
            strength: 0.55
          });
          resultBadge.textContent = 'BG Replaced';
        }

        if (result.url) {
          resultImg.src = result.url;
          loadingEl.classList.add('hidden');
          resultEl.classList.remove('hidden');
        }
      } catch (err) {
        console.error('Background processing failed:', err);
        loadingEl.classList.add('hidden');
        outputEl.classList.remove('hidden');
        outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold text-center">⚠ ${err.message}</div>`;
      } finally {
        isGenerating = false;
        generateBtn.disabled = false;
      }
    });

    downloadBtn?.addEventListener('click', () => { const a = document.createElement('a'); a.href = resultImg.src; a.download = `background_${Date.now()}.png`; a.click(); });
    newBtn?.addEventListener('click', () => {
      resultEl.classList.add('hidden');
      outputEl.classList.remove('hidden');
      outputEl.innerHTML = `<div class="text-6xl opacity-20">🪄</div><p class="text-secondary text-sm text-center max-w-sm">Try a different scene or upload a new image!</p>`;
    });
  });

  return container;
}
