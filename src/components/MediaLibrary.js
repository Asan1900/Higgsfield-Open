/**
 * MediaLibrary.js — Rich asset browser sidebar with categories,
 * search, SFX library, and drag-and-drop to timeline.
 */

const SFX_LIBRARY = [
    { id: 'sfx1', name: 'Cinematic Boom', category: 'Impacts', duration: 2.5, type: 'audio' },
    { id: 'sfx2', name: 'Swoosh', category: 'Whoosh', duration: 1.2, type: 'audio' },
    { id: 'sfx3', name: 'Glass Shatter', category: 'Impacts', duration: 1.8, type: 'audio' },
    { id: 'sfx4', name: 'Rain Ambience', category: 'Ambient', duration: 30, type: 'audio' },
    { id: 'sfx5', name: 'Thunder Crack', category: 'Impacts', duration: 3.0, type: 'audio' },
    { id: 'sfx6', name: 'Button Click', category: 'UI', duration: 0.3, type: 'audio' },
    { id: 'sfx7', name: 'Notification Ping', category: 'UI', duration: 0.8, type: 'audio' },
    { id: 'sfx8', name: 'Wind Howl', category: 'Ambient', duration: 15, type: 'audio' },
    { id: 'sfx9', name: 'Laser Zap', category: 'Whoosh', duration: 0.5, type: 'audio' },
    { id: 'sfx10', name: 'Heartbeat', category: 'Musical', duration: 2.0, type: 'audio' },
    { id: 'sfx11', name: 'Tension Riser', category: 'Musical', duration: 5.0, type: 'audio' },
    { id: 'sfx12', name: 'Door Slam', category: 'Impacts', duration: 1.0, type: 'audio' },
    { id: 'sfx13', name: 'Car Engine', category: 'Ambient', duration: 8.0, type: 'audio' },
    { id: 'sfx14', name: 'Type Click', category: 'UI', duration: 0.2, type: 'audio' },
    { id: 'sfx15', name: 'Ocean Waves', category: 'Ambient', duration: 20, type: 'audio' },
    { id: 'sfx16', name: 'Punch Hit', category: 'Impacts', duration: 0.6, type: 'audio' },
    { id: 'sfx17', name: 'Ethereal Pad', category: 'Musical', duration: 10, type: 'audio' },
    { id: 'sfx18', name: 'Footsteps', category: 'Ambient', duration: 4.0, type: 'audio' },
];

const CATEGORIES = ['All', 'Video', 'Images', 'Audio', 'SFX'];
const SFX_CATEGORIES = ['All', 'Impacts', 'Whoosh', 'Ambient', 'UI', 'Musical'];

