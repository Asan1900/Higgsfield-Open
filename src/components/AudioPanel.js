/**
 * AudioPanel.js — Slide-up panel for audio, voiceover, and lip-sync generation.
 * Shows 3 tabs: 🔊 Soundscape | 🎤 Voiceover | 💋 Lip-Sync
 */

import { muapi } from '../lib/muapi.js';

const VOICE_OPTIONS = [
    { id: 'default', label: 'Neutral' },
    { id: 'narrator', label: 'Narrator' },
    { id: 'dramatic', label: 'Dramatic' },
    { id: 'whisper', label: 'Whisper' },
    { id: 'energetic', label: 'Energetic' },
];

const SOUNDSCAPE_PRESETS = [
    'Forest wind with birds',
    'Cyberpunk city, neon rain',
    'Ocean waves, gentle tide',
    'Thunderstorm, heavy rain',
    'Café ambience, soft jazz',
    'Space station hum, beeps',
];

export function AudioPanel({ videoUrl, onVideoUpdate }) {
    let currentTab = 'soundscape';
    let generatedAudioUrl = null;
    let generatedSpeechUrl = null;
    let isGenerating = false;

    // --- Root ---
    const root = document.createElement('div');
    root.className = 'fixed bottom-0 left-0 right-0 z-[55] transform translate-y-full transition-transform duration-500 ease-out';
    root.style.pointerEvents = 'none';

    const panel = document.createElement('div');
    panel.className = 'mx-auto max-w-3xl bg-[#111]/95 backdrop-blur-2xl border border-white/10 rounded-t-2xl shadow-2xl overflow-hidden';
    panel.style.pointerEvents = 'auto';

    // --- Handle Bar ---
    const handle = document.createElement('div');
    handle.className = 'flex items-center justify-center py-2 cursor-pointer group';
    handle.innerHTML = `<div class="w-10 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors"></div>`;

    // --- Tab Bar ---
    const tabBar = document.createElement('div');
    tabBar.className = 'flex items-center border-b border-white/5 px-4';

    const tabs = [
        { id: 'soundscape', icon: '🔊', label: 'Soundscape' },
        { id: 'voiceover', icon: '🎤', label: 'Voiceover' },
        { id: 'lipsync', icon: '💋', label: 'Lip-Sync' },
    ];

    const tabButtons = {};
    tabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.className = 'px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 border-transparent';
        btn.innerHTML = `${tab.icon} ${tab.label}`;
        btn.onclick = () => switchTab(tab.id);
        tabButtons[tab.id] = btn;
        tabBar.appendChild(btn);
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ml-auto text-white/30 hover:text-white/70 transition-colors px-2 py-3';
    closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
    closeBtn.onclick = () => hide();
    tabBar.appendChild(closeBtn);

    // --- Content Area ---
    const content = document.createElement('div');
    content.className = 'p-4';

    panel.appendChild(handle);
    panel.appendChild(tabBar);
    panel.appendChild(content);
    root.appendChild(panel);

    // ==========================================
    // TAB SWITCHING
    // ==========================================
    function switchTab(tabId) {
        currentTab = tabId;
        Object.entries(tabButtons).forEach(([id, btn]) => {
            if (id === tabId) {
                btn.classList.add('text-primary', 'border-primary');
                btn.classList.remove('text-white/40', 'border-transparent');
            } else {
                btn.classList.remove('text-primary', 'border-primary');
                btn.classList.add('text-white/40', 'border-transparent');
            }
        });
        renderContent();
    }

    // ==========================================
    // CONTENT RENDERING
    // ==========================================
    function renderContent() {
        content.innerHTML = '';

        switch (currentTab) {
            case 'soundscape': renderSoundscape(); break;
            case 'voiceover': renderVoiceover(); break;
            case 'lipsync': renderLipSync(); break;
        }
    }

    function renderSoundscape() {
        const wrapper = document.createElement('div');
        wrapper.className = 'space-y-3';

        // Presets
        const presetsRow = document.createElement('div');
        presetsRow.className = 'flex flex-wrap gap-1.5';
        SOUNDSCAPE_PRESETS.forEach(preset => {
            const chip = document.createElement('button');
            chip.className = 'px-2.5 py-1 text-[9px] font-bold text-white/40 bg-white/5 hover:bg-white/10 hover:text-white/70 rounded-lg border border-white/5 transition-all';
            chip.textContent = preset;
            chip.onclick = () => {
                input.value = preset;
            };
            presetsRow.appendChild(chip);
        });
        wrapper.appendChild(presetsRow);

        // Input row
        const inputRow = document.createElement('div');
        inputRow.className = 'flex gap-2';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Describe the ambient sound...';
        input.className = 'flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors';
        input.value = '';

        const genBtn = createGenButton('Generate', async () => {
            const prompt = input.value.trim();
            if (!prompt) return;
            setLoading(genBtn, true);
            try {
                const res = await muapi.generateAudio({ prompt });
                if (res?.url) {
                    generatedAudioUrl = res.url;
                    renderContent(); // Re-render with preview
                }
            } catch (e) {
                showError(wrapper, e.message);
            }
            setLoading(genBtn, false);
        });

        inputRow.appendChild(input);
        inputRow.appendChild(genBtn);
        wrapper.appendChild(inputRow);

        // Audio preview (if generated)
        if (generatedAudioUrl) {
            wrapper.appendChild(createAudioPreview(generatedAudioUrl, 'Ambient Audio'));
        }

        content.appendChild(wrapper);
    }

    function renderVoiceover() {
        const wrapper = document.createElement('div');
        wrapper.className = 'space-y-3';

        // Voice selector row
        const voiceRow = document.createElement('div');
        voiceRow.className = 'flex items-center gap-2';

        const voiceLabel = document.createElement('span');
        voiceLabel.className = 'text-[9px] font-bold text-white/30 uppercase tracking-widest';
        voiceLabel.textContent = 'Voice:';
        voiceRow.appendChild(voiceLabel);

        let selectedVoice = 'default';
        VOICE_OPTIONS.forEach(v => {
            const chip = document.createElement('button');
            chip.className = `px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all ${v.id === selectedVoice ? 'text-primary border-primary/50 bg-primary/10' : 'text-white/40 border-white/5 bg-white/5 hover:bg-white/10'}`;
            chip.textContent = v.label;
            chip.onclick = () => {
                selectedVoice = v.id;
                voiceRow.querySelectorAll('button').forEach(b => {
                    b.classList.remove('text-primary', 'border-primary/50', 'bg-primary/10');
                    b.classList.add('text-white/40', 'border-white/5', 'bg-white/5');
                });
                chip.classList.add('text-primary', 'border-primary/50', 'bg-primary/10');
                chip.classList.remove('text-white/40', 'border-white/5', 'bg-white/5');
            };
            voiceRow.appendChild(chip);
        });
        wrapper.appendChild(voiceRow);

        // Text input
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Type the dialogue or narration text...';
        textarea.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors resize-none';
        textarea.rows = 2;
        wrapper.appendChild(textarea);

        // Generate button
        const genBtn = createGenButton('Generate Speech', async () => {
            const text = textarea.value.trim();
            if (!text) return;
            setLoading(genBtn, true);
            try {
                const res = await muapi.generateSpeech({ text, voice: selectedVoice });
                if (res?.url) {
                    generatedSpeechUrl = res.url;
                    renderContent();
                }
            } catch (e) {
                showError(wrapper, e.message);
            }
            setLoading(genBtn, false);
        });
        wrapper.appendChild(genBtn);

        // Speech preview
        if (generatedSpeechUrl) {
            wrapper.appendChild(createAudioPreview(generatedSpeechUrl, 'Voiceover'));
        }

        content.appendChild(wrapper);
    }

    function renderLipSync() {
        const wrapper = document.createElement('div');
        wrapper.className = 'space-y-3';

        const hasVideo = !!videoUrl;
        const hasAudio = !!(generatedAudioUrl || generatedSpeechUrl);

        // Status indicators
        const statusRow = document.createElement('div');
        statusRow.className = 'flex items-center gap-4';

        statusRow.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full ${hasVideo ? 'bg-green-400 shadow-glow-sm' : 'bg-white/10'}"></div>
                <span class="text-[10px] font-bold ${hasVideo ? 'text-white/70' : 'text-white/20'} uppercase">Video${hasVideo ? ' ✓' : ' needed'}</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full ${hasAudio ? 'bg-green-400 shadow-glow-sm' : 'bg-white/10'}"></div>
                <span class="text-[10px] font-bold ${hasAudio ? 'text-white/70' : 'text-white/20'} uppercase">Audio${hasAudio ? ' ✓' : ' — generate in Soundscape or Voiceover first'}</span>
            </div>
        `;
        wrapper.appendChild(statusRow);

        if (hasVideo && hasAudio) {
            const audioToUse = generatedSpeechUrl || generatedAudioUrl;

            const info = document.createElement('div');
            info.className = 'text-[10px] text-white/30 font-medium';
            info.textContent = `This will re-animate the character's mouth to match your ${generatedSpeechUrl ? 'voiceover' : 'audio'}.`;
            wrapper.appendChild(info);

            const syncBtn = createGenButton('💋 Sync Lips to Audio', async () => {
                setLoading(syncBtn, true);
                try {
                    const res = await muapi.lipSync({
                        video_url: videoUrl,
                        audio_url: audioToUse
                    });
                    if (res?.url && onVideoUpdate) {
                        onVideoUpdate(res.url);
                        hide();
                    }
                } catch (e) {
                    showError(wrapper, e.message);
                }
                setLoading(syncBtn, false);
            });
            wrapper.appendChild(syncBtn);
        } else {
            const hint = document.createElement('div');
            hint.className = 'text-center py-4 text-[10px] text-white/20 font-medium';
            hint.innerHTML = `<span class="text-lg block mb-2">💋</span>Generate a video and create audio (Soundscape or Voiceover) first,<br>then return here to sync lips.`;
            wrapper.appendChild(hint);
        }

        content.appendChild(wrapper);
    }

    // ==========================================
    // HELPERS
    // ==========================================
    function createGenButton(label, onClick) {
        const btn = document.createElement('button');
        btn.className = 'px-5 py-2.5 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-wide hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap';
        btn.textContent = label;
        btn.onclick = onClick;
        return btn;
    }

    function setLoading(btn, loading) {
        isGenerating = loading;
        btn.disabled = loading;
        if (loading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = 'GENERATING...';
        } else {
            btn.textContent = btn.dataset.originalText || btn.textContent;
        }
    }

    function createAudioPreview(url, label) {
        const preview = document.createElement('div');
        preview.className = 'flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl';

        const playBtn = document.createElement('button');
        playBtn.className = 'w-8 h-8 flex items-center justify-center bg-primary rounded-full text-black text-sm font-bold hover:bg-white transition-colors flex-shrink-0';
        playBtn.textContent = '▶';

        const audio = new Audio(url);
        audio.crossOrigin = 'anonymous';
        let playing = false;
        playBtn.onclick = () => {
            if (playing) {
                audio.pause();
                playBtn.textContent = '▶';
                playing = false;
            } else {
                audio.play();
                playBtn.textContent = '⏸';
                playing = true;
            }
        };
        audio.onended = () => {
            playBtn.textContent = '▶';
            playing = false;
        };

        const info = document.createElement('div');
        info.className = 'flex-1 min-w-0';
        info.innerHTML = `
            <div class="text-[10px] font-bold text-white/70 truncate">${label}</div>
            <div class="text-[9px] text-white/30 truncate">${url.split('/').pop() || 'Generated audio'}</div>
        `;

        const downloadBtn = document.createElement('a');
        downloadBtn.href = url;
        downloadBtn.target = '_blank';
        downloadBtn.className = 'text-[9px] font-bold text-white/30 hover:text-white/70 transition-colors';
        downloadBtn.textContent = '↓';

        preview.appendChild(playBtn);
        preview.appendChild(info);
        preview.appendChild(downloadBtn);
        return preview;
    }

    function showError(container, message) {
        const err = document.createElement('div');
        err.className = 'px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 font-medium';
        err.textContent = `Error: ${message}`;
        container.appendChild(err);
        setTimeout(() => err.remove(), 5000);
    }

    // ==========================================
    // SHOW / HIDE
    // ==========================================
    function show() {
        root.classList.remove('translate-y-full');
        root.classList.add('translate-y-0');
        switchTab('soundscape');
    }

    function hide() {
        root.classList.remove('translate-y-0');
        root.classList.add('translate-y-full');
    }

    function toggle() {
        if (root.classList.contains('translate-y-0')) {
            hide();
        } else {
            show();
        }
    }

    function setVideoUrl(url) {
        videoUrl = url;
    }

    // Initialize tab state
    switchTab('soundscape');

    // Public API
    root.show = show;
    root.hide = hide;
    root.toggle = toggle;
    root.setVideoUrl = setVideoUrl;

    return root;
}
