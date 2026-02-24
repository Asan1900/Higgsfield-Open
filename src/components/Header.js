// Imports

export function Header(navigate) {
    const header = document.createElement('header');
    header.className = 'w-full flex flex-col z-50 sticky top-0';

    let mobileMenuOpen = false;

    // 2. Main Navigation Bar
    const navBar = document.createElement('div');
    navBar.className = 'w-full h-16 bg-black flex items-center justify-between px-4 md:px-6 border-b border-white/5 backdrop-blur-md bg-opacity-95 relative overflow-visible';
    // Gradient shimmer behind nav
    const navGlow = document.createElement('div');
    navGlow.className = 'absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(118,255,122,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(0,199,255,0.12),transparent_28%),radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.08),transparent_40%)] opacity-70';
    navBar.appendChild(navGlow);

    const leftPart = document.createElement('div');
    leftPart.className = 'flex items-center gap-8';

    // Logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'cursor-pointer hover:scale-110 transition-transform flex items-center gap-3';
    logoContainer.innerHTML = `
        <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="black"/>
                <path d="M2 17L12 22L22 17" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <span class="text-white font-black text-sm tracking-tighter hidden sm:block uppercase">Open Higgsfield</span>
    `;
    logoContainer.onclick = () => navigate('contents');

    const menu = document.createElement('nav');
    menu.className = 'hidden lg:flex items-center gap-4 text-[13px] font-bold text-secondary';
    const items = ['Home', 'Explore', 'Image', 'Video', 'Edit', 'Character', 'Cinema Studio', 'AI Influencer', 'Apps', 'Community'];

    // Track open dropdown (desktop)
    let openDropdown = null;
    const closeDropdown = () => {
        if (openDropdown) {
            const { btn, menuEl } = openDropdown;
            menuEl.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
            menuEl.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
            btn.setAttribute('aria-expanded', 'false');
            openDropdown = null;
        }
    };
    // Close on Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDropdown();
    });
    document.addEventListener('click', (e) => {
        // Close when clicking outside
        if (openDropdown && !openDropdown.wrapper.contains(e.target)) {
            closeDropdown();
        }
    });
    // Close dropdowns on route change
    window.addEventListener('route:changed', closeDropdown);

    const createNavLink = (item, isMobile = false) => {
        const routes = {
            'Home': 'contents',
            'Image': 'image',
            'Video': 'video',
            'Cinema Studio': 'cinema',
            'Explore': 'explore',
            'Character': 'character',
            'Edit': 'edit',
            'AI Influencer': 'ai-influencer',
            'Apps': 'apps',
            'Community': 'community'
        };

        const route = routes[item];

        // Mobile keeps the simpler link style
        if (isMobile) {
            const mobileLink = document.createElement('a');
            mobileLink.textContent = item;
            mobileLink.className = 'text-lg font-black text-secondary hover:text-white transition-all cursor-pointer py-4 border-b border-white/5 w-full flex justify-between items-center';
            if (item === 'Popcorn 🍿' || item === 'Image') {
                const badge = document.createElement('span');
                badge.className = 'bg-primary/10 text-primary text-[8px] px-1.5 py-0.5 rounded-full ml-1 border border-primary/20';
                badge.textContent = 'New';
                mobileLink.appendChild(badge);
            }
            mobileLink.onclick = () => {
                closeMobileMenu();
                if (route) navigate(route);
            };
            return mobileLink;
        }

        // Desktop structured button + badge, aria + data attributes
        const wrapper = document.createElement('div');
        wrapper.className = 'group relative';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-haspopup', 'menu');
        btn.setAttribute('aria-controls', `${route || 'menu'}-menu`);
        btn.setAttribute('aria-expanded', 'false');
        btn.dataset.headerMenu = `${route || 'menu'}-menu`;
        btn.dataset.headerMenuTrigger = 'true';
        btn.dataset.headerActiveOn = `/${route || ''}/**`;
        btn.dataset.active = (route === 'contents' || route === 'home') ? 'true' : 'false';
        btn.className = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold leading-tight transition group-hover:bg-white/5 focus:bg-white/5 text-secondary data-[active=true]:text-white active:opacity-70 hover:text-primary align-middle hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60';
        btn.textContent = item;

        if (item === 'Popcorn 🍿' || item === 'Image') {
            const badge = document.createElement('span');
            badge.className = 'inline-flex items-center justify-center h-5 min-w-[26px] rounded-sm text-[10px] font-bold bg-primary/10 text-primary px-1 border border-primary/20';
            badge.textContent = 'New';
            btn.appendChild(badge);
        }

        const setActive = (isActive) => {
            btn.dataset.active = isActive ? 'true' : 'false';
            btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            // remove existing dots
            const existingDot = wrapper.querySelector('.active-dot');
            if (existingDot) existingDot.remove();
            if (isActive) {
                const dot = document.createElement('div');
                dot.className = 'active-dot absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full';
                wrapper.appendChild(dot);
            }
        };

        // initial active state
        setActive(item === 'Home');

        // Optional dropdowns
        let dropdown;
        if (item === 'Image') {
            dropdown = document.createElement('div');
            dropdown.id = `${route}-menu`;
            dropdown.setAttribute('role', 'menu');
            dropdown.className = 'absolute top-full left-0 mt-3 w-[640px] max-h-[70vh] rounded-2xl bg-[#0b0b0f]/95 border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar opacity-0 pointer-events-none translate-y-2 transition-all duration-200 backdrop-blur-xl pr-2 overscroll-contain';
            dropdown.innerHTML = `
                <div class="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/6 via-transparent to-transparent rounded-2xl"></div>
                <div class="relative grid grid-cols-2 gap-2 p-2">
                    ${[
                    { dest: 'image', icon: 'AI', bg: 'bg-primary/15 border-primary/30 text-primary', title: 'Image Studio', desc: 'Create from text prompts' },
                    { dest: 'persona', icon: '🎭', bg: 'bg-pink-300/15 border-pink-200/40 text-pink-200', title: 'Persona Studio', desc: 'Face & identity lock' },
                    { dest: 'motion', icon: '▶', bg: 'bg-violet-300/15 border-violet-200/40 text-violet-200', title: 'Motion Master', desc: 'Animate images to video' },
                    { dest: 'brandlab', icon: 'Aa', bg: 'bg-amber-400/15 border-amber-300/40 text-amber-300', title: 'Brand Lab', desc: 'Typography & logo design' },
                    { dest: 'remix', icon: 'Fx', bg: 'bg-amber-300/20 border-amber-200/40 text-amber-200', title: 'Remix', desc: 'Start from an existing asset' },
                    { dest: 'upscale', icon: '4K', bg: 'bg-sky-300/15 border-sky-200/40 text-sky-200', title: 'Smart Upscaler', desc: '4K AI enhancement' },
                    { dest: 'background', icon: 'Bg', bg: 'bg-fuchsia-300/15 border-fuchsia-200/40 text-fuchsia-200', title: 'Background', desc: 'Remove or replace' },
                    { dest: 'style-studio', icon: '🎨', bg: 'bg-indigo-300/15 border-indigo-200/40 text-indigo-400', title: 'Style Studio', desc: 'Transfer & blend styles' },
                    { dest: 'magic-editor', icon: '🪄', bg: 'bg-fuchsia-500/20 border-fuchsia-400/30 text-fuchsia-400', title: 'Magic Editor', desc: 'Text-guided image edits' },
                    { dest: 'reimagine', icon: '🌌', bg: 'bg-emerald-300/15 border-emerald-200/40 text-emerald-200', title: 'Atmosphere Lab', desc: 'Scene reimagining' },
                    { dest: 'batch-look', icon: 'Set', bg: 'bg-sky-300/15 border-sky-200/40 text-sky-200', title: 'Batch Consistent Look', desc: 'Propagate look to sets' },
                    { dest: 'portrait-enhancer', icon: 'Prt', bg: 'bg-amber-200/15 border-amber-100/40 text-amber-200', title: 'Portrait Enhancer', desc: 'Face/skin/eyes controls' },
                    { dest: 'popcorn', icon: '🍿', bg: 'bg-amber-300/20 border-amber-200/40 text-amber-200', title: 'Popcorn Comics', desc: 'Create comic strips' }
                ].map(item => `
                        <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition rounded-xl" role="menuitem" data-dest="${item.dest}">
                            <span class="w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center text-[11px] font-black">${item.icon}</span>
                            <div class="flex flex-col leading-tight">
                                <span>${item.title}</span>
                                <span class="text-[11px] text-secondary">${item.desc}</span>
                            </div>
                        </button>
                    `).join('')}
                </div>
            `;

            dropdown.querySelectorAll('button[role="menuitem"]').forEach(btnEl => {
                btnEl.onclick = (e) => {
                    e.stopPropagation();
                    closeDropdown();
                    const dest = btnEl.dataset.dest;
                    navigate(dest);
                };
            });

            wrapper.appendChild(dropdown);
        } else if (item === 'Video') {
            dropdown = document.createElement('div');
            dropdown.id = `${route}-menu`;
            dropdown.setAttribute('role', 'menu');
            dropdown.className = 'absolute top-full left-0 mt-3 w-56 rounded-2xl bg-[#0b0b0f]/95 border border-white/10 shadow-2xl overflow-hidden opacity-0 pointer-events-none translate-y-2 transition-all duration-200 backdrop-blur-xl';
            dropdown.innerHTML = `
                <div class="flex flex-col divide-y divide-white/5">
                    <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition" role="menuitem" data-dest="video">
                        <span class="w-8 h-8 rounded-xl bg-blue-300/15 border border-blue-200/40 flex items-center justify-center text-[11px] font-black text-blue-200">Vid</span>
                        <div class="flex flex-col leading-tight">
                            <span>Video Studio</span>
                            <span class="text-[11px] text-secondary">Compose and render</span>
                        </div>
                    </button>
                    <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition" role="menuitem" data-dest="text-to-video">
                        <span class="w-8 h-8 rounded-xl bg-red-300/15 border border-red-200/40 flex items-center justify-center text-[11px] font-black text-red-200">🎬</span>
                        <div class="flex flex-col leading-tight">
                            <span>Text to Video</span>
                            <span class="text-[11px] text-secondary">Prompt → cinematic video</span>
                        </div>
                    </button>
                    <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition" role="menuitem" data-dest="cinematic-shorts">
                        <span class="w-8 h-8 rounded-xl bg-amber-300/15 border border-amber-200/40 flex items-center justify-center text-[11px] font-black text-amber-200">🎞️</span>
                        <div class="flex flex-col leading-tight">
                            <span>Cinematic Shorts</span>
                            <span class="text-[11px] text-secondary">Multi-scene storyboard</span>
                        </div>
                    </button>
                    <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition" role="menuitem" data-dest="video-loops">
                        <span class="w-8 h-8 rounded-xl bg-teal-300/15 border border-teal-200/40 flex items-center justify-center text-[11px] font-black text-teal-200">🔁</span>
                        <div class="flex flex-col leading-tight">
                            <span>Video Loops</span>
                            <span class="text-[11px] text-secondary">Seamless backgrounds</span>
                        </div>
                    </button>
                    <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition" role="menuitem" data-dest="motion">
                        <span class="w-8 h-8 rounded-xl bg-violet-300/15 border border-violet-200/40 flex items-center justify-center text-[11px] font-black text-violet-200">▶</span>
                        <div class="flex flex-col leading-tight">
                            <span>Motion Master</span>
                            <span class="text-[11px] text-secondary">Animate images to video</span>
                        </div>
                    </button>
                    <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition" role="menuitem" data-dest="popcorn">
                        <span class="w-8 h-8 rounded-xl bg-amber-300/20 border border-amber-200/40 flex items-center justify-center text-[11px] font-black text-amber-200">🍿</span>
                        <div class="flex flex-col leading-tight">
                            <span>Popcorn Studio</span>
                            <span class="text-[11px] text-secondary">Snackable edits</span>
                        </div>
                    </button>
                </div>
            `;

            dropdown.querySelectorAll('button[role="menuitem"]').forEach(btnEl => {
                btnEl.onclick = (e) => {
                    e.stopPropagation();
                    closeDropdown();
                    navigate(btnEl.dataset.dest);
                };
            });

            wrapper.appendChild(dropdown);
        } else if (item === 'Cinema Studio') {
            dropdown = document.createElement('div');
            dropdown.id = `${route}-menu`;
            dropdown.setAttribute('role', 'menu');
            dropdown.className = 'absolute top-full left-0 mt-3 w-56 rounded-2xl bg-[#0b0b0f]/95 border border-white/10 shadow-2xl overflow-hidden opacity-0 pointer-events-none translate-y-2 transition-all duration-200 backdrop-blur-xl';
            dropdown.innerHTML = `
                <div class="flex flex-col divide-y divide-white/5">
                    <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition" role="menuitem" data-dest="cinema">
                        <span class="w-8 h-8 rounded-xl bg-purple-300/15 border border-purple-200/40 flex items-center justify-center text-[11px] font-black text-purple-200">Cam</span>
                        <div class="flex flex-col leading-tight">
                            <span>Cinema Studio</span>
                            <span class="text-[11px] text-secondary">Shots & motion</span>
                        </div>
                    </button>
                    <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition" role="menuitem" data-dest="vibemotion">
                        <span class="w-8 h-8 rounded-xl bg-pink-300/15 border border-pink-200/40 flex items-center justify-center text-[11px] font-black text-pink-200">VM</span>
                        <div class="flex flex-col leading-tight">
                            <span>Vibe Motion</span>
                            <span class="text-[11px] text-secondary">Rhythm & pacing</span>
                        </div>
                    </button>
                    <button class="flex items-center gap-3 px-4 py-3 text-left text-white text-sm font-bold border border-transparent hover:bg-white/5 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 transition" role="menuitem" data-dest="vibemotion">
                        <span class="w-8 h-8 rounded-xl bg-sky-300/15 border border-sky-200/40 flex items-center justify-center text-[11px] font-black text-sky-200">Fx</span>
                        <div class="flex flex-col leading-tight">
                            <span>Motion FX</span>
                            <span class="text-[11px] text-secondary">Preset camera moves</span>
                        </div>
                    </button>
                </div>
            `;

            dropdown.querySelectorAll('button[role="menuitem"]').forEach(btnEl => {
                btnEl.onclick = (e) => {
                    e.stopPropagation();
                    closeDropdown();
                    const dest = btnEl.dataset.dest;
                    if (dest === 'cinema') navigate('cinema');
                    else if (dest === 'vibemotion') navigate('vibemotion');
                };
            });

            wrapper.appendChild(dropdown);
        }

        const openDropdownForBtn = () => {
            if (dropdown) {
                const isOpen = openDropdown?.btn === btn;
                closeDropdown();
                if (!isOpen) {
                    dropdown.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
                    dropdown.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
                    btn.setAttribute('aria-expanded', 'true');
                    openDropdown = { btn, menuEl: dropdown, wrapper };
                }
            } else {
                closeDropdown();
            }
        };

        btn.onclick = (e) => {
            e.stopPropagation();
            Array.from(menu.children).forEach(child => {
                const buttonEl = child.querySelector('button');
                if (buttonEl) {
                    buttonEl.dataset.active = 'false';
                    buttonEl.setAttribute('aria-expanded', 'false');
                }
                const dot = child.querySelector('.active-dot');
                if (dot) dot.remove();
            });
            setActive(true);
            if (dropdown) {
                openDropdownForBtn();
            } else if (route) {
                navigate(route);
            }
        };

        if (dropdown) {
            const stopScroll = (e) => {
                if (openDropdown?.btn === btn) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            };
            // Keep dropdown open while scrolling (wheel) over nav/dropdown
            wrapper.addEventListener('wheel', stopScroll, { passive: false });
            dropdown.addEventListener('wheel', stopScroll, { passive: false });
        }

        // Update active state on global route changes
        window.addEventListener('route:changed', (ev) => {
            const current = ev.detail?.page;
            const isActive = current === route;
            setActive(isActive);
        });

        // Removed mouseleave auto-close to keep dropdown open while user scrolls

        wrapper.appendChild(btn);
        return wrapper;
    };

    items.forEach(item => {
        menu.appendChild(createNavLink(item));
    });

    leftPart.appendChild(logoContainer);
    leftPart.appendChild(menu);

    const rightPart = document.createElement('div');
    rightPart.className = 'flex items-center gap-2 md:gap-4';

    const keyBtn = document.createElement('button');
    keyBtn.className = 'p-2 text-secondary hover:text-white transition-colors flex items-center gap-2 bg-white/5 md:bg-transparent rounded-lg md:rounded-none';
    keyBtn.title = 'Update API Key';
    keyBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25"/>
        </svg>
        <span class="text-[10px] font-bold uppercase tracking-tight hidden md:block">API Key</span>
    `;
    keyBtn.onclick = async () => {
        const { AuthModal } = await import('./AuthModal.js');
        AuthModal(() => {
            console.log('API Key updated successfully');
        });
    };

    // Mobile Hamburger
    const hamburger = document.createElement('button');
    hamburger.className = 'lg:hidden p-2 text-white';
    hamburger.innerHTML = `
        <svg id="hamburger-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    `;

    // Mobile Menu Overlay
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'fixed inset-0 bg-black z-50 flex flex-col p-6 transition-transform duration-500 translate-x-full lg:hidden';
    mobileMenu.innerHTML = `
        <div class="flex items-center justify-between mb-10">
            <div class="flex items-center gap-3">
                 <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="black"/>
                        <path d="M2 17L12 22L22 17" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <span class="text-white font-black text-lg uppercase tracking-wider">Higgsfield</span>
            </div>
            <button id="close-mobile-menu" class="text-white p-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        </div>
        <div id="mobile-links" class="flex flex-col overflow-y-auto"></div>
    `;

    const mobileLinks = mobileMenu.querySelector('#mobile-links');
    items.forEach(item => {
        mobileLinks.appendChild(createNavLink(item, true));
    });

    const openMobileMenu = () => {
        mobileMenu.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
    };

    const closeMobileMenu = () => {
        mobileMenu.classList.add('translate-x-full');
        document.body.style.overflow = '';
    };

    hamburger.onclick = openMobileMenu;
    mobileMenu.querySelector('#close-mobile-menu').onclick = closeMobileMenu;

    rightPart.appendChild(keyBtn);
    rightPart.appendChild(hamburger);

    navBar.appendChild(leftPart);
    navBar.appendChild(rightPart);

    header.appendChild(navBar);
    header.appendChild(mobileMenu);

    return header;
}
