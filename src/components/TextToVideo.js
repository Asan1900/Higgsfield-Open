import { muapi } from '../lib/muapi.js';

/**
 * TextToVideo — Unified AI video generation from text.
 * Combines Simple mode (genres/styles) and Pro mode (camera/lighting/mood).
 * Uses veo3-video and wan-2.1 models.
 */
export function TextToVideo() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';

  let isGenerating = false;
  let currentMode = 'simple'; // 'simple' or 'pro'

  // Simple Mode Data
  const genrePresets = [
    { id: 'cinematic', label: '🎬 Cinematic', prompt: 'Cinematic shot, professional film quality, dramatic lighting, 24fps' },
    { id: 'nature', label: '🌿 Nature', prompt: 'National Geographic quality, natural lighting, wildlife documentary' },
    { id: 'scifi', label: '🚀 Sci-Fi', prompt: 'Science fiction, futuristic technology, neon lighting, cyberpunk' },
    { id: 'anime', label: '🎌 Anime Style', prompt: 'Japanese anime animation style, vibrant colors, studio quality' },
    { id: 'aerial', label: '🚁 Aerial', prompt: 'Aerial drone footage, bird eye view, sweeping movement' },
    { id: 'timelapse', label: '⏰ Timelapse', prompt: 'Time-lapse photography, clouds moving rapidly, time passing' }
  ];

  const styleModifiers = [
    { id: 'moody', label: '🌙 Moody', value: 'dark moody atmosphere, desaturated' },
    { id: 'vibrant', label: '🌈 Vibrant', value: 'vibrant saturated colors, dynamic' },
    { id: 'retro', label: '📼 Retro', value: 'vintage VHS aesthetic, film grain' },
    { id: 'dreamy', label: '☁️ Dreamy', value: 'soft focus, pastel colors, ethereal' }
  ];

  // Pro Mode Data
  const cameras = [
    { id: 'static', label: '📷 Static', desc: 'Fixed camera' },
    { id: 'dolly', label: '🛤️ Dolly In', desc: 'Smooth push toward subject' },
    { id: 'crane', label: '🏗️ Crane Up', desc: 'Rising reveal' },
    { id: 'tracking', label: '🏃 Tracking', desc: 'Follow subject' },
    { id: 'orbit', label: '🔄 Orbit', desc: '360° around subject' },
    { id: 'handheld', label: '📱 Handheld', desc: 'Organic feel' }
  ];

  const lighting = [
    { id: 'golden', label: '☀️ Golden Hour' }, { id: 'blue', label: '🌙 Blue Hour' },
    { id: 'studio', label: '💡 Studio 3-Point' }, { id: 'neon', label: '🔮 Cyberpunk' },
    { id: 'natural', label: '🌤️ Daylight' }, { id: 'dramatic', label: '🎭 Chiaroscuro' }
  ];

  const moods = [
    { id: 'epic', label: '⚔️ Epic' }, { id: 'peaceful', label: '🕊️ Peaceful' },
    { id: 'tense', label: '😰 Tense' }, { id: 'romantic', label: '💕 Romantic' }
  ];

  container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Sidebar: Controls -->
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-lg font-black text-red-400">🎬</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">AI Video Studio</h1>
              <p class="text-[11px] text-secondary">Text to Video · veo3 & wan-2.1</p>
            </div>
          </div>
        </div>

        <!-- Mode Selection Tabs -->
        <div class="p-4 border-b border-white/5 flex gap-2">
          <button id="t2v-tab-simple" class="flex-1 py-2 text-xs font-bold rounded-xl bg-red-500/20 text-red-400 border border-red-400/30 transition-all">Simple (Genres)</button>
          <button id="t2v-tab-pro" class="flex-1 py-2 text-xs font-bold rounded-xl bg-white/5 text-secondary border border-white/10 hover:bg-white/10 transition-all">Pro (Director)</button>
        </div>

        <!-- Unified Prompt Input -->
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Scene Description</label>
          <textarea id="t2v-prompt" rows="3" placeholder="Describe your video scene... e.g. 'A lone astronaut walks through glowing flowers'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-400/50 transition-colors custom-scrollbar"></textarea>
          <div class="flex gap-2" id="t2v-simple-actions">
            <button id="t2v-surprise-btn" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-secondary hover:bg-white/10 transition-all">🎲 Surprise Me</button>
            <button id="t2v-enhance-btn" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-secondary hover:bg-white/10 transition-all">✨ Enhance</button>
          </div>
        </div>

        <!-- Simple Mode Settings -->
        <div id="t2v-simple-settings" class="block animate-fade-in">
          <div class="p-6 border-b border-white/5 space-y-3">
            <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Genre Preset</label>
            <div class="grid grid-cols-2 gap-2">
              ${genrePresets.map((p, i) => `
                <button data-preset="${p.id}" class="t2v-preset-btn px-3 py-2 rounded-xl text-[11px] font-bold border text-left transition-all ${i === 0 ? 'bg-red-500/20 border-red-400/40 text-red-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${p.label}</button>
              `).join('')}
            </div>
          </div>
          <div class="p-6 border-b border-white/5 space-y-3">
            <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Style Modifiers</label>
            <div class="flex flex-wrap gap-2">
              ${styleModifiers.map(s => `
                <button data-style="${s.id}" class="t2v-style-btn px-3 py-2 rounded-xl text-[10px] font-bold border bg-white/5 border-white/10 text-secondary hover:bg-white/10 transition-all">${s.label}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Pro Mode Settings -->
        <div id="t2v-pro-settings" class="hidden animate-fade-in">
          <div class="p-6 border-b border-white/5 space-y-3 bg-purple-500/5">
            <label class="text-[10px] font-black text-purple-400/70 uppercase tracking-[0.3em] flex items-center justify-between">
              Camera Movement <span class="text-xs">🎥</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              ${cameras.map((c, i) => `<button data-cam="${c.id}" class="t2v-cam-btn p-2 rounded-xl text-left border transition-all ${i === 0 ? 'bg-purple-500/20 border-purple-400/50 text-purple-300' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}"><div class="text-[11px] font-bold">${c.label}</div><div class="text-[9px] opacity-60">${c.desc}</div></button>`).join('')}
            </div>
          </div>
          <div class="p-6 border-b border-white/5 space-y-3 bg-amber-500/5">
            <label class="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.3em] flex items-center justify-between">
              Lighting <span class="text-xs">💡</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              ${lighting.map((l, i) => `<button data-light="${l.id}" class="t2v-light-btn px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-amber-500/20 border-amber-400/50 text-amber-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${l.label}</button>`).join('')}
            </div>
          </div>
          <div class="p-6 border-b border-white/5 space-y-3 bg-blue-500/5">
            <label class="text-[10px] font-black text-blue-400/70 uppercase tracking-[0.3em] flex items-center justify-between">
              Atmosphere / Mood <span class="text-xs">🎭</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              ${moods.map((m, i) => `<button data-mood="${m.id}" class="t2v-mood-btn px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-blue-500/20 border-blue-400/50 text-blue-300' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${m.label}</button>`).join('')}
            </div>
          </div>
        </div>

        <!-- Common Engine & AR -->
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Engine</label>
            <div class="grid grid-cols-2 gap-2">
              <button id="t2v-engine-veo3" class="t2v-engine-btn px-3 py-2 rounded-xl text-[11px] font-bold border bg-red-500/20 border-red-400/40 text-red-400 transition-all">Veo 3</button>
              <button id="t2v-engine-wan" class="t2v-engine-btn px-3 py-2 rounded-xl text-[11px] font-bold border bg-white/5 border-white/10 text-secondary hover:bg-white/10 transition-all">WAN 2.1</button>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Aspect Ratio</label>
            <div class="grid grid-cols-4 gap-2">
              ${['16:9', '9:16', '1:1', '21:9'].map((ar, i) => `
                <button data-ar="${ar}" class="t2v-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-red-500/20 border-red-400/40 text-red-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="p-6 mt-auto">
          <button id="t2v-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/20">
            Generate Video
          </button>
          <p class="text-[10px] text-muted text-center mt-2">Takes 1-3 minutes</p>
        </div>
      </div>

      <!-- Right Area: Preview -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_60%)]">
        <div id="t2v-output" class="flex flex-col items-center gap-6 animate-fade-in w-full max-w-sm text-center">
          <div class="text-6xl opacity-20">🎬</div>
          <p class="text-secondary text-sm">Design your video prompt. Use 'Simple' for quick aesthetic styles or 'Pro' to dial in exact camera and lighting direction.</p>
        </div>
        <div id="t2v-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Rendering Video...</p>
        </div>
        <div id="t2v-result" class="hidden max-w-3xl w-full flex flex-col items-center gap-4">
          <video id="t2v-result-video" controls autoplay loop class="w-full rounded-3xl border border-white/10 shadow-2xl shadow-red-500/10"></video>
          <div class="flex gap-3 justify-center">
            <button id="t2v-download" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download</button>
            <button id="t2v-retry" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 Generate Another</button>
          </div>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    // Mode Switching
    const tabSimple = container.querySelector('#t2v-tab-simple');
    const tabPro = container.querySelector('#t2v-tab-pro');
    const simpleSettings = container.querySelector('#t2v-simple-settings');
    const proSettings = container.querySelector('#t2v-pro-settings');
    const simpleActions = container.querySelector('#t2v-simple-actions');

    const setMode = (mode) => {
      currentMode = mode;
      if (mode === 'simple') {
        tabSimple.className = tabSimple.className.replace(/bg-white\/5 text-secondary border-white\/10 hover:bg-white\/10/, 'bg-red-500/20 text-red-400 border-red-400/30');
        tabPro.className = tabPro.className.replace(/bg-red-500\/20 text-red-400 border-red-400\/30/, 'bg-white/5 text-secondary border-white/10 hover:bg-white/10');
        simpleSettings.classList.remove('hidden');
        simpleSettings.classList.add('block');
        proSettings.classList.add('hidden');
        proSettings.classList.remove('block');
        simpleActions.classList.remove('hidden');
      } else {
        tabPro.className = tabPro.className.replace(/bg-white\/5 text-secondary border-white\/10 hover:bg-white\/10/, 'bg-red-500/20 text-red-400 border-red-400/30');
        tabSimple.className = tabSimple.className.replace(/bg-red-500\/20 text-red-400 border-red-400\/30/, 'bg-white/5 text-secondary border-white/10 hover:bg-white/10');
        proSettings.classList.remove('hidden');
        proSettings.classList.add('block');
        simpleSettings.classList.add('hidden');
        simpleSettings.classList.remove('block');
        simpleActions.classList.add('hidden');
      }
    };

    tabSimple.addEventListener('click', () => setMode('simple'));
    tabPro.addEventListener('click', () => setMode('pro'));

    // Helpers
    const toggleClass = (elements, activeEl, activeClass, inactiveClass) => {
      elements.forEach(el => el.className = el.className.replace(new RegExp(activeClass.replace(/[/]/g, '\\/'), 'g'), inactiveClass));
      activeEl.className = activeEl.className.replace(new RegExp(inactiveClass.replace(/[/]/g, '\\/'), 'g'), activeClass);
    };

    // State Variables
    let selPreset = genrePresets[0];
    let selStyles = new Set();
    let selCam = cameras[0], selLight = lighting[0], selMood = moods[0];
    let selEngine = 'veo3-video', selAR = '16:9';

    // Simple Bindings
    const presetBtns = container.querySelectorAll('.t2v-preset-btn');
    presetBtns.forEach(btn => btn.addEventListener('click', () => {
      toggleClass(presetBtns, btn, 'bg-red-500/20 border-red-400/40 text-red-400', 'bg-white/5 border-white/10 text-secondary hover:bg-white/10');
      selPreset = genrePresets.find(p => p.id === btn.dataset.preset);
    }));

    const styleBtns = container.querySelectorAll('.t2v-style-btn');
    styleBtns.forEach(btn => btn.addEventListener('click', () => {
      const sid = btn.dataset.style;
      if (selStyles.has(sid)) {
        selStyles.delete(sid);
        btn.className = btn.className.replace(/bg-red-500\/20 border-red-400\/40 text-red-400/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10');
      } else {
        selStyles.add(sid);
        btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-red-500/20 border-red-400/40 text-red-400');
      }
    }));

    // Pro Bindings
    const camBtns = container.querySelectorAll('.t2v-cam-btn');
    camBtns.forEach(btn => btn.addEventListener('click', () => { toggleClass(camBtns, btn, 'bg-purple-500/20 border-purple-400/50 text-purple-300', 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); selCam = cameras.find(c => c.id === btn.dataset.cam); }));

    const lightBtns = container.querySelectorAll('.t2v-light-btn');
    lightBtns.forEach(btn => btn.addEventListener('click', () => { toggleClass(lightBtns, btn, 'bg-amber-500/20 border-amber-400/50 text-amber-400', 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); selLight = lighting.find(l => l.id === btn.dataset.light); }));

    const moodBtns = container.querySelectorAll('.t2v-mood-btn');
    moodBtns.forEach(btn => btn.addEventListener('click', () => { toggleClass(moodBtns, btn, 'bg-blue-500/20 border-blue-400/50 text-blue-300', 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); selMood = moods.find(m => m.id === btn.dataset.mood); }));

    // Global Bindings
    const engineBtns = container.querySelectorAll('.t2v-engine-btn');
    engineBtns.forEach(btn => btn.addEventListener('click', () => { toggleClass(engineBtns, btn, 'bg-red-500/20 border-red-400/40 text-red-400', 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); selEngine = btn.id === 't2v-engine-veo3' ? 'veo3-video' : 'wan-2.1-video'; }));

    const arBtns = container.querySelectorAll('.t2v-ar-btn');
    arBtns.forEach(btn => btn.addEventListener('click', () => { toggleClass(arBtns, btn, 'bg-red-500/20 border-red-400/40 text-red-400', 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); selAR = btn.dataset.ar; }));

    // Surprise Prompts
    const promptInput = container.querySelector('#t2v-prompt');
    const surprisePrompts = ['A massive whale breaches out of clouds above a mountain range', 'A robot barista carefully crafts latte art in a neon cafe', 'Time-lapse of a city being reclaimed by nature', 'A samurai stands atop a cliff overlooking a storm-swept ocean'];
    container.querySelector('#t2v-surprise-btn')?.addEventListener('click', () => promptInput.value = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)]);
    container.querySelector('#t2v-enhance-btn')?.addEventListener('click', () => { if (promptInput.value.trim()) promptInput.value += '. Ultra high quality, professional cinematography, highly detailed.'; });

    // Generate Pipeline
    const generateBtn = container.querySelector('#t2v-generate-btn');
    const outputEl = container.querySelector('#t2v-output');
    const loadingEl = container.querySelector('#t2v-loading');
    const resultEl = container.querySelector('#t2v-result');
    const resultVideo = container.querySelector('#t2v-result-video');

    generateBtn.addEventListener('click', async () => {
      if (isGenerating) return;
      if (!promptInput.value.trim()) { alert('Please describe your scene.'); return; }

      let finalPrompt = promptInput.value.trim();

      if (currentMode === 'simple') {
        finalPrompt += `. ${selPreset.prompt}`;
        selStyles.forEach(sid => { const mod = styleModifiers.find(s => s.id === sid); if (mod) finalPrompt += `, ${mod.value}`; });
      } else {
        finalPrompt += `. Camera: ${selCam.label} - ${selCam.desc}. Lighting: ${selLight.label}. Mood: ${selMood.label}. Pro cinematography.`;
      }

      isGenerating = true; generateBtn.disabled = true;
      outputEl.classList.add('hidden'); resultEl.classList.add('hidden');
      loadingEl.classList.remove('hidden'); loadingEl.classList.add('flex');

      try {
        const result = await muapi.generateVideo({ model: selEngine, prompt: finalPrompt, aspect_ratio: selAR });
        if (result.url) { resultVideo.src = result.url; loadingEl.classList.add('hidden'); resultEl.classList.remove('hidden'); }
      } catch (err) {
        loadingEl.classList.add('hidden'); outputEl.classList.remove('hidden');
        outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">⚠ ${err.message || 'Model unreachable'}</div>`;
      } finally { isGenerating = false; generateBtn.disabled = false; }
    });

    container.querySelector('#t2v-download')?.addEventListener('click', () => { const a = document.createElement('a'); a.href = resultVideo.src; a.download = `video_${Date.now()}.mp4`; a.click(); });
    container.querySelector('#t2v-retry')?.addEventListener('click', () => { resultEl.classList.add('hidden'); outputEl.classList.remove('hidden'); outputEl.innerHTML = `<div class="text-6xl opacity-20">🎬</div><p class="text-secondary text-sm text-center max-w-sm">Tweak your prompt or settings and try again!</p>`; });
  });

  return container;
}
