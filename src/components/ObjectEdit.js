export function ObjectEdit() {
  const container = document.createElement('div');
  container.className = 'flex flex-col items-center justify-center h-full w-full bg-app-bg text-white p-8';
  container.innerHTML = `
    <div class="text-center space-y-4 p-8 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl animate-fade-in">
      <div class="text-5xl mb-2">🧩</div>
      <h1 class="text-3xl font-black tracking-tight">Object-Level Edit & Swap</h1>
      <p class="text-white/60 max-w-lg">Select objects/people to remove, replace with generative fill, or move/resize with realistic inpainting.</p>
    </div>
  `;
  return container;
}
