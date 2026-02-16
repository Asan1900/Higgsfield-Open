
import { exploreData } from '../lib/mockData.js';

export function Explore() {
    try {
        const container = document.createElement('div');
        container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-y-auto custom-scrollbar';

        // Header
        const header = document.createElement('div');
        header.className = 'sticky top-0 z-40 bg-app-bg/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between';

        const title = document.createElement('h1');
        title.className = 'text-2xl font-black tracking-tight';
        title.innerHTML = 'EXPLORE <span class="text-primary text-sm font-bold align-middle ml-2 px-2 py-0.5 bg-primary/10 rounded-full">BETA</span>';
        header.appendChild(title);

        // Filters
        const filters = document.createElement('div');
        filters.className = 'flex gap-2';
        ['All', 'Video', 'Image'].forEach(f => {
            const btn = document.createElement('button');
            btn.className = 'px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ' + (f === 'All' ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10');
            btn.textContent = f;
            filters.appendChild(btn);
        });
        header.appendChild(filters);

        container.appendChild(header);

        // Grid (Masonry-ish using CSS columns)
        const grid = document.createElement('div');
        grid.className = 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 p-4 space-y-4';

        if (Array.isArray(exploreData)) {
            exploreData.forEach(item => {
                const card = createCard(item);
                grid.appendChild(card);
            });
        }

        container.appendChild(grid);

        return container;
    } catch (e) {
        console.error('Error in Explore component:', e);
        const errContainer = document.createElement('div');
        errContainer.className = 'text-red-500 p-10';
        errContainer.textContent = 'Explore Component Error: ' + e.message;
        return errContainer;
    }
}

function createCard(item) {
    const card = document.createElement('div');
    card.className = 'break-inside-avoid relative group rounded-xl overflow-hidden bg-[#1a1a1a] cursor-pointer hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300';

    // Media
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'relative aspect-auto';

    const img = document.createElement('img');
    img.src = item.thumbnail;
    img.className = 'w-full h-auto object-cover block transition-transform duration-700 group-hover:scale-105';
    mediaContainer.appendChild(img);

    // Badge
    const badge = document.createElement('div');
    badge.className = 'absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-sm border border-white/10';
    badge.textContent = item.type;
    mediaContainer.appendChild(badge);

    card.appendChild(mediaContainer);

    // Overlay content (visible on hover)
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end';

    const prompt = document.createElement('p');
    prompt.className = 'text-xs font-medium text-white line-clamp-3 mb-2';
    prompt.textContent = item.prompt;
    overlay.appendChild(prompt);

    const meta = document.createElement('div');
    meta.className = 'flex items-center justify-between text-[10px] text-white/60';
    meta.innerHTML = `
        <span class="flex items-center gap-1"><span class="w-4 h-4 rounded-full bg-white/20"></span> ${item.author}</span>
        <span class="flex items-center gap-1">♥ ${item.likes}</span>
    `;
    overlay.appendChild(meta);

    card.appendChild(overlay);

    // Click -> Open Modal
    card.onclick = () => openModal(item);

    return card;
}

function openModal(item) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-4';

    const content = document.createElement('div');
    content.className = 'w-full max-w-5xl h-[80vh] bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative';

    // Close Button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 rounded-full hover:bg-white text-white hover:text-black transition-colors';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => modal.remove();
    content.appendChild(closeBtn);

    // Left: Media
    const mediaSide = document.createElement('div');
    mediaSide.className = 'w-full md:w-2/3 h-1/2 md:h-full bg-black flex items-center justify-center';

    if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.url;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.className = 'max-w-full max-h-full object-contain';
        mediaSide.appendChild(video);
    } else {
        const image = document.createElement('img');
        image.src = item.url;
        image.className = 'max-w-full max-h-full object-contain';
        mediaSide.appendChild(image);
    }
    content.appendChild(mediaSide);

    // Right: Details
    const detailsSide = document.createElement('div');
    detailsSide.className = 'w-full md:w-1/3 h-1/2 md:h-full p-6 md:p-8 flex flex-col bg-[#111] border-l border-white/5';

    // ... Details content (Prompt, Author, Settings) ...
    detailsSide.innerHTML = `
        <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500"></div>
            <div>
                <h3 class="font-bold text-white">${item.author}</h3>
                <p class="text-xs text-secondary">Pro Creator</p>
            </div>
            <button class="ml-auto px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-primary">Follow</button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
            <div>
                <h4 class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Prompt</h4>
                <p class="text-sm text-white/90 leading-relaxed font-mono bg-black/30 p-3 rounded-lg border border-white/5 select-text">${item.prompt}</p>
            </div>
            
            ${item.settings ? `
            <div>
                <h4 class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Settings</h4>
                <div class="grid grid-cols-2 gap-2">
                    ${Object.entries(item.settings).map(([k, v]) => `
                        <div class="bg-black/30 p-2 rounded border border-white/5">
                            <span class="text-[9px] text-white/40 block uppercase">${k}</span>
                            <span class="text-xs text-white font-medium">${v}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;

    // Remix Button
    const remixBtn = document.createElement('button');
    remixBtn.className = 'w-full mt-6 py-3 bg-white text-black font-black uppercase tracking-wide rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-glow flex items-center justify-center gap-2';
    remixBtn.innerHTML = `<span>⚡ Remix this</span>`;
    remixBtn.onclick = () => {
        // Save to localStorage
        localStorage.setItem('remixData', JSON.stringify(item));

        // Navigation Logic
        const targetPage = item.type === 'video' ? 'cinema' : 'image';

        // Remove modal
        modal.remove();

        // Dispatch navigation event
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: targetPage } }));
    };
    detailsSide.appendChild(remixBtn);

    content.appendChild(detailsSide);
    modal.appendChild(content);
    document.body.appendChild(modal);
}
