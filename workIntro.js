const path = require('path');
const fs = require('fs');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cleanTexturePath(p) {
  if (!p || typeof p !== 'string') return '';
  let clean = p.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('//')) {
    // Clean old aggressive w_800 degradation if present
    clean = clean.replace('/upload/w_800,c_scale,q_auto/', '/upload/');
    // Automatically convert Cloudinary images to ultra-fast native WebP (f_webp,q_auto)
    // and protect GPUs with safe limit (c_limit,w_2560) without downscaling smaller images
    if (clean.includes('res.cloudinary.com') && clean.includes('/upload/')) {
      if (!clean.includes('/upload/c_limit') && !clean.includes('/upload/w_') && !clean.includes('/upload/f_')) {
        clean = clean.replace('/upload/', '/upload/c_limit,w_2560,f_webp,q_auto/');
      }
    }
    return clean;
  }
  clean = clean.split('?')[0].trim();
  clean = clean.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  return clean;
}

function getAllProjectImages(projects) {
  const candidates = new Set();
  projects.forEach(p => {
    if (p.home_tex) {
      const c = cleanTexturePath(p.home_tex);
      if (c) candidates.add(c);
    }
    if (p.hero_tex) {
      const c = cleanTexturePath(p.hero_tex);
      if (c) candidates.add(c);
    }
    const secs = Array.isArray(p.sections)
      ? p.sections
      : (typeof p.sections === 'string' ? JSON.parse(p.sections || '[]') : []);
    secs.forEach(s => {
      if (s.cols && Array.isArray(s.cols)) {
        s.cols.forEach(cItem => {
          const src = cItem.src;
          if (src) {
            const c = cleanTexturePath(src);
            if (c) candidates.add(c);
          }
        });
      }
      const src = s.large ? s.large.src : (typeof s === 'string' ? s : '');
      if (src) {
        const c = cleanTexturePath(src);
        if (c) candidates.add(c);
      }
    });
  });

  return Array.from(candidates);
}

function getIntroThumbnailPath(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace(/\/upload\/(?:(?![vV]\d+\/)[^/]+\/)?/, '/upload/w_350,c_scale,f_webp,q_auto/');
  }
  return url;
}

