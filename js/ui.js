(function(){
 const root = document.documentElement;
 const body = document.body;

 // Desativar botão direito do rato em todas as páginas
 // (nota: não é uma proteção absoluta, mas evita o menu contextual comum)
 document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
 }, { capture: true });

 // Desativar copiar (Ctrl+C / Cmd+C) e impedir sele��o de texto (refor�ado por CSS)
 document.addEventListener('copy', (e) => {
  e.preventDefault();
 }, { capture: true });

 document.addEventListener('keydown', (e) => {
  const key = (e.key || '').toLowerCase();
  const isCopy = (key === 'c') && (e.ctrlKey || e.metaKey);
  if(isCopy){
    e.preventDefault();
  }
 }, { capture: true });


 // Evitar arrastar imagens (reduz "drag to save")
 document.addEventListener('dragstart', (e) => {
  const t = e.target;
  if(t && t.tagName && t.tagName.toLowerCase() === 'img'){
    e.preventDefault();
  }
 }, { capture: true });

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

  // Aplicar marca de água também nas miniaturas da Galeria (para reduzir a possibilidade de "guardar imagem" no mobile).
  // As miniaturas passam a ser dataURL já com marca de água aplicada.
  if(window.__applyGalleryThumbWatermarks){
    window.__applyGalleryThumbWatermarks();
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

  const isPng = (url) => (url || '').toLowerCase().split('?')[0].endsWith('.png');

  const splitUrl = (src) => {
    const out = { base: src || '', query: '', hash: '' };
    if(!src) return out;
    let s = src;
    const hashIdx = s.indexOf('#');
    if(hashIdx >= 0){ out.hash = s.slice(hashIdx); s = s.slice(0, hashIdx); }
    const qIdx = s.indexOf('?');
    if(qIdx >= 0){ out.query = s.slice(qIdx); s = s.slice(0, qIdx); }
    out.base = s;
    return out;
  };

  const buildCandidates = (src) => {
    const parts = splitUrl(src);
    const base = parts.base;
    const query = parts.query + parts.hash;
    const lastSlash = base.lastIndexOf('/');
    const dir = lastSlash >= 0 ? base.slice(0, lastSlash+1) : '';
    const file = lastSlash >= 0 ? base.slice(lastSlash+1) : base;
    const dot = file.lastIndexOf('.');
    const name = dot >= 0 ? file.slice(0, dot) : file;
    const ext = dot >= 0 ? file.slice(dot) : '';

    const exts = [];
    if(ext) exts.push(ext);
    ['.jpg','.JPG','.jpeg','.JPEG','.png','.PNG','.webp','.WEBP'].forEach(e => { if(!exts.includes(e)) exts.push(e); });

    // Nomes: original, sem _ inicial, e variações de caixa (útil em servers case-sensitive)
    const names = [];
    const pushName = (nm) => {
      if(!nm) return;
      if(!names.includes(nm)) names.push(nm);
      const lower = nm.toLowerCase();
      const upper = nm.toUpperCase();
      if(!names.includes(lower)) names.push(lower);
      if(!names.includes(upper)) names.push(upper);
    };
    pushName(name);
    if(name.startsWith('_')) pushName(name.slice(1));

    const out = [src];
    names.forEach(nm => {
      exts.forEach(ex => {
        const cand = dir + nm + ex + query;
        if(!out.includes(cand)) out.push(cand);
      });
    });
    return out;
  };

  const loadImgAny = async (src) => {
    const cands = buildCandidates(src);
    let lastErr = null;
    for(const cand of cands){
      try{
        // eslint-disable-next-line no-await-in-loop
        const im = await loadImg(cand);
        return { im, usedSrc: cand };
      }catch(e){
        lastErr = e;
      }
    }
    throw lastErr || new Error('Falha ao carregar imagem.');
  };

  const loadImg = (src) => new Promise((resolve, reject) => {
    const im = new Image();
    // Tenta evitar problemas de canvas tainted quando servido por HTTP(S)
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });

  const buildWatermarkedDataURL = async (photoSrc) => {
    const lb = document.getElementById('lightbox');
    const wmEl = lb ? lb.querySelector('.lightbox__wm') : null;
    const wmSrc = wmEl ? wmEl.getAttribute('src') : null;
    if(!wmSrc) return photoSrc;

    const [{ im: photo, usedSrc }, { im: wm }] = await Promise.all([loadImgAny(photoSrc), loadImgAny(wmSrc)]);
    // Nota: usedSrc pode ter sido ajustado (extensão/maiúsculas) para compatibilidade em servidores case-sensitive.

    const canvas = document.createElement('canvas');
    canvas.width = photo.naturalWidth || photo.width;
    canvas.height = photo.naturalHeight || photo.height;
    const ctx = canvas.getContext('2d');
    if(!ctx) return photoSrc;

    // Foto
    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

    // Marca de água ao centro, mais pequena e semi-transparente
    const scale = 0.28; // ~28% da largura
    const wmW = Math.round(canvas.width * scale);
    const wmH = Math.round((wmW / (wm.naturalWidth || wm.width)) * (wm.naturalHeight || wm.height));
    const x = Math.round((canvas.width - wmW) / 2);
    const y = Math.round((canvas.height - wmH) / 2);
    ctx.globalAlpha = 0.35; // menos transparente do que o fix_20, mais do que o início
    ctx.drawImage(wm, x, y, wmW, wmH);
    ctx.globalAlpha = 1;

    // Exportar
    const mime = isPng(usedSrc || photoSrc) ? 'image/png' : 'image/jpeg';
    try{
      return canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : undefined);
    }catch(e){
      return photoSrc;
    }
  };


  const buildWatermarkedThumbDataURL = async (photoSrc) => {
    // Reutiliza a mesma marca de água usada na popup
    const lb = document.getElementById('lightbox');
    const wmEl = lb ? lb.querySelector('.lightbox__wm') : null;
    const wmSrc = (wmEl && wmEl.getAttribute('src')) ? wmEl.getAttribute('src') : 'assets/logo_betoqm_prata.png';

    const [{ im: photo, usedSrc }, { im: wm }] = await Promise.all([loadImgAny(photoSrc), loadImgAny(wmSrc)]);

    // Reduzir tamanho para miniaturas (evita dataURLs demasiado grandes)
    const maxDim = 800;
    const pw = photo.naturalWidth || photo.width;
    const ph = photo.naturalHeight || photo.height;
    const scaleDown = Math.min(1, maxDim / Math.max(pw, ph));
    const cw = Math.max(1, Math.round(pw * scaleDown));
    const ch = Math.max(1, Math.round(ph * scaleDown));

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if(!ctx) return photoSrc;

    ctx.drawImage(photo, 0, 0, cw, ch);

    const scale = 0.28;
    const wmW = Math.round(cw * scale);
    const wmH = Math.round((wmW / (wm.naturalWidth || wm.width)) * (wm.naturalHeight || wm.height));
    const x = Math.round((cw - wmW) / 2);
    const y = Math.round((ch - wmH) / 2);
    ctx.globalAlpha = 0.35;
    ctx.drawImage(wm, x, y, wmW, wmH);
    ctx.globalAlpha = 1;

    const mime = isPng(usedSrc || photoSrc) ? 'image/png' : 'image/jpeg';
    try{
      return canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.85 : undefined);
    }catch(e){
      return photoSrc;
    }
  };

  // Expor função para a init() aplicar marca de água às miniaturas da Galeria
  window.__applyGalleryThumbWatermarks = () => {
    const imgs = document.querySelectorAll('.galleryGrid img');
    if(!imgs || imgs.length === 0) return;
    imgs.forEach((img) => {
      if(!img || img.dataset.wmThumb === '1') return;
      const src = img.getAttribute('src');
      if(!src) return;
      img.dataset.wmThumb = '1';
      (async () => {
        try{
          const dataUrl = await buildWatermarkedThumbDataURL(src);
          img.src = dataUrl;
        }catch(e){
          // se falhar, mantém a original
        }
      })();
    });
  };


  const openLb = async (src, alt) => {
    const lb = getLb();
    if(!lb) return;

    const wm = lb.lightbox.querySelector('.lightbox__wm');

    // Por defeito, usar uma versão com marca de água (dataURL) na popup.
    // Assim, mesmo que o utilizador abra a imagem da popup numa nova janela,
    // a imagem visível continua a ter a marca de água.
    lb.lightboxImg.alt = alt || 'Imagem';
    lb.lightboxImg.src = '';
    try{
      const watermarked = await buildWatermarkedDataURL(src);
      lb.lightboxImg.src = watermarked;
      // Evita dupla marca de água (overlay + marca aplicada no próprio ficheiro)
      if(wm) wm.style.display = 'none';
    }catch(e){
      lb.lightboxImg.src = src;
      if(wm) wm.style.display = '';
    }
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
    const wm = lb.lightbox.querySelector('.lightbox__wm');
    if(wm) wm.style.display = '';
    resetZoom();
  };

  const toggleZoom = () => {
    const lb = document.getElementById('lightbox');
    if(!lb) return;
    lb.classList.toggle('is-zoomed');
  };


  // Fallback para ficheiros em servidores case-sensitive (GitHub Pages):
  // se uma miniatura falhar, tenta variações comuns (.JPG/.JPEG e remoção de _ inicial).
  const attachImgFallback = (img) => {
    if(!img || img.dataset.fallbackAttached) return;
    img.dataset.fallbackAttached = '1';
    img.addEventListener('error', () => {
      const list = buildCandidates(img.getAttribute('src'));
      const i = parseInt(img.dataset.fallbackIndex || '0', 10);
      const next = list[i+1];
      if(next){
        img.dataset.fallbackIndex = String(i+1);
        img.src = next;
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img[src*="assets/galeria/"]').forEach(attachImgFallback);
  });

  document.addEventListener('click', (e) => {
    // 1) abrir lightbox a partir de links com data-full
    // Links que abrem o lightbox:
    // - .galleryItem (galeria)
    // - .indexPhotoLink (foto do index)
    // - .lightboxLink (outros casos, sem herdar estilos de miniaturas)
    const a = e.target && e.target.closest ? e.target.closest('a.galleryItem[data-full], a.indexPhotoLink[data-full], a.lightboxLink[data-full]') : null;
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
