export function Outpaint() {
  const container = document.createElement('div');
  container.className = 'flex flex-col items-center justify-center h-full w-full bg-app-bg text-white p-8';
  container.innerHTML = `
    <div class="text-center space-y-4 p-8 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl animate-fade-in">
      <div class="text-5xl mb-2">🖼️</div>
      <h1 class="text-3xl font-black tracking-tight">Generative Canvas Expansion</h1>
      <p class="text-white/60 max-w-lg">Extend borders (left/right/top/bottom) with smart outpainting that matches scene lighting and textures.</p>
    </div>
  `;
  return container;
}
