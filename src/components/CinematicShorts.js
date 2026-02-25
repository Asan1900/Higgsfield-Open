import { muapi } from '../lib/muapi.js';

/**
 * CinematicShorts — Multi-scene storyboard video generator.
 * Write multiple scenes and generate each shot individually,
 * creating a short film with consistent style.
 * Uses veo3-text-to-video and veo3-image-to-video.
 */
export function CinematicShorts() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

    let isGenerating = false;
    let scenes = [
        { id: 1, prompt: '', type: 'text', imageUrl: '', result: null }
    ];

    const filmStyles = [
        { id: 'blockbuster', label: '🎬 Blockbuster', style: 'Hollywood blockbuster cinematography, epic scale, dramatic lighting, professional color grading' },
        { id: 'indie', label: '🎥 Indie Film', style: 'Independent film aesthetic, natural lighting, handheld camera, intimate framing, subdued colors' },
        { id: 'documentary', label: '📹 Documentary', style: 'Documentary style, observational camera, natural light, authentic atmosphere, steadicam movement' },
        { id: 'music-video', label: '🎵 Music Video', style: 'Music video style, dynamic cuts, stylized lighting, high energy, creative angles, fast transitions' },
        { id: 'commercial', label: '💎 Commercial', style: 'High-end commercial, product-shot quality, perfect lighting, glossy finish, premium feel' },
        { id: 'horror', label: '👻 Horror', style: 'Horror film atmosphere, unsettling camera angles, dark shadows, tension-building, suspenseful' }
    ];

    container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <div class="w-full lg:w-[460px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-lg font-black text-amber-400">🎞️</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Cinematic Shorts</h1>
              <p class="text-[11px] text-secondary">Multi-Scene Storyboard · veo3</p>
            </div>
          </div>
        </div>

        <!-- Film Style -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Film Style (Global)</label>
          <div class="grid grid-cols-2 gap-2">
            ${filmStyles.map((s, i) => `
              <button data-style="${s.id}" class="cs-style-btn px-3 py-2.5 rounded-xl text-[11px] font-bold border text-left transition-all ${i === 0 ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${s.label}</button>
            `).join('')}
          </div>
        </div>

        <!-- Scenes -->
        <div class="p-6 border-b border-white/5 space-y-4">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Storyboard Scenes</label>
            <button id="cs-add-scene" class="px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[10px] font-bold text-amber-400 hover:bg-amber-500/25 transition-all">+ Add Scene</button>
          </div>
          <div id="cs-scenes-list" class="space-y-3"></div>
        </div>

        <!-- AR -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Aspect Ratio</label>
          <div class="grid grid-cols-4 gap-2">
            ${['16:9', '9:16', '1:1', '21:9'].map((ar, i) => `
              <button data-ar="${ar}" class="cs-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>
            `).join('')}
          </div>
        </div>

        <div class="p-6 mt-auto">
          <button id="cs-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20">
            Generate All Scenes
          </button>
          <p class="text-[10px] text-muted text-center mt-2">Each scene takes 1-3 minutes</p>
        </div>
      </div>

      <div class="flex-1 flex flex-col items-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_60%)]">
        <div id="cs-output" class="flex flex-col items-center gap-6 animate-fade-in w-full max-w-4xl">
          <div class="text-6xl opacity-20">🎞️</div>
          <p class="text-secondary text-sm text-center max-w-sm">Add scenes to your storyboard and generate a multi-shot cinematic short film.</p>
        </div>
        <div id="cs-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p id="cs-progress" class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Generating Scene 0/0...</p>
        </div>
        <div id="cs-results" class="hidden w-full max-w-4xl space-y-6">
          <h2 class="text-sm font-black uppercase tracking-wider text-white/50 text-center">Your Short Film</h2>
          <div id="cs-result-grid" class="space-y-4"></div>
        </div>
      </div>
    </div>
  `;

    requestAnimationFrame(() => {
        const scenesList = container.querySelector('#cs-scenes-list');
        const addSceneBtn = container.querySelector('#cs-add-scene');
        const generateBtn = container.querySelector('#cs-generate-btn');
        const outputEl = container.querySelector('#cs-output');
        const loadingEl = container.querySelector('#cs-loading');
        const progressEl = container.querySelector('#cs-progress');
        const resultsEl = container.querySelector('#cs-results');
        const resultGrid = container.querySelector('#cs-result-grid');
        const styleBtns = container.querySelectorAll('.cs-style-btn');
        const arBtns = container.querySelectorAll('.cs-ar-btn');

        let selectedStyle = filmStyles[0];
        let selectedAR = '16:9';

        const renderScenes = () => {
            scenesList.innerHTML = scenes.map((s, i) => `
        <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-black text-amber-400 uppercase tracking-wider">Scene ${i + 1}</span>
            ${scenes.length > 1 ? `<button data-remove="${i}" class="cs-remove-scene text-[10px] text-red-400/60 hover:text-red-400 font-bold">✕ Remove</button>` : ''}
          </div>
          <textarea data-scene="${i}" rows="2" placeholder="Scene ${i + 1} description... e.g. 'A door slowly opens revealing bright light'" class="cs-scene-prompt w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 resize-none focus:outline-none focus:border-amber-400/50 transition-colors">${s.prompt}</textarea>
        </div>
      `).join('');

            scenesList.querySelectorAll('.cs-scene-prompt').forEach(el => {
                el.addEventListener('input', () => { scenes[parseInt(el.dataset.scene)].prompt = el.value; });
            });
            scenesList.querySelectorAll('.cs-remove-scene').forEach(el => {
                el.addEventListener('click', () => { scenes.splice(parseInt(el.dataset.remove), 1); renderScenes(); });
            });
        };

        addSceneBtn.addEventListener('click', () => {
            if (scenes.length >= 8) { alert('Maximum 8 scenes per short film.'); return; }
            scenes.push({ id: scenes.length + 1, prompt: '', type: 'text', imageUrl: '', result: null });
            renderScenes();
        });

        renderScenes();

        styleBtns.forEach(btn => btn.addEventListener('click', () => {
            styleBtns.forEach(b => { b.className = b.className.replace(/bg-amber-500\/20 border-amber-400\/40 text-amber-400/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); });
            btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-amber-500/20 border-amber-400/40 text-amber-400');
            selectedStyle = filmStyles.find(s => s.id === btn.dataset.style);
        }));

        arBtns.forEach(btn => btn.addEventListener('click', () => {
            arBtns.forEach(b => { b.className = b.className.replace(/bg-amber-500\/20 border-amber-400\/40 text-amber-400/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); });
            btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-amber-500/20 border-amber-400/40 text-amber-400');
            selectedAR = btn.dataset.ar;
        }));

        generateBtn.addEventListener('click', async () => {
            if (isGenerating) return;
            const validScenes = scenes.filter(s => s.prompt.trim());
            if (validScenes.length === 0) { alert('Please add at least one scene with a description.'); return; }

            isGenerating = true; generateBtn.disabled = true;
            outputEl.classList.add('hidden'); resultsEl.classList.add('hidden');
            loadingEl.classList.remove('hidden'); loadingEl.classList.add('flex');
            resultGrid.innerHTML = '';

            for (let i = 0; i < scenes.length; i++) {
                if (!scenes[i].prompt.trim()) continue;
                progressEl.textContent = `Generating Scene ${i + 1}/${scenes.length}...`;

                try {
                    const result = await muapi.generateVideo({
                        model: 'veo3-video',
                        prompt: `Scene ${i + 1}: ${scenes[i].prompt.trim()}. ${selectedStyle.style}. Continuous shot, professional cinematography.`,
                        aspect_ratio: selectedAR
                    });
                    scenes[i].result = result.url || null;
                } catch (err) {
                    console.error(`Scene ${i + 1} failed:`, err);
                    scenes[i].result = null;
                }
            }

            loadingEl.classList.add('hidden');
            resultsEl.classList.remove('hidden');
            scenes.forEach((s, i) => {
                if (s.result) {
                    resultGrid.innerHTML += `
            <div class="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
              <div class="px-4 py-2 border-b border-white/5 flex justify-between items-center">
                <span class="text-[10px] font-black text-amber-400 uppercase">Scene ${i + 1}</span>
                <button data-url="${s.result}" class="cs-dl-single text-[10px] font-bold text-secondary hover:text-white">⬇ Download</button>
              </div>
              <video src="${s.result}" controls autoplay loop muted class="w-full"></video>
            </div>`;
                } else if (s.prompt.trim()) {
                    resultGrid.innerHTML += `<div class="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center text-red-400 text-xs font-bold">Scene ${i + 1} — Generation Failed</div>`;
                }
            });
            resultGrid.querySelectorAll('.cs-dl-single').forEach(btn => btn.addEventListener('click', () => { const a = document.createElement('a'); a.href = btn.dataset.url; a.download = `scene_${Date.now()}.mp4`; a.click(); }));
            isGenerating = false; generateBtn.disabled = false;
        });
    });

    return container;
}
