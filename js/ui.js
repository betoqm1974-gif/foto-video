(function(){
 const root = document.documentElement;
 const body = document.body;

 const get = (k, d=null) => {
 try { const v = localStorage.getItem(k); return v===null? d : v; } catch(e){ return d; }
 };
 const set = (k, v) => { try { localStorage.setItem(k, v); } catch(e){} };

 function setActiveMenu(){
  const nav = document.getElementById('menuPrincipal');
  if(!nav) return;
  const links = nav.querySelectorAll('a[href]');
  // Determine current file (supports local file:// and GitHub Pages)
  let file = (location.pathname.split('/').pop() || 'index.html');
  if(file === '') file = 'index.html';
  // Normalise: some servers omit index.html
  if(file === '/') file = 'index.html';
  links.forEach(a => {
    const href = a.getAttribute('href');
    if(!href) return;
    const isCurrent = href === file || (file === '' && href === 'index.html');
    if(isCurrent){
      a.setAttribute('aria-current','page');
    }else{
      a.removeAttribute('aria-current');
    }
  });
 }


 function applyFontScale(scale){
 root.style.fontSize = scale + '%';
 set('fontScale', String(scale));
 }

 function toggleContrast(btn){
  const on = document.documentElement.classList.toggle('hc');
  document.body.classList.toggle('hc', on);
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  set('highContrast', on ? '1' : '0');
}

 function init(){
  // Tema claro/escuro
  const themeBtn = document.getElementById("themeBtn");
  const applyTheme = (t) => {
    document.body.classList.toggle("theme-light", t === "light");
    document.body.classList.toggle("theme-dark", t === "dark");
    if(themeBtn) themeBtn.setAttribute("aria-pressed", t === "light" ? "true" : "false");
  };
  const savedTheme = localStorage.getItem("theme");
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const initialTheme = savedTheme ? savedTheme : (prefersLight ? "light" : "dark");
  applyTheme(initialTheme);
  if(themeBtn){
    themeBtn.addEventListener("click", () => {
      const isLight = document.body.classList.contains("theme-light");
      const next = isLight ? "dark" : "light";
      localStorage.setItem("theme", next);
      applyTheme(next);
    });
  }

 setActiveMenu();

 // Mobile menu
 const menuBtn = document.getElementById('menuBtn');
 const navPanel = document.getElementById('navPanel');
 if(menuBtn && navPanel){
  const closeMenu = () => { body.classList.remove('nav-open'); menuBtn.setAttribute('aria-expanded','false'); menuBtn.setAttribute('aria-label','Abrir menu'); };
  const openMenu = () => { body.classList.add('nav-open'); menuBtn.setAttribute('aria-expanded','true'); menuBtn.setAttribute('aria-label','Fechar menu'); };
  menuBtn.addEventListener('click', () => {
    const isOpen = body.classList.contains('nav-open');
    (isOpen ? closeMenu : openMenu)();
  });
  navPanel.querySelectorAll('a[href]').forEach(a => a.addEventListener('click', closeMenu));
 }

 // Restore settings
 const scale = parseInt(get('fontScale', '100'), 10);
 applyFontScale(isFinite(scale) ? Math.min(140, Math.max(90, scale)) : 100);

 const hc = get('highContrast','0') === '1';
 if(hc){ document.documentElement.classList.add('hc'); body.classList.add('hc'); } else { document.documentElement.classList.remove('hc'); body.classList.remove('hc'); }

 const btnAplus = document.getElementById('aPlus');
 const btnAminus = document.getElementById('aMinus');
 const btnHC = document.getElementById('hcBtn');

 if(btnHC){
 btnHC.setAttribute('aria-pressed', hc ? 'true' : 'false');
 btnHC.addEventListener('click', () => toggleContrast(btnHC));
 }
 if(btnAplus){
 btnAplus.addEventListener('click', () => {
 const current = parseInt(get('fontScale','100'),10) || 100;
 applyFontScale(Math.min(140, current + 5));
 });
 }
 if(btnAminus){
 btnAminus.addEventListener('click', () => {
 const current = parseInt(get('fontScale','100'),10) || 100;
 applyFontScale(Math.max(90, current - 5));
 });
 }
 }




// Popup (lightbox): galeria e foto do index (delegado)
(function(){
  const getLb = () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    if(!lightbox || !lightboxImg) return null;
    return { lightbox, lightboxImg };
  };

  const resetZoom = () => {
    const lb = document.getElementById('lightbox');
    if(lb) lb.classList.remove('is-zoomed');
  };

  const openLb = (src, alt) => {
    const lb = getLb();
    if(!lb) return;
    lb.lightboxImg.src = src;
    lb.lightboxImg.alt = alt || 'Imagem';
    lb.lightbox.classList.add('is-open');
    lb.lightbox.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    resetZoom();
    const btn = lb.lightbox.querySelector('.lightbox__close');
    if(btn) btn.focus();
  };

  const closeLb = () => {
    const lb = getLb();
    if(!lb) return;
    lb.lightbox.classList.remove('is-open');
    lb.lightbox.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    lb.lightboxImg.src = '';
    resetZoom();
  };

  const toggleZoom = () => {
    const lb = document.getElementById('lightbox');
    if(!lb) return;
    lb.classList.toggle('is-zoomed');
  };

  document.addEventListener('click', (e) => {
    // 1) abrir lightbox a partir de links com data-full
    const a = e.target && e.target.closest ? e.target.closest('a.galleryItem[data-full], a.indexPhotoLink[data-full]') : null;
    if(a){
      e.preventDefault();
      const src = a.getAttribute('data-full');
      const img = a.querySelector('img');
      openLb(src, img ? img.alt : '');
      return;
    }

    // 2) alternar zoom/fullscreen ao clicar na imagem
    if(e.target && e.target.id === 'lightboxImg'){
      e.preventDefault();
      toggleZoom();
      return;
    }

    // 3) fechar ao clicar no backdrop ou no X
    const lb = document.getElementById('lightbox');
    if(lb && lb.classList.contains('is-open')){
      const closeTarget = e.target && e.target.getAttribute ? e.target.getAttribute('data-close') : null;
      if(closeTarget === '1'){
        e.preventDefault();
        closeLb();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if(!lb || !lb.classList.contains('is-open')) return;
    if(e.key === 'Escape'){
      e.preventDefault();
      closeLb();
    }
  });
})();


document.addEventListener('DOMContentLoaded', init);
})();