function getRandomIntroTextures(projects, count = 25) {
  const allImages = getAllProjectImages(projects);
  if (allImages.length === 0) {
    return Array.from({ length: count }, () => 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
  }

  // Shuffle all images with Fisher-Yates
  const shuffled = [...allImages];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const result = [];
  while (result.length < count) {
    for (const img of shuffled) {
      result.push(getIntroThumbnailPath(img));
      if (result.length === count) break;
    }
  }

  return result.slice(0, count);
}

function getRandomizedProjects(projects) {
  if (!Array.isArray(projects) || projects.length <= 1) return projects;
  const shuffled = [...projects];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderDesktopHomeHtml(projects) {
  const homeTitlesHtml = projects.map(p => {
    const secs = Array.isArray(p.sections)
      ? p.sections
      : (typeof p.sections === 'string' ? JSON.parse(p.sections || '[]') : []);
    const count = secs.length;
    return `<li><div class="h-title"><a class="h-title-a" href="/${p.slug}" aria-label="View project ${escapeHtml(p.title)}"><span class="h-title-text">${escapeHtml(p.title)}</span><span class="h-title-bar"><span class="h-title-bar-fill"></span></span></a></div><div class="h-title-no exp"><div>${count}</div></div></li>`;
  }).join('');

  const pgnDivs = projects.map((_, i) => `<div>${i + 1}</div>`).join('');
  const total = projects.length;

  return `<div class="page"><ul id="h-title-w">${homeTitlesHtml}</ul><div id="h-cross"><div><svg viewBox="0 0 22 22"><polygon class="st0" points="11,11.75 11,11.75 11,10.249 11,10.249 11,11"/><polygon class="st0" points="11.75,11 11.75,11 10.249,11 10.249,11 11,10.999"/></svg></div><div><svg viewBox="0 0 22 22"><polygon class="st0" points="11,11.75 11,11.75 11,10.249 11,10.249 11,11"/><polygon class="st0" points="11.75,11 11.75,11 10.249,11 10.249,11 11,10.999"/></svg></div><div><svg viewBox="0 0 22 22"><polygon class="st0" points="11,11.75 11,11.75 11,10.249 11,10.249 11,11"/><polygon class="st0" points="11.75,11 11.75,11 10.249,11 10.249,11 11,10.999"/></svg></div></div><div id="h-pgn"><div id="h-pgn-left-w"><div id="h-pgn-left">${pgnDivs}</div></div><div id="h-pgn-middle">—</div><div id="h-pgn-right">${total}</div></div></div>`;
}

function renderMobileHomeHtml(projects) {
  const mobileItemsHtml = projects.map((p, idx) => {
    let coverSrc = p.home_tex;
    if (!coverSrc) {
      const s0 = p.sections && p.sections[0] ? (p.sections[0].large ? p.sections[0].large.src : p.sections[0].src || (p.sections[0].cols ? p.sections[0].cols[0].src : '')) : '';
      coverSrc = s0 || '';
    } else if (!coverSrc.startsWith('http://') && !coverSrc.startsWith('https://') && !coverSrc.startsWith('//')) {
      if (!coverSrc.includes('.')) {
        coverSrc = coverSrc + '.jpg?1';
      }
    }
    const lzAttr = idx === 0 ? `src="${coverSrc}"` : `class="_lz" src="data:," data-src="${coverSrc}"`;
    return `<li class="h-list"><a href="/${p.slug}"><div class="h-list-img"><img ${lzAttr} alt="${escapeHtml(p.title)}" width="764" height="1368"></div><h2 class="h-list-title">${escapeHtml(p.title)}</h2><div class="h-list-discover">Discover</div></a></li>`;
  }).join('');

  return `<div id="h" class="page"><header><nav class="nav wrap"><a href="/" style="display:inline-flex;align-items:center;gap:10px;"><img src="/static/fav/fav.svg?v=2" alt="WN" style="height:22px;width:auto;vertical-align:middle;"><h1>Profile 2026</h1></a><a href="/about">About</a></nav></header><section class="wrap"><ul>${mobileItemsHtml}</ul></section><footer class="footer wrap"><div class="footer-title">Profile 2026<br>Portfolio</div><ul class="footer-list"><li><a class="footer-list-cta" href="/about"><div>About</div><div><svg viewBox="0 0 12 56"><polygon points="7.944,31.752 11.7,28.003 11.697,28 11.7,27.997 7.771,24.074 7.129,24.716 9.941,27.528 0.3,27.528 0.3,28.436 9.977,28.436 7.129,31.284 7.597,31.752 7.771,31.926 "/></svg></div></a></li><li><div class="footer-list-touch footer-list-cta"><div>Get In Touch</div><div><svg viewBox="0 0 12 56"><rect x="0.3" y="27.561" width="11.4" height="0.878"/><rect class="footer-list-touch-cross-vertical" x="5.561" y="22.3" width="0.878" height="11.4"/></svg></div></div></li></ul><ul class="footer-contact"><li><a href="mailto:contact@example.com">Email</a></li><li><a target="_blank" rel="noopener" href="https://www.instagram.com/">Instagram</a></li><li><a target="_blank" rel="noopener" href="https://twitter.com/Profile2026">Twitter</a></li><li><a target="_blank" rel="noopener" href="https://www.linkedin.com/">Linkedin</a></li></ul><div class="footer-top"><svg viewBox="0 0 46 54"><path d="M23,53.034c-12.188,0-22.104-9.916-22.104-22.104V23.07C0.896,10.882,10.812,0.966,23,0.966c12.188,0,22.104,9.916,22.104,22.104v7.859C45.104,43.118,35.188,53.034,23,53.034z M23,1.949c-11.646,0-21.122,9.475-21.122,21.122v7.859c0,11.646,9.475,21.122,21.122,21.122s21.122-9.476,21.122-21.122V23.07C44.122,11.424,34.646,1.949,23,1.949z"/><polygon points="26.752,25.056 23.003,21.3 23,21.303 22.997,21.3 19.074,25.229 19.716,25.871 22.528,23.059 22.528,32.7 23.436,32.7 23.436,23.023 26.284,25.871 26.752,25.403 26.926,25.229"/></svg></div></footer></div>`;
}

module.exports = {
  cleanTexturePath,
  getIntroThumbnailPath,
  getAllProjectImages,
  getRandomIntroTextures,
  getRandomizedProjects,
  renderDesktopHomeHtml,
  renderMobileHomeHtml
};
