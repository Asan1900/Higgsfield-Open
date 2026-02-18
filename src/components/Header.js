import { AuthModal } from './AuthModal.js';

export function Header(navigate) {
    const header = document.createElement('header');
    header.className = 'w-full flex flex-col z-50 sticky top-0';

    let mobileMenuOpen = false;

    // 2. Main Navigation Bar
    const navBar = document.createElement('div');
    navBar.className = 'w-full h-16 bg-black flex items-center justify-between px-4 md:px-6 border-b border-white/5 backdrop-blur-md bg-opacity-95';

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
    logoContainer.onclick = () => navigate('image');

    const menu = document.createElement('nav');
    menu.className = 'hidden lg:flex items-center gap-6 text-[13px] font-bold text-secondary';
    const items = ['Explore', 'Image', 'Video', 'Popcorn 🍿', 'Edit', 'Character', 'Contests', 'Vibe Motion', 'Cinema Studio', 'AI Influencer', 'Apps', 'Assist', 'Community'];

    const createNavLink = (item, isMobile = false) => {
        const link = document.createElement('a');
        link.textContent = item;
        link.className = isMobile
            ? `text-lg font-black text-secondary hover:text-white transition-all cursor-pointer py-4 border-b border-white/5 w-full flex justify-between items-center`
            : `hover:text-white transition-all cursor-pointer relative group text-secondary`;

        const routes = {
            'Image': 'image',
            'Video': 'video',
            'Popcorn 🍿': 'popcorn',
            'Cinema Studio': 'cinema',
            'Explore': 'explore',
            'Character': 'character',
            'Edit': 'edit',
            'Vibe Motion': 'vibemotion',
            'Contests': 'contests',
            'AI Influencer': 'ai-influencer',
            'Apps': 'apps',
            'Assist': 'assist',
            'Community': 'community'
        };

        const route = routes[item];

        // Active Indicator or Dot (only for desktop menu)
        if (!isMobile && item === 'Image') {
            link.classList.add('text-white');
            const dot = document.createElement('div');
            dot.className = 'active-dot absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full';
            link.appendChild(dot);
        }

        if (item === 'Contests' || item === 'Popcorn 🍿') {
            link.innerHTML += ' <span class="bg-primary/10 text-primary text-[8px] px-1.5 py-0.5 rounded-full ml-1 border border-primary/20">New</span>';
        }

        link.onclick = (e) => {
            // Remove active state from all desktop links
            if (!isMobile) {
                Array.from(menu.children).forEach(child => {
                    child.classList.remove('text-white');
                    const existingDot = child.querySelector('.active-dot');
                    if (existingDot) existingDot.remove();
                });
                // Add active state to current desktop link
                link.classList.add('text-white');
                const dot = document.createElement('div');
                dot.className = 'active-dot absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full';
                link.appendChild(dot);
            } else {
                closeMobileMenu();
            }
            if (route) navigate(route);
        };

        return link;
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
    keyBtn.onclick = () => {
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
