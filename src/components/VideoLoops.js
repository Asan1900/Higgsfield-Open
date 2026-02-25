import { muapi } from '../lib/muapi.js';

/**
 * VideoLoops — Seamless looping video generator.
 * Uses veo3-text-to-video with loop-optimized prompts.
 */
export function VideoLoops() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-hidden';
    let isGenerating = false;

    const loops = [
        { name: '🌊 Ocean Waves', prompt: 'Seamless loop of ocean waves gently crashing on a sandy beach, crystal clear water, aerial view' },
        { name: '🔥 Fireplace', prompt: 'Seamless loop of a cozy fireplace with crackling flames, warm glow, ember particles floating' },
        { name: '🌌 Aurora', prompt: 'Seamless loop of northern lights dancing across a starry sky, green and purple waves, snowy landscape' },
        { name: '🌧️ Rain', prompt: 'Seamless loop of gentle rain falling on leaves and puddles, close-up macro, water droplets' },
        { name: '💧 Liquid Metal', prompt: 'Seamless loop of liquid mercury flowing and morphing, abstract shapes, metallic reflections, dark bg' },
        { name: '✨ Neon Waves', prompt: 'Seamless loop of neon-colored sine waves flowing and pulsing, cyberpunk aesthetic, dark background' },
        { name: '🌀 Particles', prompt: 'Seamless loop of glowing particles floating and orbiting in space, bokeh, dreamy, slow motion' },
        { name: '💨 Smoke', prompt: 'Seamless loop of colorful smoke wisps curling and flowing, incense-like, ethereal, dark background' },
        { name: '⚡ Circuit', prompt: 'Seamless loop of electrical signals pulsing through a futuristic circuit board, glowing traces, data flow' },
        { name: '🕳️ Wormhole', prompt: 'Seamless loop of flying through a colorful wormhole tunnel, light streaks, speed, hyperspace' },
        { name: '🕯️ Candles', prompt: 'Seamless loop of multiple candles flickering gently, warm candlelight, cozy atmosphere' },
        { name: '☁️ Clouds', prompt: 'Seamless loop of soft white clouds drifting across a blue sky, tranquil, peaceful, timelapse style' }
    ];

    container.innerHTML = `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <div class="w-full lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-lg font-black text-teal-400">🔁</div>
            <div>
              <h1 class="text-xl font-black tracking-tight uppercase">Video Loops</h1>
              <p class="text-[11px] text-secondary">Seamless Loops · veo3</p>
            </div>
          </div>
        </div>
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Loop Templates</label>
          <div class="grid grid-cols-2 gap-2">
            ${loops.map((l, i) => `<button data-idx="${i}" class="vl-loop-btn px-3 py-2.5 rounded-xl text-[11px] font-bold border text-left transition-all ${i === 0 ? 'bg-teal-500/20 border-teal-400/40 text-teal-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${l.name}</button>`).join('')}
          </div>
        </div>
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Custom Loop (Optional)</label>
          <textarea id="vl-prompt" rows="3" placeholder="Or describe your own loop... e.g. 'Jellyfish pulsing in deep ocean'" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-teal-400/50 transition-colors custom-scrollbar"></textarea>
        </div>
        <div class="p-6 border-b border-white/5 space-y-3">
          <label class="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Aspect Ratio</label>
          <div class="grid grid-cols-4 gap-2">
            ${['16:9', '9:16', '1:1', '21:9'].map((ar, i) => `<button data-ar="${ar}" class="vl-ar-btn px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${i === 0 ? 'bg-teal-500/20 border-teal-400/40 text-teal-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}">${ar}</button>`).join('')}
          </div>
        </div>
        <div class="p-6 mt-auto">
          <button id="vl-generate-btn" class="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20">Generate Loop</button>
          <p class="text-[10px] text-muted text-center mt-2">Takes 1-3 minutes</p>
        </div>
      </div>
      <div class="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_60%)]">
        <div id="vl-output" class="flex flex-col items-center gap-6 animate-fade-in">
          <div class="text-6xl opacity-20">🔁</div>
          <p class="text-secondary text-sm text-center max-w-sm">Choose a loop template or describe your own seamless video loop.</p>
        </div>
        <div id="vl-loading" class="hidden flex-col items-center gap-4">
          <div class="w-14 h-14 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-secondary uppercase tracking-widest animate-pulse">Creating Loop...</p>
        </div>
        <div id="vl-result" class="hidden max-w-3xl w-full flex flex-col items-center gap-4">
          <video id="vl-result-video" controls autoplay loop class="w-full rounded-3xl border border-white/10 shadow-2xl shadow-teal-500/10"></video>
          <div class="flex gap-3 justify-center">
            <button id="vl-download" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">⬇ Download</button>
            <button id="vl-retry" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">🔄 Try Another</button>
          </div>
        </div>
      </div>
    </div>`;

    requestAnimationFrame(() => {
        const promptInput = container.querySelector('#vl-prompt');
        const generateBtn = container.querySelector('#vl-generate-btn');
        const outputEl = container.querySelector('#vl-output');
        const loadingEl = container.querySelector('#vl-loading');
        const resultEl = container.querySelector('#vl-result');
        const resultVideo = container.querySelector('#vl-result-video');
        const loopBtns = container.querySelectorAll('.vl-loop-btn');
        const arBtns = container.querySelectorAll('.vl-ar-btn');
        let selectedLoop = loops[0]; let selectedAR = '16:9';

        loopBtns.forEach(btn => btn.addEventListener('click', () => {
            loopBtns.forEach(b => { b.className = b.className.replace(/bg-teal-500\/20 border-teal-400\/40 text-teal-400/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); });
            btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-teal-500/20 border-teal-400/40 text-teal-400');
            selectedLoop = loops[parseInt(btn.dataset.idx)];
        }));
        arBtns.forEach(btn => btn.addEventListener('click', () => {
            arBtns.forEach(b => { b.className = b.className.replace(/bg-teal-500\/20 border-teal-400\/40 text-teal-400/g, 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'); });
            btn.className = btn.className.replace(/bg-white\/5 border-white\/10 text-secondary hover:bg-white\/10/g, 'bg-teal-500/20 border-teal-400/40 text-teal-400');
            selectedAR = btn.dataset.ar;
        }));

        generateBtn.addEventListener('click', async () => {
            if (isGenerating) return;
            const custom = promptInput.value.trim();
            const finalPrompt = custom || selectedLoop.prompt;
            isGenerating = true; generateBtn.disabled = true;
            outputEl.classList.add('hidden'); resultEl.classList.add('hidden');
            loadingEl.classList.remove('hidden'); loadingEl.classList.add('flex');
            try {
                const result = await muapi.generateVideo({ model: 'veo3-video', prompt: `${finalPrompt}. Perfectly seamless looping video.`, aspect_ratio: selectedAR });
                if (result.url) { resultVideo.src = result.url; loadingEl.classList.add('hidden'); resultEl.classList.remove('hidden'); }
            } catch (err) {
                loadingEl.classList.add('hidden'); outputEl.classList.remove('hidden');
                outputEl.innerHTML = `<div class="text-red-400 text-sm font-bold text-center">⚠ ${err.message}</div>`;
            } finally { isGenerating = false; generateBtn.disabled = false; }
        });

        container.querySelector('#vl-download')?.addEventListener('click', () => { const a = document.createElement('a'); a.href = resultVideo.src; a.download = `loop_${Date.now()}.mp4`; a.click(); });
        container.querySelector('#vl-retry')?.addEventListener('click', () => { resultEl.classList.add('hidden'); outputEl.classList.remove('hidden'); outputEl.innerHTML = `<div class="text-6xl opacity-20">🔁</div><p class="text-secondary text-sm text-center max-w-sm">Pick a different template!</p>`; });
    });
    return container;
}
