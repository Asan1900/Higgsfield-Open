import './style.css';
import { Header } from './components/Header.js';
import { ImageStudio } from './components/ImageStudio.js';
import { ComingSoon } from './components/ComingSoon.js';
import { eventBus } from './lib/EventBus.js';

const app = document.querySelector('#app');
let contentArea;
let pendingContext = null; // Context data for cross-studio navigation

// Router
function navigate(page, context) {
  if (!contentArea) return;
  contentArea.innerHTML = '';
  pendingContext = context || null;

  if (page === 'image') {
    contentArea.appendChild(ImageStudio());
  } else if (page === 'video') {
    import('./components/VideoStudio.js').then(({ VideoStudio }) => {
      contentArea.appendChild(VideoStudio());
    });
  } else if (page === 'cinema') {
    import('./components/CinemaStudio.js').then(({ CinemaStudio }) => {
      contentArea.appendChild(CinemaStudio());
    });
  } else if (page === 'character') {
    import('./components/CharacterStudio.js').then(({ CharacterStudio }) => {
      contentArea.appendChild(CharacterStudio());
    });
  } else if (page === 'edit') {
    import('./components/EditSuite.js').then(({ EditSuite }) => {
      contentArea.appendChild(EditSuite(pendingContext || {}));
      pendingContext = null;
    });
  } else if (page === 'vibemotion') {
    import('./components/VibeMotion.js').then(({ VibeMotion }) => {
      contentArea.appendChild(VibeMotion());
    });
  } else {
    // Coming Soon / Fallback pages
    const titles = {
      'explore': 'Explore',
      'contests': 'Contests',
      'ai-influencer': 'AI Influencer',
      'apps': 'Apps',
      'assist': 'Assist',
      'community': 'Community'
    };
    const title = titles[page] || 'Coming Soon';
    contentArea.appendChild(ComingSoon(title));
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
