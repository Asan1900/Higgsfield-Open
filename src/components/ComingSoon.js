export function ComingSoon(title = 'Page') {
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center h-full w-full bg-app-bg text-white relative overflow-hidden';

    container.innerHTML = `
        <!-- Background Glows -->
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse"></div>
        <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style="animation-delay: 2s"></div>

        <div class="relative z-10 text-center space-y-8 p-12 glass rounded-[2.5rem] border border-white/10 max-w-lg mx-4 animate-fade-in-up">
            <div class="relative inline-block">
                <div class="text-7xl mb-2 animate-bounce drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">🚀</div>
                <div class="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
            </div>
            
            <div class="space-y-3">
                <h1 class="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                    <span class="text-primary">${title}</span>
                    <br>
                    <span class="text-white/20">Coming Soon</span>
                </h1>
                <div class="h-1 w-20 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full"></div>
            </div>

            <p class="text-secondary text-sm md:text-base font-medium leading-relaxed max-w-xs mx-auto opacity-80">
                We're currently engineering this module for maximum performance and artistic precision.
            </p>
            
            <div class="pt-4 flex flex-col items-center gap-4">
                <button class="group relative px-8 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-primary/20" onclick="history.back()">
                    <span class="relative z-10">Return to Studio</span>
                    <div class="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                </button>
                <p class="text-[10px] text-muted font-bold tracking-[0.2em] uppercase">Open Higgsfield AI · v0.1</p>
            </div>
        </div>

        <!-- Decorative Grid -->
        <div class="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_0)] bg-[length:40px_40px] pointer-events-none"></div>
    `;

    return container;
}
