/**
 * FilmStrip.js — Horizontal storyboard timeline for Cinema Studio.
 * Allows users to assemble generated shots into a cohesive scene
 * with transitions and sequential playback.
 */

const TRANSITIONS = ['Cut', 'Dissolve', 'Fade to Black', 'Wipe'];

const STORAGE_KEY = 'cinema_storyboard';

export function FilmStrip(onClipSelect) {
    // --- State ---
    let clips = [];
    let dragOverIndex = -1;

    // Load persisted storyboard
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (Array.isArray(saved)) clips = saved;
    } catch (e) { }

    // --- Root Container ---
    const root = document.createElement('div');
    root.className = 'w-full transition-all duration-500';

    // --- Header Bar ---
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-2';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center gap-2';
    titleRow.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/>
        </svg>
        <span class="text-[10px] font-black text-white/50 uppercase tracking-[0.15em]">Storyboard</span>
        <span class="clip-count text-[9px] font-bold text-white/20 ml-1">0 clips</span>
    `;
    header.appendChild(titleRow);

    // Controls
    const controlsRow = document.createElement('div');
    controlsRow.className = 'flex items-center gap-2';

    const playAllBtn = document.createElement('button');
    playAllBtn.className = 'flex items-center gap-1 px-3 py-1 text-[9px] font-black text-black bg-primary rounded-lg uppercase tracking-wide hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
    playAllBtn.innerHTML = `▶ Play All`;
    playAllBtn.onclick = () => playSequence();

    const clearBtn = document.createElement('button');
    clearBtn.className = 'flex items-center gap-1 px-3 py-1 text-[9px] font-bold text-white/30 hover:text-white/70 uppercase tracking-wide transition-colors';
    clearBtn.textContent = 'Clear';
    clearBtn.onclick = () => {
        if (clips.length === 0) return;
        clips = [];
        persist();
        render();
    };

    controlsRow.appendChild(playAllBtn);
    controlsRow.appendChild(clearBtn);
    header.appendChild(controlsRow);
    root.appendChild(header);

    // --- Timeline Strip ---
    const strip = document.createElement('div');
    strip.className = 'flex items-center gap-0 px-4 pb-3 overflow-x-auto scrollbar-hide';
    strip.style.scrollBehavior = 'smooth';

    // Drop zone when strip is empty
    strip.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    strip.addEventListener('drop', (e) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data && data.url) {
                addClip(data);
            }
        } catch (err) { }
        strip.classList.remove('ring-2', 'ring-primary/30');
    });
    strip.addEventListener('dragenter', (e) => {
        e.preventDefault();
        strip.classList.add('ring-2', 'ring-primary/30');
    });
    strip.addEventListener('dragleave', () => {
        strip.classList.remove('ring-2', 'ring-primary/30');
    });

    root.appendChild(strip);

    // --- Empty State ---
    const emptyState = document.createElement('div');
    emptyState.className = 'flex items-center justify-center py-4 w-full';
    emptyState.innerHTML = `
        <div class="flex items-center gap-2 px-4 py-3 border border-dashed border-white/10 rounded-xl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-white/20">
                <path d="M12 5v14M5 12h14"/>
            </svg>
            <span class="text-[10px] text-white/20 font-medium">Generate shots & add them to your storyboard</span>
        </div>
    `;

    // ==========================================
    // RENDER
    // ==========================================
    function render() {
        strip.innerHTML = '';
        const countEl = root.querySelector('.clip-count');
        if (countEl) countEl.textContent = `${clips.length} clip${clips.length !== 1 ? 's' : ''}`;

        playAllBtn.disabled = clips.length < 2;

        if (clips.length === 0) {
            strip.appendChild(emptyState);
            root.classList.remove('bg-[#111]/80', 'backdrop-blur-lg', 'border-t', 'border-white/5');
            root.classList.add('bg-transparent');
            return;
        }

        root.classList.add('bg-[#111]/80', 'backdrop-blur-lg', 'border-t', 'border-white/5');
        root.classList.remove('bg-transparent');

        clips.forEach((clip, idx) => {
            // Clip thumbnail
            const clipEl = createClipElement(clip, idx);
            strip.appendChild(clipEl);

            // Transition marker (between clips, not after last)
            if (idx < clips.length - 1) {
                const marker = createTransitionMarker(idx);
                strip.appendChild(marker);
            }
        });
    }

    function createClipElement(clip, idx) {
        const wrapper = document.createElement('div');
        wrapper.className = 'relative flex-shrink-0 group/clip cursor-pointer transition-all duration-200 hover:scale-105';
        wrapper.draggable = true;

        // Internal reorder drag
        wrapper.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', idx.toString());
            e.dataTransfer.effectAllowed = 'move';
            wrapper.classList.add('opacity-40');
        });
        wrapper.addEventListener('dragend', () => {
            wrapper.classList.remove('opacity-40');
        });

        // Drop to reorder
        wrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            wrapper.classList.add('ring-2', 'ring-primary/50');
        });
        wrapper.addEventListener('dragleave', () => {
            wrapper.classList.remove('ring-2', 'ring-primary/50');
        });
        wrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            wrapper.classList.remove('ring-2', 'ring-primary/50');

            // Check if it's an internal reorder
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
            if (!isNaN(fromIdx) && fromIdx !== idx) {
                const [moved] = clips.splice(fromIdx, 1);
                clips.splice(idx, 0, moved);
                persist();
                render();
                return;
            }

            // External drop (from history sidebar)
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data && data.url) {
                    clips.splice(idx + 1, 0, makeClip(data));
                    persist();
                    render();
                }
            } catch (err) { }
        });

        const thumb = document.createElement('div');
        thumb.className = 'w-20 h-14 rounded-lg overflow-hidden border-2 border-white/10 group-hover/clip:border-primary/50 transition-colors relative';

        if (clip.type === 'video') {
            thumb.innerHTML = `
                <video src="${clip.url}" class="w-full h-full object-cover" muted></video>
                <div class="absolute top-0.5 right-0.5 bg-black/70 rounded px-1 py-0.5 text-[7px] font-black text-primary uppercase">VID</div>
            `;
        } else {
            thumb.innerHTML = `<img src="${clip.url}" class="w-full h-full object-cover">`;
        }

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold opacity-0 group-hover/clip:opacity-100 transition-opacity z-10';
        removeBtn.textContent = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            clips.splice(idx, 1);
            persist();
            render();
        };

        // Shot label
        const label = document.createElement('div');
        label.className = 'text-center text-[8px] font-bold text-white/30 mt-1 truncate w-20';
        label.textContent = clip.label || `Shot ${idx + 1}`;

        wrapper.appendChild(removeBtn);
        wrapper.appendChild(thumb);
        wrapper.appendChild(label);

        wrapper.onclick = () => {
            if (onClipSelect) onClipSelect(clip);
        };

        return wrapper;
    }

    function createTransitionMarker(idx) {
        const marker = document.createElement('div');
        marker.className = 'flex-shrink-0 flex flex-col items-center justify-center mx-1 cursor-pointer group/trans';

        const diamond = document.createElement('button');
        diamond.className = 'w-5 h-5 rotate-45 bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/10 rounded-sm flex items-center justify-center transition-all';
        diamond.innerHTML = `<span class="text-[7px] font-bold text-white/30 group-hover/trans:text-primary -rotate-45 transition-colors">${getTransitionIcon(clips[idx].transition)}</span>`;

        const transLabel = document.createElement('div');
        transLabel.className = 'text-[7px] text-white/20 mt-1.5 font-medium';
        transLabel.textContent = clips[idx].transition || 'Cut';

        diamond.onclick = (e) => {
            e.stopPropagation();
            openTransitionMenu(idx, diamond);
        };

        marker.appendChild(diamond);
        marker.appendChild(transLabel);
        return marker;
    }

    function getTransitionIcon(transition) {
        switch (transition) {
            case 'Dissolve': return '◐';
            case 'Fade to Black': return '■';
            case 'Wipe': return '▸';
            default: return '⎘';
        }
    }

    function openTransitionMenu(idx, trigger) {
        // Remove existing menus
        document.querySelectorAll('.filmstrip-menu').forEach(el => el.remove());

        const rect = trigger.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'filmstrip-menu fixed bg-[#1a1a1a] border border-white/10 rounded-xl py-1 shadow-2xl z-[60] flex flex-col min-w-[120px] animate-fade-in';
        menu.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
        menu.style.left = (rect.left - 40) + 'px';

        const menuTitle = document.createElement('div');
        menuTitle.className = 'px-3 py-1.5 text-[8px] font-black text-white/30 uppercase tracking-widest border-b border-white/5';
        menuTitle.textContent = 'Transition';
        menu.appendChild(menuTitle);

        TRANSITIONS.forEach(t => {
            const btn = document.createElement('button');
            const isActive = (clips[idx].transition || 'Cut') === t;
            btn.className = `px-3 py-2 text-[10px] font-bold text-left hover:bg-white/10 transition-colors flex items-center gap-2 ${isActive ? 'text-primary' : 'text-white/70'}`;
            btn.innerHTML = `<span class="w-4 text-center">${getTransitionIcon(t)}</span> ${t}`;
            btn.onclick = (e) => {
                e.stopPropagation();
                clips[idx].transition = t;
                persist();
                render();
                menu.remove();
            };
            menu.appendChild(btn);
        });

        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
        document.body.appendChild(menu);
    }

    // ==========================================
    // PLAYBACK
    // ==========================================
    function playSequence() {
        if (clips.length < 2) return;

        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black z-[100] flex items-center justify-center';

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-10';
        closeBtn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

        // Progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear';
        progressBar.style.width = '0%';

        // Shot counter
        const shotCounter = document.createElement('div');
        shotCounter.className = 'absolute top-6 left-6 text-[10px] font-black text-white/40 uppercase tracking-widest';

        // Media container
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'w-full h-full flex items-center justify-center transition-opacity duration-700';

        overlay.appendChild(closeBtn);
        overlay.appendChild(progressBar);
        overlay.appendChild(shotCounter);
        overlay.appendChild(mediaContainer);
        document.body.appendChild(overlay);

        let currentIdx = 0;
        let isPlaying = true;
        const CLIP_DURATION = 4000; // 4s per clip for images, videos play their duration

        closeBtn.onclick = () => {
            isPlaying = false;
            overlay.remove();
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                isPlaying = false;
                overlay.remove();
            }
        };

        function showClip(idx) {
            if (!isPlaying || idx >= clips.length) {
                // End of sequence
                setTimeout(() => overlay.remove(), 500);
                return;
            }

            currentIdx = idx;
            const clip = clips[idx];
            const transition = idx > 0 ? (clips[idx - 1].transition || 'Cut') : 'Cut';

            shotCounter.textContent = `Shot ${idx + 1} / ${clips.length}`;
            progressBar.style.width = `${((idx + 1) / clips.length) * 100}%`;

            // Apply transition effect
            if (transition === 'Cut') {
                mediaContainer.style.opacity = '1';
            } else if (transition === 'Dissolve') {
                mediaContainer.style.opacity = '0';
                setTimeout(() => { mediaContainer.style.opacity = '1'; }, 50);
            } else if (transition === 'Fade to Black') {
                mediaContainer.style.opacity = '0';
                setTimeout(() => { mediaContainer.style.opacity = '1'; }, 500);
            } else if (transition === 'Wipe') {
                mediaContainer.style.transition = 'none';
                mediaContainer.style.transform = 'translateX(100%)';
                mediaContainer.style.opacity = '1';
                requestAnimationFrame(() => {
                    mediaContainer.style.transition = 'transform 0.5s ease-out';
                    mediaContainer.style.transform = 'translateX(0)';
                });
            }

            // Render media
            mediaContainer.innerHTML = '';
            if (clip.type === 'video') {
                const vid = document.createElement('video');
                vid.src = clip.url;
                vid.className = 'max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl';
                vid.autoplay = true;
                vid.muted = false;
                vid.onended = () => {
                    if (isPlaying) showClip(idx + 1);
                };
                // Fallback if video errors
                vid.onerror = () => {
                    if (isPlaying) setTimeout(() => showClip(idx + 1), CLIP_DURATION);
                };
                mediaContainer.appendChild(vid);
            } else {
                const img = document.createElement('img');
                img.src = clip.url;
                img.className = 'max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain';
                mediaContainer.appendChild(img);
                // Auto-advance for images
                setTimeout(() => {
                    if (isPlaying) showClip(idx + 1);
                }, CLIP_DURATION);
            }
        }

        // Kick off playback
        showClip(0);
    }

    // ==========================================
    // PUBLIC API
    // ==========================================
    function makeClip(entry) {
        return {
            id: Date.now() + Math.random(),
            url: entry.url,
            type: entry.type || 'image',
            label: entry.settings?.prompt?.substring(0, 20) || `Shot ${clips.length + 1}`,
            prompt: entry.settings?.prompt || '',
            transition: 'Cut'
        };
    }

    function addClip(entry) {
        clips.push(makeClip(entry));
        persist();
        render();
        // Scroll to end
        requestAnimationFrame(() => {
            strip.scrollLeft = strip.scrollWidth;
        });
    }

    function getClips() {
        return [...clips];
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(clips.slice(0, 100)));
        } catch (e) { }
    }

    // Initial render
    render();

    // Attach public API to root element
    root.addClip = addClip;
    root.getClips = getClips;

    return root;
}
