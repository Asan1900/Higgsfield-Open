
export function Contents() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col bg-app-bg text-white overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-20 relative';

    // Background Glows
    const bgGlow1 = document.createElement('div');
    bgGlow1.className = 'fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-40';
    container.appendChild(bgGlow1);

    const bgGlow2 = document.createElement('div');
    bgGlow2.className = 'fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none opacity-30';
    container.appendChild(bgGlow2);

    // Hero Section
    const hero = document.createElement('div');
    hero.className = 'relative z-10 mb-16 animate-fade-in-up';
    hero.innerHTML = `
        <h1 class="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">
            Creative <span class="text-primary">Studios</span>
        </h1>
        <p class="text-secondary text-base md:text-xl max-w-2xl leading-relaxed">
            Welcome to Open Higgsfield. Explore our suite of advanced AI models designed to empower your imagination and streamline your creative workflow.
        </p>
    `;
    container.appendChild(hero);

    // Studios Section
    const sectionTitle = (text) => {
        const h2 = document.createElement('h2');
        h2.className = 'text-[10px] font-black text-muted uppercase tracking-[0.4em] mb-8 relative z-10';
        h2.textContent = text;
        return h2;
    };

    container.appendChild(sectionTitle('Main Studios'));

    const mainGrid = document.createElement('div');
    mainGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 relative z-10';

    const mainStudios = [
        {
            id: 'image',
            title: 'Image Studio',
            desc: 'Powerful text-to-image generation with Flux Pro and curated creative models.',
            icon: 'AI',
            color: 'primary',
            accent: 'bg-primary/20 text-primary border-primary/30'
        },
        {
            id: 'cinema',
            title: 'Cinema Studio',
            desc: 'Cinematic video generation with precise camera control and motion settings.',
            icon: 'Cam',
            color: 'purple',
            accent: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        },
        {
            id: 'video',
            title: 'Video Studio',
            desc: 'Compose and render high-fidelity videos with advanced AI influencers and scenes.',
            icon: 'Vid',
            color: 'blue',
            accent: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        },
        {
            id: 'character',
            title: 'Character Studio',
            desc: 'Design, refine, and animate unique characters for your digital storytelling.',
            icon: 'Chr',
            color: 'amber',
            accent: 'bg-amber-400/20 text-amber-400 border-amber-400/30'
        }
    ];

    mainStudios.forEach((s, idx) => {
        const card = createStudioCard(s, true);
        card.style.animationDelay = `${0.3 + idx * 0.1}s`;
        mainGrid.appendChild(card);
    });

    container.appendChild(mainGrid);

    // Advanced Tools
    container.appendChild(sectionTitle('Advanced Tools & Features'));

    const toolsGrid = document.createElement('div');
    toolsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-20 relative z-10';

    const tools = [
        { id: 'explore', title: 'Explore Hub', desc: 'Browse and remix community creations', icon: 'Ex' },
        { id: 'persona', title: 'Persona Studio', desc: 'Face-lock identity generation', icon: '🎭' },
        { id: 'motion', title: 'Motion Master', desc: 'Animate images to cinematic video', icon: '▶' },
        { id: 'text-to-video', title: 'AI Video Studio', desc: 'Unified prompt & director controls', icon: '🎬' },
        { id: 'cinematic-shorts', title: 'Cinematic Shorts', desc: 'Multi-scene storyboard films', icon: '🎞️' },
        { id: 'video-loops', title: 'Video Loops', desc: 'Seamless looping backgrounds', icon: '🔁' },
        { id: 'brandlab', title: 'Brand Lab', desc: 'Typography and logo design', icon: 'Aa' },
        { id: 'reimagine', title: 'Atmosphere Lab', desc: 'Scene mood and style transfer', icon: '🌌' },
        { id: 'upscale', title: 'Smart Upscaler', desc: 'AI-powered 4K enhancement', icon: '4K' },
        { id: 'outpaint', title: 'Infinite Canvas', desc: 'Extend borders with AI expansion', icon: '∞' },
        { id: 'style-studio', title: 'Style Studio', desc: 'Transfer & blend image styles', icon: '🎨' },
        { id: 'magic-editor', title: 'Magic Editor', desc: 'Text-guided image modifications', icon: '🪄' },
        { id: 'batch-look', title: 'Batch Look', desc: 'Consistent look across sets', icon: '📦' },
        { id: 'portrait-enhancer', title: 'Portrait Enhancer', desc: 'Face, skin, and eyes controls', icon: 'Prt' },
        { id: 'background', title: 'Background Lab', desc: 'Replace or remove backgrounds', icon: '🪄' },
        { id: 'vibemotion', title: 'Vibe Motion', desc: 'Rhythmic motion generation', icon: 'VM' },
        { id: 'popcorn', title: 'Popcorn Studio', desc: 'Comic strip and sequence generation', icon: '🍿' },
        { id: 'edit', title: 'Edit Suite', desc: 'Post-production and prompt editing', icon: 'Ed' }
    ];

    tools.forEach((t, idx) => {
        const card = createStudioCard(t, false);
        card.style.animationDelay = `${0.6 + idx * 0.05}s`;
        toolsGrid.appendChild(card);
    });

    container.appendChild(toolsGrid);

    function createStudioCard(data, isMain) {
        const card = document.createElement('div');
        card.className = `glass relative group cursor-pointer p-6 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 animate-fade-in-up opacity-0 fill-mode-forwards ${isMain ? 'min-h-[220px]' : 'p-5'}`;

        const iconContainer = document.createElement('div');
        iconContainer.className = `w-12 h-12 rounded-2xl mb-5 flex items-center justify-center font-black text-sm border ${data.accent || 'bg-white/5 border-white/10 text-secondary'}`;
        iconContainer.textContent = data.icon;
        card.appendChild(iconContainer);

        const title = document.createElement('h3');
        title.className = `font-black uppercase tracking-tight mb-2 ${isMain ? 'text-2xl' : 'text-lg'}`;
        title.textContent = data.title;
        card.appendChild(title);

        const desc = document.createElement('p');
        desc.className = 'text-secondary text-sm leading-relaxed line-clamp-2';
        desc.textContent = data.desc;
        card.appendChild(desc);

        const arrow = document.createElement('div');
        arrow.className = 'absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0';
        arrow.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-primary"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
        card.appendChild(arrow);

        card.onclick = () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { page: data.id } }));
        };

        return card;
    }

    return container;
}