export function MediaLibrary({ onAddToTimeline } = {}) {
    let activeCategory = 'All';
    let sfxCategory = 'All';
    let searchQuery = '';

    const container = document.createElement('div');
    container.className = 'media-library';

    // ==========================================
    // HEADER
    // ==========================================
    const header = document.createElement('div');
    header.className = 'ml-header';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span class="text-[10px] font-black text-white/60 uppercase tracking-[0.15em]">Media Library</span>
        </div>
    `;

    const importBtn = document.createElement('button');
    importBtn.className = 'ml-import-btn';
    importBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Import`;
    importBtn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*,image/*,audio/*';
        input.multiple = true;
        input.click();
    };

    const clearBtn = document.createElement('button');
    clearBtn.className = 'ml-import-btn opacity-50 hover:opacity-100 hover:text-primary transition-all ml-1';
    clearBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Clear`;
    clearBtn.onclick = () => {
        if (confirm('Clear all generated assets from the library?')) {
            localStorage.removeItem('cinema_history');
            renderGrid();
        }
    };

    header.appendChild(importBtn);
    header.appendChild(clearBtn);
    container.appendChild(header);

    // ==========================================
    // SEARCH
    // ==========================================
    const searchBox = document.createElement('div');
    searchBox.className = 'ml-search';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search assets...';
    searchInput.className = 'ml-search-input';
    searchInput.oninput = () => {
        searchQuery = searchInput.value.toLowerCase();
        renderGrid();
    };

    const searchIcon = document.createElement('div');
    searchIcon.className = 'ml-search-icon';
    searchIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

    searchBox.appendChild(searchIcon);
    searchBox.appendChild(searchInput);
    container.appendChild(searchBox);

    // ==========================================
    // CATEGORY TABS
    // ==========================================
    const tabBar = document.createElement('div');
    tabBar.className = 'ml-tabs';

    function renderTabs() {
        tabBar.innerHTML = '';
        CATEGORIES.forEach(cat => {
            const tab = document.createElement('button');
            tab.className = `ml-tab ${activeCategory === cat ? 'active' : ''}`;
            tab.textContent = cat;
            tab.onclick = () => {
                activeCategory = cat;
                renderTabs();
                renderGrid();
            };
            tabBar.appendChild(tab);
        });
    }
    renderTabs();
    container.appendChild(tabBar);

    // ==========================================
    // ASSET GRID
    // ==========================================
    const gridSection = document.createElement('div');
    gridSection.className = 'ml-grid-section';
    container.appendChild(gridSection);

    function renderGrid() {
        gridSection.innerHTML = '';

        if (activeCategory === 'SFX' || activeCategory === 'Audio') {
            renderSfxList();
            return;
        }

        // Pull from localStorage cinema_history
        let assets = getStoredAssets();

        // Filter by category
        if (activeCategory === 'Video') {
            assets = assets.filter(a => a.type === 'video');
        } else if (activeCategory === 'Images') {
            assets = assets.filter(a => a.type === 'image');
        }

        // Filter by search
        if (searchQuery) {
            assets = assets.filter(a =>
                (a.prompt || '').toLowerCase().includes(searchQuery) ||
                (a.name || '').toLowerCase().includes(searchQuery)
            );
        }

        if (assets.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ml-empty';
            empty.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-white/10 mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span class="text-[10px] text-white/20">No assets yet</span>
                <span class="text-[9px] text-white/10 mt-1">Generate content in Cinema Studio</span>
            `;
            gridSection.appendChild(empty);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'ml-grid';

        assets.forEach(asset => {
            const item = createAssetItem(asset);
            grid.appendChild(item);
        });

        gridSection.appendChild(grid);
    }

    function renderSfxList() {
        // SFX category filter
        const sfxTabs = document.createElement('div');
        sfxTabs.className = 'ml-sfx-tabs';
        SFX_CATEGORIES.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `ml-sfx-tab ${sfxCategory === cat ? 'active' : ''}`;
            btn.textContent = cat;
            btn.onclick = () => {
                sfxCategory = cat;
                renderGrid();
            };
            sfxTabs.appendChild(btn);
        });
        gridSection.appendChild(sfxTabs);

        let sfxItems = [...SFX_LIBRARY];
        if (sfxCategory !== 'All') {
            sfxItems = sfxItems.filter(s => s.category === sfxCategory);
        }
        if (searchQuery) {
            sfxItems = sfxItems.filter(s => s.name.toLowerCase().includes(searchQuery));
        }

        const list = document.createElement('div');
        list.className = 'ml-sfx-list';

        sfxItems.forEach(sfx => {
            const item = document.createElement('div');
            item.className = 'ml-sfx-item';
            item.draggable = true;

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                    ...sfx,
                    url: '',
                    label: sfx.name
                }));
                e.dataTransfer.effectAllowed = 'copy';
                item.classList.add('opacity-50');
            });
            item.addEventListener('dragend', () => item.classList.remove('opacity-50'));

            // Waveform icon
            const waveIcon = document.createElement('div');
            waveIcon.className = 'ml-sfx-wave';
            for (let i = 0; i < 5; i++) {
                const bar = document.createElement('div');
                bar.style.height = (20 + Math.random() * 60) + '%';
                waveIcon.appendChild(bar);
            }

            const info = document.createElement('div');
            info.className = 'ml-sfx-info';
            info.innerHTML = `
                <span class="text-[10px] font-bold text-white/70">${sfx.name}</span>
                <span class="text-[8px] text-white/30">${sfx.category} · ${formatDuration(sfx.duration)}</span>
            `;

            const addBtn = document.createElement('button');
            addBtn.className = 'ml-sfx-add';
            addBtn.textContent = '+';
            addBtn.title = 'Add to timeline';
            addBtn.onclick = (e) => {
                e.stopPropagation();
                if (onAddToTimeline) onAddToTimeline(sfx);
            };

            item.appendChild(waveIcon);
            item.appendChild(info);
            item.appendChild(addBtn);
            list.appendChild(item);
        });

        gridSection.appendChild(list);
    }

    function createAssetItem(asset) {
        const item = document.createElement('div');
        item.className = 'ml-asset-item';
        item.draggable = true;

        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({
                url: asset.url || asset.thumbnail,
                type: asset.type || 'video',
                name: asset.prompt?.substring(0, 20) || 'Clip',
                thumbnail: asset.thumbnail || asset.url,
                duration: asset.type === 'video' ? 4 : 3,
                label: asset.prompt?.substring(0, 20) || 'Clip'
            }));
            e.dataTransfer.effectAllowed = 'copy';
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => item.classList.remove('dragging'));

        // Thumbnail
        const thumb = document.createElement('div');
        thumb.className = 'ml-asset-thumb';
        if (asset.type === 'video' && asset.url) {
            thumb.innerHTML = `<video src="${asset.url}" class="w-full h-full object-cover" muted preload="metadata"></video>`;
        } else {
            thumb.style.backgroundImage = `url(${asset.thumbnail || asset.url})`;
        }

        // Type badge
        const badge = document.createElement('div');
        badge.className = `ml-asset-badge ${asset.type === 'video' ? 'video' : 'image'}`;
        badge.textContent = asset.type === 'video' ? 'VID' : 'IMG';
        thumb.appendChild(badge);

        // Duration for video
        if (asset.type === 'video') {
            const dur = document.createElement('div');
            dur.className = 'ml-asset-duration';
            dur.textContent = '0:04';
            thumb.appendChild(dur);
        }

        // Hover overlay
        const overlay = document.createElement('div');
        overlay.className = 'ml-asset-overlay';
        overlay.innerHTML = `<span class="text-[8px] font-bold text-white uppercase">Drag to Timeline</span>`;
        thumb.appendChild(overlay);

        item.appendChild(thumb);

        // Label
        const label = document.createElement('div');
        label.className = 'ml-asset-label';
        label.textContent = asset.prompt?.substring(0, 30) || `Asset ${asset.id || ''}`;
        item.appendChild(label);

        return item;
    }

    function getStoredAssets() {
        try {
            const history = JSON.parse(localStorage.getItem('cinema_history') || '[]');
            return history.map((entry, idx) => ({
                id: entry.id || idx,
                type: entry.type || 'image',
                url: entry.url,
                thumbnail: entry.url,
                prompt: entry.settings?.prompt || entry.prompt || '',
                name: entry.settings?.prompt?.substring(0, 20) || `Asset ${idx + 1}`
            }));
        } catch (e) {
            return [];
        }
    }

    function formatDuration(sec) {
        if (sec < 1) return `${Math.round(sec * 1000)}ms`;
        if (sec < 60) return `${sec.toFixed(1)}s`;
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // Initial render
    renderGrid();

    // Public API
    container.refresh = renderGrid;

    return container;
}
