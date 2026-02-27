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
 const on = body.classList.toggle('hc');
 btn.setAttribute('aria-pressed', on ? 'true' : 'false');
 set('highContrast', on ? '1' : '0');
 }

 function init(){
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
 if(hc) body.classList.add('hc');

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

 document.addEventListener('DOMContentLoaded', init);
})();
