
export function VibeMotion() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg text-white p-6 overflow-y-auto custom-scrollbar';

    // Header
    const header = document.createElement('div');
    header.className = 'text-center mb-10 w-full flex flex-col items-center';
    header.innerHTML = `
        <h1 class="text-4xl md:text-6xl font-black tracking-tighter mb-2 italic">VIBE <span class="text-primary not-italic">MOTION</span></h1>
        <p class="text-secondary text-sm font-medium tracking-wide opacity-60">Transform videos with AI Style Transfer</p>
        
        <div class="flex gap-4 mt-6">
            <button class="px-6 py-2 bg-white text-black font-bold rounded-full text-sm">Motion Transfer</button>
            <button class="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full text-sm transition-colors">Style Transfer</button>
        </div>
    `;
    container.appendChild(header);

    // Main Content
    const content = document.createElement('div');
    content.className = 'w-full max-w-5xl flex flex-col md:flex-row items-center gap-8';

    // Source Card
    const sourceCard = document.createElement('div');
    sourceCard.className = 'flex-1 w-full aspect-[9/16] bg-[#111] border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center relative group hover:border-primary/50 transition-colors cursor-pointer overflow-hidden';
    sourceCard.innerHTML = `
        <div class="text-center p-6 transition-opacity group-hover:opacity-0">
            <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </div>
            <h3 class="font-bold text-lg mb-1">Upload Source Video</h3>
            <p class="text-xs text-white/40">Drag & drop or click</p>
        </div>
        <div class="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="text-primary font-bold">Select Video</span>
        </div>
    `;

    // File Input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/*';
    fileInput.className = 'hidden';
    sourceCard.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            sourceCard.className = 'flex-1 w-full aspect-[9/16] bg-black border border-white/10 rounded-3xl overflow-hidden relative';
            sourceCard.innerHTML = `
                <video src="${url}" class="w-full h-full object-cover opacity-60" autoplay loop muted playsinline></video>
                <div class="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold">Source</div>
            `;
            sourceCard.onclick = null; // Disable re-upload for demo

            // Enable processing
            checkReady();
        }
    };

    // Arrow
    const arrow = document.createElement('div');
    arrow.className = 'text-white/20 rotate-90 md:rotate-0 flex flex-col items-center gap-2';
    arrow.innerHTML = `
        <span class="text-[10px] font-bold uppercase tracking-widest">Process</span>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    `;

    // Target/Output Card
    const targetCard = document.createElement('div');
    targetCard.className = 'flex-1 w-full aspect-[9/16] bg-[#111] border border-white/5 rounded-3xl flex flex-col items-center justify-center p-6';

    targetCard.innerHTML = `
        <h3 class="font-bold text-lg mb-4">Choose Style</h3>
        <div class="grid grid-cols-2 gap-3 w-full">
            <button class="style-btn p-3 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center gap-2 transition-all border border-transparent hover:border-primary/50" data-style="clay">
                <div class="w-8 h-8 rounded-full bg-orange-500/20"></div>
                <span class="text-xs font-bold">Claymation</span>
            </button>
            <button class="style-btn p-3 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center gap-2 transition-all border border-transparent hover:border-primary/50" data-style="anime">
                <div class="w-8 h-8 rounded-full bg-pink-500/20"></div>
                <span class="text-xs font-bold">Anime</span>
            </button>
            <button class="style-btn p-3 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center gap-2 transition-all border border-transparent hover:border-primary/50" data-style="lego">
                <div class="w-8 h-8 rounded-full bg-yellow-500/20"></div>
                <span class="text-xs font-bold">Lego</span>
            </button>
            <button class="style-btn p-3 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center gap-2 transition-all border border-transparent hover:border-primary/50" data-style="cyber">
                <div class="w-8 h-8 rounded-full bg-cyan-500/20"></div>
                <span class="text-xs font-bold">Cyberpunk</span>
            </button>
        </div>
        
        <button id="vibe-btn" class="w-full mt-6 bg-primary text-black font-black uppercase py-4 rounded-xl opacity-50 cursor-not-allowed transition-all">
            Transfer Vibe ⚡
        </button>
    `;

    content.appendChild(sourceCard);
    content.appendChild(arrow);
    content.appendChild(targetCard);
    container.appendChild(content);

    // Logic
    let selectedStyle = null;
    const styleBtns = targetCard.querySelectorAll('.style-btn');
    const vibeBtn = targetCard.querySelector('#vibe-btn');

    styleBtns.forEach(btn => {
        btn.onclick = () => {
            styleBtns.forEach(b => b.classList.remove('bg-primary/20', 'border-primary'));
            btn.classList.add('bg-primary/20', 'border-primary');
            selectedStyle = btn.dataset.style;
            checkReady();
        };
    });

    function checkReady() {
        // Check if source loaded (by class name change lol)
        const hasSource = sourceCard.querySelector('video');
        if (hasSource && selectedStyle) {
            vibeBtn.disabled = false;
            vibeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            vibeBtn.classList.add('hover:scale-105', 'active:scale-95', 'shadow-glow');
        }
    }

    vibeBtn.onclick = () => {
        vibeBtn.innerHTML = `<span class="animate-spin inline-block mr-2">◌</span> Processing...`;
        vibeBtn.disabled = true;

        setTimeout(() => {
            // Mock Result
            targetCard.innerHTML = `
                <video src="https://cdn.pixabay.com/video/2023/10/22/186115-877653483_large.mp4" class="w-full h-full object-cover rounded-3xl" autoplay loop muted playsinline></video>
                <div class="absolute bottom-4 right-4 bg-primary text-black px-3 py-1 rounded-lg text-xs font-bold shadow-lg">Vibed</div>
            `;
            targetCard.className = 'flex-1 w-full aspect-[9/16] bg-black border border-white/10 rounded-3xl overflow-hidden relative animate-fade-in';
        }, 3000);
    };

    return container;
}
