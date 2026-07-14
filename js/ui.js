/* ==========================================================================
   NFCloud — helpers de UI (ícones SVG, logo, ilustração, toast)
   ========================================================================== */
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => (
  { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]
));

/* Ícones (stroke = currentColor) */
const ICON = {
  dashboard:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>`,
  emitir:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M8 13h8M8 17h6"/></svg>`,
  consultar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>`,
  integracoes:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="m8.6 10.6 6.8-3.2M8.6 13.4l6.8 3.2"/></svg>`,
  relatorios:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="m5 15 4-5 4 3 5-7"/></svg>`,
  clientes:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M17.5 20a5.5 5.5 0 0 0-3-4.9"/></svg>`,
  config:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 3h0a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 9v0a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 2z"/></svg>`,
  ajuda:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7"/><path d="M12 17h.01"/></svg>`,
  sair:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17 5 12l5-5"/><path d="M5 12h11"/></svg>`,
  user:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  save:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3"/><path d="M8 21v-6h8v6"/></svg>`,
  trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>`,
  download:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>`,
};

/* Logo NFCloud (nuvem azul + doc/código de barras + wordmark).
   variant: 'light' (texto branco, p/ sidebar) | 'dark' (texto navy/azul, p/ login) */
function logoSVG(variant = 'dark', scale = 1){
  const nf = variant === 'light' ? '#ffffff' : '#1A2C5B';
  const cl = variant === 'light' ? '#8fa4ee' : '#3627FF';
  const tag = variant === 'light' ? '#c7cfe8' : '#5a5a5a';
  const w = 238 * scale, h = 62 * scale;
  return `
  <svg width="${w}" height="${h}" viewBox="0 0 238 62" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NFCloud">
    <defs>
      <linearGradient id="nfcloud-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8FB6FF"/><stop offset="1" stop-color="#3B63F6"/>
      </linearGradient>
    </defs>
    <g transform="translate(0,6)">
      <path d="M14 34a9 9 0 0 1 1.6-17.8A12 12 0 0 1 39 15.3 8.5 8.5 0 0 1 45.5 34H14z" fill="url(#nfcloud-g)"/>
      <rect x="21" y="18" width="15" height="18" rx="2" fill="#fff"/>
      <g stroke="#3B63F6" stroke-width="1.4">
        <path d="M24 23h9M24 26h9M24 29h6"/>
      </g>
      <g fill="#3B63F6"><rect x="24" y="31.5" width="1.4" height="3"/><rect x="26.5" y="31.5" width="1" height="3"/><rect x="28.5" y="31.5" width="1.6" height="3"/><rect x="31" y="31.5" width="1" height="3"/></g>
    </g>
    <text x="55" y="34" font-family="Inter,sans-serif" font-size="30" font-weight="800" fill="${nf}">NF<tspan fill="${cl}">Cloud</tspan></text>
    <text x="56" y="52" font-family="Inter,sans-serif" font-size="12" font-weight="500" fill="${tag}">Automação de Notas Fiscais</text>
  </svg>`;
}

/* Ilustração do login (torre + monitor), painel lilás */
function loginArt(){
  return `
  <svg width="300" height="260" viewBox="0 0 300 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2fd0ff"/><stop offset="1" stop-color="#0e9bd6"/></linearGradient>
      <linearGradient id="twr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c3cad6"/><stop offset="1" stop-color="#8d97a8"/></linearGradient>
    </defs>
    <!-- torre / servidor -->
    <rect x="40" y="70" width="95" height="150" rx="12" fill="url(#twr)"/>
    <rect x="55" y="88" width="65" height="24" rx="6" fill="#6f7a8c"/>
    <rect x="55" y="120" width="65" height="24" rx="6" fill="#6f7a8c"/>
    <circle cx="66" cy="100" r="4" fill="#2fd0ff"/><circle cx="66" cy="132" r="4" fill="#2fd0ff"/>
    <circle cx="87" cy="195" r="12" fill="#eef2f7"/>
    <!-- monitor -->
    <rect x="120" y="60" width="140" height="110" rx="12" fill="#6f7a8c"/>
    <rect x="130" y="70" width="120" height="90" rx="6" fill="url(#scr)"/>
    <rect x="176" y="170" width="28" height="24" fill="#7c8798"/>
    <rect x="150" y="192" width="80" height="12" rx="6" fill="#6f7a8c"/>
  </svg>`;
}

/* Toast */
let _toastT;
function toast(msg, type = ''){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(_toastT);
  _toastT = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.hidden = true; }, 250);
  }, 2600);
}
