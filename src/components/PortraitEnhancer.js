import { muapi } from '../lib/muapi.js';

/**
 * PortraitEnhancer — Smart Portrait Enhancement.
 * Upload a portrait and enhance facial features with
 * grouped sliders for skin, eyes, hair and lighting.
 * Uses google-imagen4-ultra for quality enhancement.
 */
export function PortraitEnhancer() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

  let sourceUrl = '';
  let isGenerating = false;

  const enhanceModes = [
    { id: 'natural', label: '🌿 Natural Fix', desc: 'Subtle corrections only', prompt: 'Enhance this portrait photo with subtle natural corrections. Slightly improve skin clarity, brighten eyes naturally, fix minor blemishes. Keep it looking completely natural and unedited.' },
    { id: 'studio', label: '📸 Studio Portrait', desc: 'Professional headshot look', prompt: 'Transform this into a professional studio portrait. Perfect skin retouching, studio-quality lighting, sharp focus on eyes, soft background blur, commercial beauty photography quality.' },
    { id: 'cinematic', label: '🎬 Cinematic Close-Up', desc: 'Movie-quality dramatic look', prompt: 'Enhance this portrait with cinematic lighting. Dramatic shadows, rim lighting, film-grain texture, movie-quality color grading, sharp detailed eyes, Hollywood headshot quality.' },
    { id: 'glamour', label: '✨ Glamour', desc: 'High-fashion editorial', prompt: 'Enhance this portrait to high-fashion editorial quality. Flawless skin, luminous glow, detailed eyes with catchlights, fashion magazine retouching, premium beauty photography.' },
    { id: 'vintage', label: '📷 Vintage Film', desc: 'Classic film photography', prompt: 'Enhance this portrait with classic film photography look. Warm analog tones, subtle film grain, soft focus glow, vintage color palette, retro portrait photography aesthetic.' }
  ];

  container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-sm font-black text-amber-400">Prt</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Portrait Enhancer</h1>
              <p class="text-[11px] text-secondary">Face / Skin / Eyes · google-imagen4</p>
            </div>
          </div>
        </div>

        <!-- Source Image -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Portrait Photo</label>
          <div id="prt-dropzone" class="relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-amber-400/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[160px] bg-white/[0.02] hover:bg-white/[0.04]">
            <div class="text-4xl opacity-40 group-hover:opacity-80">🧑‍🎨</div>
            <p class="text-xs text-secondary text-center">Drop a portrait or <span class="text-amber-400 font-bold">click to upload</span></p>
            <input type="file" id="prt-file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div id="prt-preview" class="hidden relative rounded-2xl overflow-hidden border border-white/10">
            <img id="prt-img" class="w-full h-48 object-cover" />
            <button id="prt-clear" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white/70 hover:text-red-400 flex items-center justify-center text-sm">✕</button>
          </div>
          <input type="text" id="prt-url" placeholder="Or paste an image URL..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-colors" />
        </div>

        <!-- Enhancement Mode -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Enhancement Mode</label>
          <div class="space-y-2">
            ${enhanceModes.map((m, i) => `
              <button data-mode="${m.id}" class="prt-mode-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border ${i === 0 ? 'bg-amber-500/15 border-amber-400/30' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}">
                <span class="text-lg">${m.label.split(' ')[0]}</span>
                <div>
                  <span class="text-xs font-bold ${i === 0 ? 'text-amber-400' : 'text-white/80'}">${m.label.split(' ').slice(1).join(' ')}</span>
                  <p class="text-[10px] text-muted">${m.desc}</p>
                </div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Fine-Tuning Sliders -->
        <div class="p-6 border-b border-white/5 space-y-4">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Fine-Tuning</label>
          ${[
      { id: 'skin', label: 'Skin Smoothing', def: 50 },
      { id: 'eyes', label: 'Eye Enhancement', def: 60 },
      { id: 'sharpness', label: 'Overall Sharpness', def: 40 },
      { id: 'lighting', label: 'Lighting Boost', def: 30 }
    ].map(s => `
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <span class="text-[10px] text-secondary font-bold">${s.label}</span>
                <span id="prt-${s.id}-val" class="text-[10px] font-bold text-amber-400">${s.def}%</span>
              </div>
              <input type="range" id="prt-${s.id}" min="0" max="100" step="5" value="${s.def}" class="w-full accent-amber-400 h-1" />
            </div>
          `).join('')}
        </div>

        <div class="p-6 mt-auto">
          <button id="prt-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20">
            Enhance Portrait
          </button>
        </div>
      </div>

      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_60%)]">
        <div id="prt-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">🧑‍🎨</div>
          <p class="text-secondary text-sm text-center max-w-sm">Upload a portrait and choose an enhancement mode to professionally retouch facial features.</p>
        </div>
        <div id="prt-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Enhancing Portrait...</p>
        </div>
        <div id="prt-result" class="hidden max-w-3xl w-full">
          <div class="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-amber-500/10">
            <img id="prt-result-img" class="w-full" />
            <div class="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500/90 text-[10px] font-black uppercase tracking-wider" id="prt-result-badge"></div>
          </div>
          <div class="flex gap-3 mt-4 justify-center">
            <button id="prt-download" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download</button>
            <button id="prt-retry" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 Try Different Mode</button>
          </div>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const fileInput = container.querySelector('#prt-file');
    const dropzone = container.querySelector('#prt-dropzone');
    const preview = container.querySelector('#prt-preview');
    const previewImg = container.querySelector('#prt-img');
    const clearBtn = container.querySelector('#prt-clear');
    const urlInput = container.querySelector('#prt-url');
    const generateBtn = container.querySelector('#prt-generate-btn');
    const outputEl = container.querySelector('#prt-output');
    const loadingEl = container.querySelector('#prt-loading');
    const resultEl = container.querySelector('#prt-result');
    const resultImg = container.querySelector('#prt-result-img');
    const resultBadge = container.querySelector('#prt-result-badge');
    const modeBtns = container.querySelectorAll('.prt-mode-btn');

    let selectedMode = enhanceModes[0];

    const handleFile = (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => { sourceUrl = e.target.result; previewImg.src = sourceUrl; dropzone.classList.add('hidden'); preview.classList.remove('hidden'); urlInput.value = ''; };
      reader.readAsDataURL(file);
    };

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    dropzone.addEventListener('dragover', (e) => e.preventDefault());
    dropzone.addEventListener('drop', (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });
    clearBtn.addEventListener('click', () => { sourceUrl = ''; dropzone.classList.remove('hidden'); preview.classList.add('hidden'); });
    urlInput.addEventListener('change', () => { if (urlInput.value.trim()) { sourceUrl = urlInput.value.trim(); previewImg.src = sourceUrl; dropzone.classList.add('hidden'); preview.classList.remove('hidden'); } });

    // Mode selection
    modeBtns.forEach(btn => btn.addEventListener('click', () => {
      modeBtns.forEach(b => { b.className = b.className.replace(/bg-amber-500\/15 border-amber-400\/30/g, 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'); b.querySelector('span:last-child div span:first-child')?.classList.remove('text-amber-400'); b.querySelector('span:last-child div span:first-child')?.classList.add('text-white/80'); });
      btn.className = btn.className.replace(/bg-white\/\[0\.03\] border-white\/5 hover:bg-white\/\[0\.06\]/g, 'bg-amber-500/15 border-amber-400/30');
      btn.querySelector('span:last-child div span:first-child')?.classList.remove('text-white/80');
      btn.querySelector('span:last-child div span:first-child')?.classList.add('text-amber-400');
      selectedMode = enhanceModes.find(m => m.id === btn.dataset.mode);
    }));

    // Slider value displays
    ['skin', 'eyes', 'sharpness', 'lighting'].forEach(id => {
      const slider = container.querySelector(`#prt-${id}`);
      const val = container.querySelector(`#prt-${id}-val`);
      slider.addEventListener('input', () => { val.textContent = `${slider.value}%`; });
    });

    generateBtn.addEventListener('click', async () => {
      if (isGenerating) return;
      if (!sourceUrl) { alert('Please upload a portrait.'); return; }

      isGenerating = true; generateBtn.disabled = true;
      outputEl.classList.add('hidden'); resultEl.classList.add('hidden');
      loadingEl.classList.remove('hidden'); loadingEl.classList.add('flex');

      const skin = container.querySelector('#prt-skin').value;
      const eyes = container.querySelector('#prt-eyes').value;
      const sharpness = container.querySelector('#prt-sharpness').value;
      const lighting = container.querySelector('#prt-lighting').value;

      const fineDetails = `Skin smoothing: ${skin}%. Eye enhancement: ${eyes}%. Sharpness: ${sharpness}%. Lighting boost: ${lighting}%.`;

      try {
        const result = await muapi.generateImage({
          model: 'z-image-base',
          prompt: `${selectedMode.prompt} ${fineDetails}`,
          image_url: sourceUrl,
          aspect_ratio: '1:1'
        });
        if (result.url) {
          resultImg.src = result.url;
          resultBadge.textContent = selectedMode.label.split(' ').slice(1).join(' ');
          loadingEl.classList.add('hidden');
          resultEl.classList.remove('hidden');
        }
      } catch (err) {
        console.error('Portrait enhance failed:', err);
        loadingEl.classList.add('hidden'); outputEl.classList.remove('hidden');
        outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold text-center">⚠ ${err.message}</div>`;
      } finally { isGenerating = false; generateBtn.disabled = false; }
    });

    container.querySelector('#prt-download')?.addEventListener('click', () => { const a = document.createElement('a'); a.href = resultImg.src; a.download = `portrait_${Date.now()}.png`; a.click(); });
    container.querySelector('#prt-retry')?.addEventListener('click', () => { resultEl.classList.add('hidden'); outputEl.classList.remove('hidden'); outputEl.innerHTML = `<div class="text-6xl opacity-20">🧑‍🎨</div><p class="text-secondary text-sm text-center max-w-sm">Select a different enhancement mode and try again!</p>`; });
  });

  return container;
}
