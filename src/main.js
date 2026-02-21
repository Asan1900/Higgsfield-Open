import './style.css';
import { Header } from './components/Header.js';
import { ImageStudio } from './components/ImageStudio.js';
import { ComingSoon } from './components/ComingSoon.js';
import { eventBus } from './lib/EventBus.js';

const app = document.querySelector('#app');
let contentArea;
let pendingContext = null;

// Global Loading Overlay
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300';
loadingOverlay.innerHTML = `
    <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <span class="text-xs font-black text-white uppercase tracking-[0.2em] animate-pulse">Loading Studio...</span>
    </div>
`;
document.body.appendChild(loadingOverlay);

/**
 * Global loading state manager
 * @param {boolean} isLoading 
 */
function setLoading(isLoading) {
  if (isLoading) {
    loadingOverlay.classList.remove('pointer-events-none', 'opacity-0');
    loadingOverlay.classList.add('opacity-100');
  } else {
    loadingOverlay.classList.add('pointer-events-none', 'opacity-0');
    loadingOverlay.classList.remove('opacity-100');
  }
}

// Router
async function navigate(page, context) {
  if (!contentArea) return;
  
  setLoading(true);
  
  // Clean up previous content if it has a cleanup function
  const oldContent = contentArea.firstChild;
  if (oldContent && oldContent._cleanup) {
    try { oldContent._cleanup(); } catch (e) { console.warn('Cleanup error:', e); }
  }

  contentArea.innerHTML = '';
  pendingContext = context || null;

  try {
    if (page === 'image') {
      contentArea.appendChild(ImageStudio());
    } else if (page === 'video') {
      const { VideoStudio } = await import('./components/VideoStudio.js');
      contentArea.appendChild(VideoStudio());
    } else if (page === 'cinema') {
      const { CinemaStudio } = await import('./components/CinemaStudio.js');
      contentArea.appendChild(CinemaStudio());
    } else if (page === 'character') {
      const { CharacterStudio } = await import('./components/CharacterStudio.js');
      contentArea.appendChild(CharacterStudio());
    } else if (page === 'edit') {
      const { EditSuite } = await import('./components/EditSuite.js');
      contentArea.appendChild(EditSuite(pendingContext || {}));
      pendingContext = null;
    } else if (page === 'vibemotion') {
      const { VibeMotion } = await import('./components/VibeMotion.js');
      contentArea.appendChild(VibeMotion());
    } else if (page === 'popcorn') {
      const { PopcornStudio } = await import('./components/PopcornStudio.js');
      contentArea.appendChild(PopcornStudio());
    } else if (page === 'explore') {
      const { Explore } = await import('./components/Explore.js');
      contentArea.appendChild(Explore());
    } else if (page === 'remix') {
      const { Remix } = await import('./components/Remix.js');
      contentArea.appendChild(Remix());
    } else if (page === 'upscale') {
      const { Upscale } = await import('./components/Upscale.js');
      contentArea.appendChild(Upscale());
    } else if (page === 'background') {
      const { Background } = await import('./components/Background.js');
      contentArea.appendChild(Background());
    } else if (page === 'style-mix') {
      const { StyleMix } = await import('./components/StyleMix.js');
      contentArea.appendChild(StyleMix());
    } else if (page === 'look-transfer') {
      const { LookTransfer } = await import('./components/LookTransfer.js');
      contentArea.appendChild(LookTransfer());
    } else if (page === 'outpaint') {
      const { Outpaint } = await import('./components/Outpaint.js');
      contentArea.appendChild(Outpaint());
    } else if (page === 'object-edit') {
      const { ObjectEdit } = await import('./components/ObjectEdit.js');
      contentArea.appendChild(ObjectEdit());
    } else if (page === 'prompt-edits') {
      const { PromptEdits } = await import('./components/PromptEdits.js');
      contentArea.appendChild(PromptEdits());
    } else if (page === 'reimagine') {
      const { Reimagine } = await import('./components/Reimagine.js');
      contentArea.appendChild(Reimagine());
    } else if (page === 'batch-look') {
      const { BatchLook } = await import('./components/BatchLook.js');
      contentArea.appendChild(BatchLook());
    } else if (page === 'portrait-enhancer') {
      const { PortraitEnhancer } = await import('./components/PortraitEnhancer.js');
      contentArea.appendChild(PortraitEnhancer());
    } else {
      // Coming Soon / Fallback pages
      const titles = {
        'contests': 'Contests',
        'ai-influencer': 'AI Influencer',
        'apps': 'Apps',
        'assist': 'Assist',
        'community': 'Community',
        'remix': 'Remix',
        'upscale': 'Upscale',
        'background': 'Background',
        'style-mix': 'Style Mix'
      };
      const title = titles[page] || 'Coming Soon';
      contentArea.appendChild(ComingSoon(title));
    }

    // Notify header to update active state
    window.dispatchEvent(new CustomEvent('route:changed', { detail: { page } }));
  } catch (err) {
    console.error(`Failed to navigate to ${page}:`, err);
    contentArea.innerHTML = `<div class="flex-1 flex items-center justify-center text-red-500 font-bold p-10 text-center">Failed to load ${page}. Please try again later.</div>`;
  } finally {
    // Artificial delay for smooth transition if it loads too fast
    setTimeout(() => setLoading(false), 300);
  }
}

app.innerHTML = '';
// Pass navigate to Header so links work
app.appendChild(Header(navigate));

contentArea = document.createElement('main');
contentArea.id = 'content-area';
contentArea.className = 'flex-1 relative w-full overflow-hidden flex flex-col bg-app-bg';
app.appendChild(contentArea);

// Initial Route
navigate('image');

// Event Listener for Navigation (legacy custom events)
window.addEventListener('navigate', (e) => {
  if (e.detail.page === 'settings') {
    import('./components/SettingsModal.js').then(({ SettingsModal }) => {
      document.body.appendChild(SettingsModal());
    });
  } else {
    navigate(e.detail.page, e.detail.context);
  }
});

// EventBus-based cross-studio navigation
eventBus.on('studio:navigate', ({ page, ...context }) => {
  navigate(page, context);
});
