import { muapi } from '../lib/muapi.js';
import { setupUploader, setupButtonGroup, downloadMedia } from '../lib/uiUtils.js';

/**
 * MotionMaster — Image-to-Video animation tool.
 * Upload a static image and bring it to life with cinematic motion presets.
 * Uses veo3-image-to-video or wan-2.1-video.
 */
export function MotionMaster() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

  let sourceImageUrl = '';
  let isGenerating = false;

  const motionPresets = [
    { id: 'cinematic-slowmo', label: 'Cinematic Slow-Mo', prompt: 'Slow cinematic camera movement, dramatic lighting, shallow depth of field, film grain' },
    { id: 'dynamic-pan', label: 'Dynamic Pan', prompt: 'Smooth horizontal camera pan revealing the full scene, cinematic movement' },
    { id: 'zoom-in', label: 'Dramatic Zoom', prompt: 'Slow dramatic zoom into the subject, increasing detail, cinematic focus pull' },
    { id: 'parallax', label: 'Parallax Drift', prompt: 'Subtle parallax effect with depth layers moving at different speeds, dreamy atmosphere' },
    { id: 'wind-flow', label: 'Living Scene', prompt: 'Gentle wind blowing through the scene, subtle environmental motion, leaves rustling, clouds drifting' },
    { id: 'orbit', label: 'Orbit Shot', prompt: 'Camera slowly orbits around the subject, revealing different angles, smooth dolly movement' }
  ];

  container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Panel -->
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-sm font-black text-violet-400">▶</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Motion Master</h1>
              <p class="text-[11px] text-secondary">Image → Video · veo3 / wan-2.1</p>
            </div>
          </div>
        </div>

        <!-- Source Image Upload -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Source Image</label>
          <div id="motion-dropzone" class="relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-violet-400/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[160px] bg-white/[0.02] hover:bg-white/[0.04]">
            <div class="text-4xl opacity-40 group-hover:opacity-80 transition-opacity">🎬</div>
            <p class="text-xs text-secondary text-center">Drop an image or <span class="text-violet-400 font-bold">click to upload</span></p>
            <input type="file" id="motion-file-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div id="motion-preview" class="hidden relative rounded-2xl overflow-hidden border border-white/10">
            <img id="motion-preview-img" class="w-full h-40 object-cover" />
            <button id="motion-clear-btn" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white/70 hover:text-red-400 flex items-center justify-center text-sm transition-colors">✕</button>
          </div>
          <input type="text" id="motion-url-input" placeholder="Or paste an image URL..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-400/50 transition-colors" />
        </div>

        <!-- Motion Presets -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Motion Preset</label>
          <div id="motion-presets" class="grid grid-cols-2 gap-2">
            ${motionPresets.map((p, i) => `
              <button data-preset="${p.id}" class="motion-preset-btn px-3 py-3 rounded-xl text-[11px] font-bold border transition-all text-left ${i === 0 ? 'bg-violet-500/20 border-violet-400/40 text-violet-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">
                ${p.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Custom Prompt Override -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Custom Motion (Optional)</label>
          <textarea id="motion-prompt" rows="3" placeholder="Override the preset with your own motion description..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-400/50 transition-colors custom-scrollbar"></textarea>
        </div>

        <!-- Aspect Ratio -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Aspect Ratio</label>
          <div class="grid grid-cols-4 gap-2">
            ${['16:9', '9:16', '1:1', '21:9'].map((ar, i) => `
              <button data-ar="${ar}" class="motion-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-violet-500/20 border-violet-400/40 text-violet-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>
            `).join('')}
          </div>
        </div>

        <!-- Generate Button -->
        <div class="p-6 mt-auto">
          <button id="motion-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20">
            Animate Image
          </button>
          <p class="text-[10px] text-muted text-center mt-2">Video generation can take 1-3 minutes</p>
        </div>
      </div>

      <!-- Right Panel: Output -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_60%)]">
        <div id="motion-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">🎥</div>
          <p class="text-secondary text-sm text-center max-w-sm">Upload an image and choose a motion preset to bring it to life as a cinematic video.</p>
        </div>
        <div id="motion-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Generating Motion...</p>
          <p class="text-[10px] text-muted mt-1">This may take 1-3 minutes</p>
        </div>
        <div id="motion-result" class="hidden max-w-3xl w-full flex flex-col items-center gap-4">
          <video id="motion-result-video" controls autoplay loop class="w-full rounded-3xl border border-white/10 shadow-2xl shadow-violet-500/10"></video>
          <div class="flex gap-3 justify-center">
            <button id="motion-download-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download Video</button>
            <button id="motion-retry-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 Try Different Motion</button>
          </div>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const fileInput = container.querySelector('#motion-file-input');
    const dropzone = container.querySelector('#motion-dropzone');
    const preview = container.querySelector('#motion-preview');
    const previewImg = container.querySelector('#motion-preview-img');
    const clearBtn = container.querySelector('#motion-clear-btn');
    const urlInput = container.querySelector('#motion-url-input');
    const promptInput = container.querySelector('#motion-prompt');
    const generateBtn = container.querySelector('#motion-generate-btn');
    const outputEl = container.querySelector('#motion-output');
    const loadingEl = container.querySelector('#motion-loading');
    const resultEl = container.querySelector('#motion-result');
    const resultVideo = container.querySelector('#motion-result-video');
    const downloadBtn = container.querySelector('#motion-download-btn');
    const retryBtn = container.querySelector('#motion-retry-btn');
    const presetBtns = container.querySelectorAll('.motion-preset-btn');
    const engineBtns = container.querySelectorAll('.motion-engine-btn');
    const arBtns = container.querySelectorAll('.motion-ar-btn');

    let selectedPreset = motionPresets[0];
    let selectedEngine = 'veo3-image-to-video';
    let selectedAR = '16:9';

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

    // Presets
    setupButtonGroup(presetBtns, {
      activeClasses: ['bg-violet-500/20', 'border-violet-400/40', 'text-violet-400'],
      inactiveClasses: ['bg-white/5', 'border-white/10', 'text-secondary', 'hover:bg-white/10'],
      onSelect: (dataset) => {
        selectedPreset = motionPresets.find(p => p.id === dataset.preset);
      }
    });

    // AR
    setupButtonGroup(arBtns, {
      activeClasses: ['bg-violet-500/20', 'border-violet-400/40', 'text-violet-400'],
      inactiveClasses: ['bg-white/5', 'border-white/10', 'text-secondary', 'hover:bg-white/10'],
      onSelect: (dataset) => {
        selectedAR = dataset.ar;
      }
    });

    generateBtn.addEventListener('click', async () => {
      if (isGenerating) return;
      if (!sourceImageUrl) { alert('Please upload an image to animate.'); return; }

      isGenerating = true;
      generateBtn.disabled = true;
      outputEl.classList.add('hidden');
      resultEl.classList.add('hidden');
      loadingEl.classList.remove('hidden');
      loadingEl.classList.add('flex');

      const motionPrompt = promptInput.value.trim() || selectedPreset.prompt;

      try {
        const result = await muapi.generateVideo({
          model: selectedEngine,
          prompt: motionPrompt,
          image_url: sourceImageUrl,
          aspect_ratio: selectedAR
        });

        if (result.url) {
          resultVideo.src = result.url;
          loadingEl.classList.add('hidden');
          resultEl.classList.remove('hidden');
        }
      } catch (err) {
        console.error('Motion generation failed:', err);
        loadingEl.classList.add('hidden');
        outputEl.classList.remove('hidden');
        outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold text-center">⚠ ${err.message}</div>`;
      } finally {
        isGenerating = false;
        generateBtn.disabled = false;
      }
    });

    downloadBtn?.addEventListener('click', () => downloadMedia(resultVideo.src, `motion_${Date.now()}.mp4`));
    retryBtn?.addEventListener('click', () => { resultEl.classList.add('hidden'); outputEl.classList.remove('hidden'); outputEl.innerHTML = `<div class="text-6xl opacity-20">🎥</div><p class="text-secondary text-sm text-center max-w-sm">Try a different motion preset or custom prompt!</p>`; });
  });

  return container;
}
