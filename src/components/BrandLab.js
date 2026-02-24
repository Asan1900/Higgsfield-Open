import { muapi } from '../lib/muapi.js';

/**
 * BrandLab — Typography & Logo Design Studio.
 * Specialized for text-heavy AI graphics using ideogram-v3-t2i
 * with style presets for different design aesthetics.
 */
export function BrandLab() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

    let isGenerating = false;

    const stylePresets = [
        { id: 'neon', label: '🌃 Cyberpunk Neon', suffix: ', neon lights, glowing text, cyberpunk city background, vibrant pink and blue, high contrast' },
        { id: 'minimal', label: '⬜ Minimalist', suffix: ', clean minimalist design, white background, sharp edges, modern sans-serif typography, flat design' },
        { id: 'retro', label: '📺 Vintage Retro', suffix: ', retro vintage style, warm tones, distressed texture, 70s typography, analog feel' },
        { id: 'luxury', label: '✨ Luxury Gold', suffix: ', luxury premium design, gold foil text, black marble background, elegant serif font, sophisticated' },
        { id: 'graffiti', label: '🎨 Street Art', suffix: ', urban graffiti style, spray paint texture, brick wall background, bold street art typography, vibrant colors' },
        { id: '3d', label: '🧊 3D Render', suffix: ', 3D rendered text, glossy material, dramatic studio lighting, depth of field, photorealistic 3D typography' },
        { id: 'anime', label: '🎌 Anime Style', suffix: ', anime illustration style, vibrant colors, manga-inspired lettering, dynamic composition' },
        { id: 'cinematic', label: '🎬 Movie Poster', suffix: ', cinematic movie poster style, dramatic lighting, epic composition, Hollywood blockbuster typography' }
    ];

    container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Panel -->
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-sm font-black text-amber-400">Aa</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Brand Lab</h1>
              <p class="text-[11px] text-secondary">Typography & Logo · ideogram-v3</p>
            </div>
          </div>
        </div>

        <!-- Text Input -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Brand Text / Title</label>
          <input type="text" id="brand-text" placeholder="e.g. OPEN HIGGSFIELD" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-colors tracking-tight" />
        </div>

        <!-- Description -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Design Description</label>
          <textarea id="brand-desc" rows="3" placeholder="Describe the overall design... e.g. 'A tech company logo with futuristic elements, electric blue accents'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-amber-400/50 transition-colors custom-scrollbar"></textarea>
        </div>

        <!-- Style Presets Grid -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Style Preset</label>
          <div id="brand-style-grid" class="grid grid-cols-2 gap-2">
            ${stylePresets.map((s, i) => `
              <button data-style="${s.id}" class="brand-style-btn px-3 py-2.5 rounded-xl text-[11px] font-bold border text-left transition-all ${i === 0 ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${s.label}</button>
            `).join('')}
          </div>
        </div>

        <!-- Render Speed & Style -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Render Quality</label>
          <div class="grid grid-cols-3 gap-2">
            ${['Turbo', 'Balanced', 'Quality'].map((q, i) => `
              <button data-quality="${q}" class="brand-quality-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 1 ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${q}</button>
            `).join('')}
          </div>
        </div>

        <!-- Aspect Ratio -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Aspect Ratio</label>
          <div class="grid grid-cols-5 gap-2">
            ${['1:1', '16:9', '9:16', '4:3', '3:4'].map((ar, i) => `
              <button data-ar="${ar}" class="brand-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>
            `).join('')}
          </div>
        </div>

        <!-- Generate -->
        <div class="p-6 mt-auto">
          <button id="brand-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20">
            Generate Design
          </button>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_60%)]">
        <div id="brand-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">🅰️</div>
          <p class="text-secondary text-sm text-center max-w-sm">Enter your brand text, choose a style, and generate professional-quality typography and logo designs.</p>
        </div>
        <div id="brand-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Designing...</p>
        </div>
        <div id="brand-result" class="hidden max-w-3xl w-full">
          <img id="brand-result-img" class="w-full rounded-3xl border border-white/10 shadow-2xl shadow-amber-500/10" />
          <div class="flex gap-3 mt-4 justify-center">
            <button id="brand-download-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download</button>
            <button id="brand-variation-btn" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🎨 New Variation</button>
          </div>
        </div>
      </div>
    </div>
  `;

    requestAnimationFrame(() => {
        const textInput = container.querySelector('#brand-text');
        const descInput = container.querySelector('#brand-desc');
        const generateBtn = container.querySelector('#brand-generate-btn');
        const outputEl = container.querySelector('#brand-output');
        const loadingEl = container.querySelector('#brand-loading');
        const resultEl = container.querySelector('#brand-result');
        const resultImg = container.querySelector('#brand-result-img');
        const downloadBtn = container.querySelector('#brand-download-btn');
        const variationBtn = container.querySelector('#brand-variation-btn');
        const styleBtns = container.querySelectorAll('.brand-style-btn');
        const qualityBtns = container.querySelectorAll('.brand-quality-btn');
        const arBtns = container.querySelectorAll('.brand-ar-btn');

        let selectedStyle = stylePresets[0];
        let selectedQuality = 'Balanced';
        let selectedAR = '1:1';

        const wireToggle = (btns, activeCls, inactiveCls, onSelect) => {
            btns.forEach(btn => btn.addEventListener('click', () => {
                btns.forEach(b => { b.className = b.className.replace(new RegExp(activeCls.replace(/\//g, '\\/'), 'g'), inactiveCls); });
                btn.className = btn.className.replace(new RegExp(inactiveCls.replace(/\//g, '\\/'), 'g'), activeCls);
                onSelect(btn);
            }));
        };

        wireToggle(styleBtns, 'bg-amber-500/20 border-amber-400/40 text-amber-400', 'bg-white/5 border-white/10 text-secondary hover:bg-white/10', (btn) => { selectedStyle = stylePresets.find(s => s.id === btn.dataset.style); });
        wireToggle(qualityBtns, 'bg-amber-500/20 border-amber-400/40 text-amber-400', 'bg-white/5 border-white/10 text-secondary hover:bg-white/10', (btn) => { selectedQuality = btn.dataset.quality; });
        wireToggle(arBtns, 'bg-amber-500/20 border-amber-400/40 text-amber-400', 'bg-white/5 border-white/10 text-secondary hover:bg-white/10', (btn) => { selectedAR = btn.dataset.ar; });

        generateBtn.addEventListener('click', async () => {
            if (isGenerating) return;
            const brandText = textInput.value.trim();
            if (!brandText) { alert('Please enter brand text or a title.'); return; }

            isGenerating = true;
            generateBtn.disabled = true;
            outputEl.classList.add('hidden');
            resultEl.classList.add('hidden');
            loadingEl.classList.remove('hidden');
            loadingEl.classList.add('flex');

            const desc = descInput.value.trim();
            const prompt = `A professional design with the text "${brandText}" prominently displayed. ${desc ? desc + '.' : ''} ${selectedStyle.suffix}`;

            try {
                const result = await muapi.generateImage({
                    model: 'ideogram-v3-t2i',
                    prompt: prompt,
                    aspect_ratio: selectedAR,
                    render_speed: selectedQuality,
                    style: 'Design'
                });

                if (result.url) {
                    resultImg.src = result.url;
                    loadingEl.classList.add('hidden');
                    resultEl.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Brand generation failed:', err);
                loadingEl.classList.add('hidden');
                outputEl.classList.remove('hidden');
                outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold text-center">⚠ ${err.message}</div>`;
            } finally {
                isGenerating = false;
                generateBtn.disabled = false;
            }
        });

        downloadBtn?.addEventListener('click', () => { const a = document.createElement('a'); a.href = resultImg.src; a.download = `brand_${Date.now()}.png`; a.click(); });
        variationBtn?.addEventListener('click', () => { resultEl.classList.add('hidden'); outputEl.classList.remove('hidden'); outputEl.innerHTML = `<div class="text-6xl opacity-20">🅰️</div><p class="text-secondary text-sm text-center max-w-sm">Try a different style preset for a new variation!</p>`; });
    });

    return container;
}
