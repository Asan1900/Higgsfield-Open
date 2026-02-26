import { muapi } from '../lib/muapi.js';
import { setupUploader, setupButtonGroup, downloadMedia } from '../lib/uiUtils.js';

/**
 * Reimagine — Atmosphere Lab / Scene Reimagining.
 * Upload an image and completely change the atmosphere, style, or season
 * while preserving the original composition.
 * Uses flux-redux for style-guided reimagination.
 */
export function Reimagine() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

  let sourceImageUrl = '';
  let isGenerating = false;

  const vibePresets = [
    { id: 'night', label: '🌙 Night Mode', prompt: 'Transform to nighttime scene, dramatic moonlight, city lights glowing, deep blue and purple tones, cinematic night photography' },
    { id: 'golden', label: '🌅 Golden Hour', prompt: 'Transform to golden hour sunset, warm orange and amber tones, long shadows, soft diffused light, romantic atmosphere' },
    { id: 'winter', label: '❄️ Winter', prompt: 'Transform to winter scene, everything covered in fresh snow, frost on surfaces, cold blue-white tones, breath-visible cold' },
    { id: 'anime', label: '🎌 Anime', prompt: 'Transform into anime illustration style, vibrant colors, cel-shading, Studio Ghibli inspired atmosphere, animated look' },
    { id: 'cyberpunk', label: '🌃 Cyberpunk', prompt: 'Transform into cyberpunk scene, neon lights everywhere, holographic signs, rain-slicked streets, pink and blue neon reflections' },
    { id: 'renaissance', label: '🎨 Renaissance', prompt: 'Transform into Renaissance oil painting style, dramatic chiaroscuro lighting, rich warm tones, classical composition, old master technique' },
    { id: 'underwater', label: '🌊 Underwater', prompt: 'Transform into an underwater scene, everything submerged, caustic light patterns, floating particles, blue-green color palette, aquatic dreamlike atmosphere' },
    { id: 'apocalyptic', label: '☢️ Post-Apocalyptic', prompt: 'Transform into post-apocalyptic scene, overgrown ruins, dramatic sky, dusty atmosphere, muted desaturated colors, survival aesthetic' },
    { id: 'noir', label: '🎬 Film Noir', prompt: 'Transform into black and white film noir style, dramatic shadows, high contrast, moody atmosphere, detective movie aesthetic' },
    { id: 'vaporwave', label: '🌸 Vaporwave', prompt: 'Transform into vaporwave aesthetic, pastel pink and blue, Greek statues, geometric shapes, retro digital art, nostalgic 80s-90s feel' }
  ];

  container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Panel -->
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-sm font-black text-emerald-400">🌌</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Atmosphere Lab</h1>
              <p class="text-[11px] text-secondary">Scene Reimagine · flux-redux</p>
            </div>
          </div>
        </div>

        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Source Image</label>
          <div id="reimagine-dropzone" class="relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-emerald-400/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[160px] bg-white/[0.02] hover:bg-white/[0.04]">
            <div class="text-4xl opacity-40 group-hover:opacity-80 transition-opacity">🖼️</div>
            <p class="text-xs text-secondary text-center">Drop an image or <span class="text-emerald-400 font-bold">click to upload</span></p>
            <input type="file" id="reimagine-file-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div id="reimagine-preview" class="hidden relative rounded-2xl overflow-hidden border border-white/10">
            <img id="reimagine-preview-img" class="w-full h-40 object-cover" />
            <button id="reimagine-clear-btn" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white/70 hover:text-red-400 flex items-center justify-center text-sm transition-colors">✕</button>
          </div>
          <input type="text" id="reimagine-url-input" placeholder="Or paste an image URL..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-400/50 transition-colors" />
        </div>

        <!-- Vibe Presets -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Atmosphere Preset</label>
          <div id="reimagine-vibe-grid" class="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            ${vibePresets.map((v, i) => `
              <button data-vibe="${v.id}" class="reimagine-vibe-btn px-3 py-2.5 rounded-xl text-[11px] font-bold border text-left transition-all ${i === 0 ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${v.label}</button>
            `).join('')}
          </div>
        </div>

        <!-- Custom Override -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Custom Vibe (Optional)</label>
          <textarea id="reimagine-prompt" rows="2" placeholder="Override: describe a custom atmosphere..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-emerald-400/50 transition-colors custom-scrollbar"></textarea>
        </div>

        <!-- Aspect Ratio -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Output Aspect Ratio</label>
          <div class="grid grid-cols-5 gap-2">
            ${['1:1', '16:9', '9:16', '4:3', '3:4'].map((ar, i) => `
              <button data-ar="${ar}" class="reimagine-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>
            `).join('')}
          </div>
        </div>

        <div class="p-6 mt-auto">
          <button id="reimagine-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
            Reimagine Scene
          </button>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_60%)]">
        <div id="reimagine-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">🌌</div>
          <p class="text-secondary text-sm text-center max-w-sm">Upload an image and choose an atmosphere preset to completely transform the mood and style.</p>
        </div>
        <div id="reimagine-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Reimagining...</p>
        </div>
        <div id="reimagine-result" class="hidden max-w-3xl w-full">
          <img id="reimagine-result-img" class="w-full rounded-3xl border border-white/10 shadow-2xl shadow-emerald-500/10" />
          <div class="flex gap-3 mt-4 justify-center">
            <button id="reimagine-download-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download</button>
            <button id="reimagine-retry-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 Try Another Vibe</button>
          </div>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const fileInput = container.querySelector('#reimagine-file-input');
    const dropzone = container.querySelector('#reimagine-dropzone');
    const preview = container.querySelector('#reimagine-preview');
    const previewImg = container.querySelector('#reimagine-preview-img');
    const clearBtn = container.querySelector('#reimagine-clear-btn');
    const urlInput = container.querySelector('#reimagine-url-input');
    const promptInput = container.querySelector('#reimagine-prompt');
    const generateBtn = container.querySelector('#reimagine-generate-btn');
    const outputEl = container.querySelector('#reimagine-output');
    const loadingEl = container.querySelector('#reimagine-loading');
    const resultEl = container.querySelector('#reimagine-result');
    const resultImg = container.querySelector('#reimagine-result-img');
    const downloadBtn = container.querySelector('#reimagine-download-btn');
    const retryBtn = container.querySelector('#reimagine-retry-btn');
    const vibeBtns = container.querySelectorAll('.reimagine-vibe-btn');
    const arBtns = container.querySelectorAll('.reimagine-ar-btn');

    let selectedVibe = vibePresets[0];
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

    setupButtonGroup(vibeBtns, {
      activeClasses: ['bg-emerald-500/20', 'border-emerald-400/40', 'text-emerald-400'],
      inactiveClasses: ['bg-white/5', 'border-white/10', 'text-secondary', 'hover:bg-white/10'],
      onSelect: (dataset) => {
        selectedVibe = vibePresets.find(v => v.id === dataset.vibe);
      }
    });

    setupButtonGroup(arBtns, {
      activeClasses: ['bg-emerald-500/20', 'border-emerald-400/40', 'text-emerald-400'],
      inactiveClasses: ['bg-white/5', 'border-white/10', 'text-secondary', 'hover:bg-white/10'],
      onSelect: (dataset) => {
        selectedAR = dataset.ar;
      }
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

      const vibePrompt = promptInput.value.trim() || selectedVibe.prompt;

      try {
        const result = await muapi.generateImage({
          model: 'flux-redux',
          prompt: vibePrompt,
          image_url: sourceImageUrl,
          aspect_ratio: selectedAR
        });

        if (result.url) {
          resultImg.src = result.url;
          loadingEl.classList.add('hidden');
          resultEl.classList.remove('hidden');
        }
      } catch (err) {
        console.error('Reimagine failed:', err);
        loadingEl.classList.add('hidden');
        outputEl.classList.remove('hidden');
        outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold text-center">⚠ ${err.message}</div>`;
      } finally {
        isGenerating = false;
        generateBtn.disabled = false;
      }
    });

    downloadBtn?.addEventListener('click', () => downloadMedia(resultImg.src, `reimagine_${Date.now()}.png`));
    retryBtn?.addEventListener('click', () => { resultEl.classList.add('hidden'); outputEl.classList.remove('hidden'); outputEl.innerHTML = `<div class="text-6xl opacity-20">🌌</div><p class="text-secondary text-sm text-center max-w-sm">Pick a different atmosphere and reimagine!</p>`; });
  });

  return container;
}
