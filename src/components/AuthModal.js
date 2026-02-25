export function AuthModal(onSuccess) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6';

    const modal = document.createElement('div');
    modal.className = 'w-full max-w-md bg-panel-bg border border-white/10 rounded-3xl p-8 shadow-3xl animate-fade-in-up relative';

    modal.innerHTML = `
        <button id="close-auth-modal" class="absolute right-4 top-4 text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60" aria-label="Close" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="flex flex-col items-center text-center mb-8">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-glow mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" stroke-width="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25"/>
                </svg>
            </div>
            <h2 class="text-2xl font-black text-white uppercase tracking-wider mb-2">Muapi API Key Required</h2>
            <p class="text-secondary text-sm">Please provide your Muapi.ai API key to start creating high-aesthetic images.</p>
        </div>

        <div class="space-y-6">
            <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Your API Key</label>
                <div class="relative group">
                    <input 
                        type="password" 
                        id="muapi-key-input"
                        placeholder="sk-..." 
                        class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 pr-12 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                        autofocus
                    >
                    <button id="toggle-key-visibility" class="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors" title="Toggle visibility">
                        <svg id="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <svg id="eye-off-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hidden">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </button>
                </div>
                <p class="text-[11px] text-muted flex items-center gap-2 pl-1"><span class="inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[10px]">⌘V</span> Paste from clipboard or press Enter to submit</p>
            </div>

            <div class="flex flex-col gap-3">
                <button id="save-key-btn" class="w-full bg-primary text-black font-black py-4 rounded-2xl hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all" title="Save and Initialize">
                    Initialize Studio
                </button>
                <a href="https://muapi.ai" target="_blank" class="text-center text-[11px] font-bold text-muted hover:text-white transition-colors py-2 uppercase tracking-tighter">
                    Get an API Key at Muapi.ai →
                </a>
            </div>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector('#muapi-key-input');
    const btn = modal.querySelector('#save-key-btn');
    const toggleBtn = modal.querySelector('#toggle-key-visibility');
    const eyeIcon = modal.querySelector('#eye-icon');
    const eyeOffIcon = modal.querySelector('#eye-off-icon');
    const closeBtn = modal.querySelector('#close-auth-modal');

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            dismiss();
        }
    };

    const cleanup = () => document.removeEventListener('keydown', onKeyDown);
    const dismiss = () => {
        cleanup();
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    closeBtn.onclick = dismiss;
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) dismiss();
    });

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            dismiss();
        }
    };
    document.addEventListener('keydown', onKeyDown);

    toggleBtn.onclick = () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        eyeIcon.classList.toggle('hidden', !isPassword);
        eyeOffIcon.classList.toggle('hidden', isPassword);
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btn.click();
        }
    };

    btn.onclick = () => {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem('muapi_key', key);
            dismiss();
            if (onSuccess) onSuccess();
        } else {
            input.classList.add('border-red-500/50');
            setTimeout(() => input.classList.remove('border-red-500/50'), 2000);
        }
    };

    // Focus the input on open for quick paste
    requestAnimationFrame(() => {
        input.focus();
        input.select();
    });

    return overlay;
}
