/**
 * AudioMixer.js — Professional audio mixer panel with per-track channels,
 * volume faders, mute/solo, pan, VU meters, and smart ducking.
 */

import { createKnob, createToggle } from '../ui-kit/index.js';

export function AudioMixer({ projectState, onStateChange }) {
    let smartDuckingEnabled = false;
    let isExpanded = false;

    const root = document.createElement('div');
    root.className = 'audio-mixer';

    // ==========================================
    // HEADER
    // ==========================================
    const header = document.createElement('div');
    header.className = 'amx-header';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
                <path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3"/>
            </svg>
            <span class="text-[10px] font-black text-white/60 uppercase tracking-[0.15em]">Audio Mixer</span>
        </div>
    `;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'amx-toggle';
    toggleBtn.textContent = '▲';
    toggleBtn.onclick = () => {
        isExpanded = !isExpanded;
        toggleBtn.textContent = isExpanded ? '▼' : '▲';
        content.classList.toggle('hidden', !isExpanded);
        root.classList.toggle('expanded', isExpanded);
    };
    header.appendChild(toggleBtn);

    root.appendChild(header);

    // ==========================================
    // CONTENT
    // ==========================================
    const content = document.createElement('div');
    content.className = 'amx-content hidden';

    // Smart Ducking toggle
    const duckingRow = document.createElement('div');
    duckingRow.className = 'amx-ducking-row';

    const duckingToggle = document.createElement('button');
    duckingToggle.className = 'amx-ducking-btn';
    duckingToggle.innerHTML = `
        <span class="text-[10px]">🦆</span>
        <span>Smart Ducking</span>
    `;
    duckingToggle.onclick = () => {
        smartDuckingEnabled = !smartDuckingEnabled;
        duckingToggle.classList.toggle('active', smartDuckingEnabled);
        applySmartDucking();
    };

    const duckingInfo = document.createElement('span');
    duckingInfo.className = 'text-[8px] text-white/20 italic';
    duckingInfo.textContent = 'Auto-lower music when voice plays';

    duckingRow.appendChild(duckingToggle);
    duckingRow.appendChild(duckingInfo);
    content.appendChild(duckingRow);

    // Channel strips container
    const channelContainer = document.createElement('div');
    channelContainer.className = 'amx-channels';
    content.appendChild(channelContainer);

    root.appendChild(content);

    // ==========================================
    // RENDER CHANNELS
    // ==========================================
    function renderChannels() {
        channelContainer.innerHTML = '';
        const audioTracks = projectState.tracks.filter(t =>
            t.type === 'audio' || t.type === 'video'
        );

        audioTracks.forEach((track, idx) => {
            const strip = createChannelStrip(track, idx);
            channelContainer.appendChild(strip);
        });

        // Master bus
        const master = createMasterStrip();
        channelContainer.appendChild(master);
    }

    function createChannelStrip(track, idx) {
        const strip = document.createElement('div');
        strip.className = 'amx-channel';

        // Track label
        const label = document.createElement('div');
        label.className = 'amx-channel-label';
        label.textContent = track.name;
        strip.appendChild(label);

        // VU Meter
        const vuMeter = document.createElement('div');
        vuMeter.className = 'amx-vu-meter';
        const vuFill = document.createElement('div');
        vuFill.className = 'amx-vu-fill';
        vuFill.style.height = ((track.volume || 80) * 0.8) + '%';
        vuMeter.appendChild(vuFill);

        // Animated VU
        const vuOverlay = document.createElement('div');
        vuOverlay.className = 'amx-vu-overlay';
        vuMeter.appendChild(vuOverlay);
        strip.appendChild(vuMeter);

        // Volume fader
        const faderContainer = document.createElement('div');
        faderContainer.className = 'amx-fader-container';

        const fader = document.createElement('input');
        fader.type = 'range';
        fader.min = 0;
        fader.max = 100;
        fader.value = track.volume ?? 80;
        fader.className = 'amx-fader';
        fader.orient = 'vertical';
        fader.oninput = () => {
            track.volume = parseInt(fader.value);
            vuFill.style.height = (track.volume * 0.8) + '%';
            volLabel.textContent = track.volume + '%';
            if (onStateChange) onStateChange(projectState);
        };
        faderContainer.appendChild(fader);

        const volLabel = document.createElement('span');
        volLabel.className = 'amx-vol-label';
        volLabel.textContent = (track.volume ?? 80) + '%';
        faderContainer.appendChild(volLabel);

        strip.appendChild(faderContainer);

        // Pan knob
        const panRow = document.createElement('div');
        panRow.className = 'flex justify-center py-2';

        const panKnob = createKnob({
            label: 'Pan',
            min: -50,
            max: 50,
            value: track.pan ?? 0,
            onChange: (v) => {
                track.pan = v;
                if (onStateChange) onStateChange(projectState);
            }
        });
        panRow.appendChild(panKnob);
        strip.appendChild(panRow);

        // Mute / Solo buttons
        const ctrlRow = document.createElement('div');
        ctrlRow.className = 'amx-ctrl-row flex gap-1 justify-center pb-2';

        const muteToggle = createToggle({
            label: 'M',
            active: track.muted,
            onChange: (v) => {
                track.muted = v;
                renderChannels();
                if (onStateChange) onStateChange(projectState);
            }
        });

        const soloToggle = createToggle({
            label: 'S',
            active: track.solo,
            onChange: (v) => {
                track.solo = v;
                renderChannels();
                if (onStateChange) onStateChange(projectState);
            }
        });

        // Style overrides to match mixer look
        muteToggle.style.width = '24px';
        if (track.muted) muteToggle.classList.add('text-red-400');

        soloToggle.style.width = '24px';
        if (track.solo) soloToggle.classList.add('text-yellow-400');

        ctrlRow.appendChild(muteToggle);
        ctrlRow.appendChild(soloToggle);
        strip.appendChild(ctrlRow);

        return strip;
    }

    function createMasterStrip() {
        const strip = document.createElement('div');
        strip.className = 'amx-channel master';

        const label = document.createElement('div');
        label.className = 'amx-channel-label master';
        label.textContent = 'MASTER';
        strip.appendChild(label);

        const vuMeter = document.createElement('div');
        vuMeter.className = 'amx-vu-meter master';
        const vuFill = document.createElement('div');
        vuFill.className = 'amx-vu-fill master';
        vuFill.style.height = '65%';
        vuMeter.appendChild(vuFill);
        strip.appendChild(vuMeter);

        const faderContainer = document.createElement('div');
        faderContainer.className = 'amx-fader-container';

        const fader = document.createElement('input');
        fader.type = 'range';
        fader.min = 0;
        fader.max = 100;
        fader.value = projectState.masterVolume ?? 85;
        fader.className = 'amx-fader';
        fader.orient = 'vertical';
        fader.oninput = () => {
            projectState.masterVolume = parseInt(fader.value);
            vuFill.style.height = (projectState.masterVolume * 0.75) + '%';
        };
        faderContainer.appendChild(fader);

        const volLabel = document.createElement('span');
        volLabel.className = 'amx-vol-label';
        volLabel.textContent = (projectState.masterVolume ?? 85) + '%';
        faderContainer.appendChild(volLabel);

        strip.appendChild(faderContainer);

        return strip;
    }

    // ==========================================
    // SMART DUCKING
    // ==========================================
    function applySmartDucking() {
        if (!smartDuckingEnabled) {
            // Reset volumes
            projectState.tracks.forEach(t => {
                if (t._originalVolume != null) {
                    t.volume = t._originalVolume;
                    delete t._originalVolume;
                }
            });
            renderChannels();
            return;
        }

        const voiceTrack = projectState.tracks.find(t =>
            t.name.toLowerCase().includes('voice') ||
            t.name.toLowerCase().includes('dialog') ||
            (t.type === 'audio' && t.clips?.some(c =>
                (c.name || '').toLowerCase().includes('voice')
            ))
        );

        if (!voiceTrack) return;

        const playhead = projectState.playhead || 0;
        const voiceActive = voiceTrack.clips?.some(c =>
            playhead >= c.startTime && playhead <= c.startTime + c.duration
        );

        projectState.tracks.forEach(t => {
            if (t === voiceTrack) return;
            if (t.type !== 'audio') return;

            if (voiceActive) {
                if (t._originalVolume == null) t._originalVolume = t.volume ?? 80;
                t.volume = Math.round((t._originalVolume ?? 80) * 0.3); // Duck to 30%
            } else if (t._originalVolume != null) {
                t.volume = t._originalVolume;
                delete t._originalVolume;
            }
        });
        renderChannels();
    }

    // Public API
    root.render = renderChannels;
    root.applySmartDucking = applySmartDucking;
    root.expand = () => {
        isExpanded = true;
        toggleBtn.textContent = '▼';
        content.classList.remove('hidden');
        root.classList.add('expanded');
    };

    renderChannels();

    return root;
}
