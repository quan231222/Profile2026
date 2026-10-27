function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDesktopProjectHtml(project, totalProjects = 8) {
  const h1Lines = Array.isArray(project.h1_lines)
    ? project.h1_lines
    : (typeof project.h1_lines === 'string' ? JSON.parse(project.h1_lines || '[]') : []);

  const h1Html = h1Lines
    .map(line => `<span><span class="w-hero-txt-h1">${line}</span></span>`)
    .join('');

  const sections = Array.isArray(project.sections)
    ? project.sections
    : (typeof project.sections === 'string' ? JSON.parse(project.sections || '[]') : []);

  // Large Section Items
  const largeItemsHtml = sections.map((sec, idx) => {
    const l = sec.large || sec;
    const defaultClass = idx === 0 ? '' : ' class="w-s-mts"';
    const classAttr = l.class ? ` class="${escapeHtml(l.class)}"` : defaultClass;
    const aspect = l.aspect || '1800/1010';
    const bg = l.bg || '#141414';
    const src = l.src || (typeof sec === 'string' ? sec : '');
    const alt = escapeHtml(l.alt || project.title || '');
    return `<div ${classAttr} style="aspect-ratio: ${aspect};"><div style="background-color: ${bg};"></div><img class="_lz" src="data:," data-src="${src}" alt="${alt}" width="1800" height="1010"></div>`;
  }).join('');

  // Small Preview Items (Carousel thumbnails on right)
  const smallItemsHtml = sections.map((sec, idx) => {
    const s = sec.small || sec;
    const extraClass = s.class ? ` ${s.class}` : (idx === 0 ? '' : ' w-preview-mts');
    const aspect = s.aspect || '120/67';
    const bg = s.bg || '#141414';
    const src = s.src || (sec.large ? sec.large.src : (typeof sec === 'string' ? sec : ''));
    return `<div class="w-preview${extraClass}" style="aspect-ratio: ${aspect};"><div style="background-color: ${bg};"></div><img class="_lz" src="data:," data-src="${src}" alt="" width="120" height="67"></div>`;
  }).join('');

  const nextSlug = project.next_slug ? project.next_slug.replace(/^\/+/, '') : 'gucci';
  const nextTitle = project.next_title || 'Next Project';
  const orderIdx = project.order_index || 1;

  return `<div class="page">` +
    `<header class="w-hero">` +
      `<div class="w-hero-pgn">` +
        `<div class="w-hero-pgn-left">${orderIdx}</div>` +
        `<div class="w-hero-pgn-middle">—</div>` +
        `<div class="w-hero-pgn-right">${totalProjects}</div>` +
      `</div>` +
      `<div class="w-hero-txt">` +
        `<h1 class="w-hero-txt-h1-w">${h1Html}</h1>` +
        `<div class="w-hero-txt-role">` +
          `<div class="w-hero-txt-role-title"><div>${escapeHtml(project.role)}</div></div>` +
          `<p class="w-hero-txt-role-p">${escapeHtml(project.description)}</p>` +
        `</div>` +
        `<div class="w-hero-txt-team-w">` +
          `<div><div class="w-hero-txt-team">${escapeHtml(project.team_prefix || 'Done with')}</div></div>` +
          `<div><div class="w-hero-txt-team">${escapeHtml(project.team_name || '')}</div></div>` +
        `</div>` +
        `<div class="w-hero-txt-scroll w-hero-scroll"><div>Scroll down</div></div>` +
        `<div class="w-hero-txt-icon w-hero-scroll">` +
          `<div class="w-hero-txt-icon-arrow"><svg viewBox="0 0 47 55"><path d="M27,29.4l-0.2-0.2l-0.3-0.3l-0.2-0.2l-0.2,0.2l0.2,0.2l0,0l-0.2-0.2l-2.7,2.7V22v-0.2h-0.2h-0.4h-0.2V22v9.6l-2.7-2.7l-0.2,0.2h0l0.2-0.2l-0.2-0.2l-0.2,0.2l-0.3,0.3L19,29.4l0.2,0.2l3.2,3.2l0,0l0.2,0.2l0.2-0.2l0,0l-0.2,0.2l0.3,0.3L23,33h0l0,0l-0.1,0.1l0.2,0.2l0,0l0,0l0.2-0.2L23,33l0,0l0,0l0.2,0.2l0.3-0.3l-0.2-0.2l0,0l0,0l0.1,0.1l0.2-0.2l0,0l3.2-3.2L27,29.4z M23.3,32.7L23.3,32.7L23.3,32.7L23.3,32.7L23.3,32.7z"/></svg></div>` +
          `<div class="w-hero-txt-icon-border"><svg viewBox="0 0 47 55"><path class="w-hero-txt-icon-border-path" d="M23.5,1.5L23.5,1.5c12.2,0,22,9.8,22,22v8c0,12.2-9.8,22-22,22l0,0c-12.2,0-22-9.8-22-22v-8C1.5,11.3,11.3,1.5,23.5,1.5z"/></svg></div>` +
        `</div>` +
      `</div>` +
    `</header>` +
    `<div class="w-s">${largeItemsHtml}</div>` +
    `<footer class="w-footer">` +
      `<a class="w-footer-a" href="/${nextSlug}"></a>` +
      `<div class="w-footer-link">` +
        `<div class="w-footer-exp exp"><div>0</div></div>` +
        `<div class="w-footer-link-title"><div>${escapeHtml(nextTitle)}</div></div>` +
        `<div class="w-footer-link-tagline"><div>Next Project</div></div>` +
      `</div>` +
    `</footer>` +
    `<div class="w-progress _ns"></div>` +
    `<div class="w-back _ns"><a href="/">Back</a></div>` +
    `<div class="w-preview-w _ns">${smallItemsHtml}</div>` +
    `<div class="w-preview-area _ns"></div>` +
  `</div>`;
}

function renderMobileProjectHtml(project) {
  const h1Lines = Array.isArray(project.h1_lines)
    ? project.h1_lines
    : (typeof project.h1_lines === 'string' ? JSON.parse(project.h1_lines || '[]') : []);

  const h1Html = h1Lines
    .map(line => `<span>${line}</span>`)
    .join('');

  const sections = Array.isArray(project.sections)
    ? project.sections
    : (typeof project.sections === 'string' ? JSON.parse(project.sections || '[]') : []);

  const itemsHtml = sections.map((sec, idx) => {
    const l = sec.large || sec;
    const marginClass = idx === 0 ? '' : ' a-mtm';
    const aspect = l.aspect || '1800/1010';
    const src = l.src || (typeof sec === 'string' ? sec : '');
    const alt = escapeHtml(l.alt || project.title || '');
    return `<div class="${marginClass}" style="aspect-ratio: ${aspect};"><img class="_lz" src="data:," data-src="${src}" alt="${alt}"></div>`;
  }).join('');

  const nextSlug = project.next_slug ? project.next_slug.replace(/^\/+/, '') : 'gucci';
  const heroImg = `/static/media/m/work/${project.slug}/hero.jpg?1`;

  return `<div class="w page">` +
    `<header class="w-hero" style="background-image: url('${heroImg}');">` +
      `<nav class="nav wrap"><a href="/">Profile 2026</a> <a href="/">Back</a></nav>` +
      `<div class="w-hero-title">` +
        `<h1 class="wrap">${h1Html}</h1>` +
        `<div class="w-hero-title-arrow"><svg viewBox="0 0 46 54"><path d="M23,53.034c-12.188,0-22.104-9.916-22.104-22.104V23.07C0.896,10.882,10.812,0.966,23,0.966c12.188,0,22.104,9.916,22.104,22.104v7.859C45.104,43.118,35.188,53.034,23,53.034z M23,1.949c-11.646,0-21.122,9.475-21.122,21.122v7.859c0,11.646,9.475,21.122,21.122,21.122s21.122-9.476,21.122-21.122V23.07C44.122,11.424,34.646,1.949,23,1.949z"/><polygon points="26.752,25.056 23.003,21.3 23,21.303 22.997,21.3 19.074,25.229 19.716,25.871 22.528,23.059 22.528,32.7 23.436,32.7 23.436,23.023 26.284,25.871 26.752,25.403 26.926,25.229"/></svg></div>` +
      `</div>` +
    `</header>` +
    `<div class="w-intro wrap">` +
      `<h2>${escapeHtml(project.role)}</h2>` +
      `<p>${escapeHtml(project.description)}</p>` +
      `<ul><li>${escapeHtml(project.team_prefix || 'Done with')}</li><li>${escapeHtml(project.team_name || '')}</li></ul>` +
    `</div>` +
    `<div class="w-list wrap">${itemsHtml}</div>` +
    `<footer class="footer wrap">` +
      `<div class="footer-title">Next Project</div>` +
      `<ul class="footer-list">` +
        `<li><a class="footer-list-cta" href="/${nextSlug}"><div>${escapeHtml(project.next_title || 'Next')}</div><div><svg viewBox="0 0 12 56"><polygon points="7.944,31.752 11.7,28.003 11.697,28 11.7,27.997 7.771,24.074 7.129,24.716 9.941,27.528 0.3,27.528 0.3,28.436 9.977,28.436 7.129,31.284 7.597,31.752 7.771,31.926 "/></svg></div></a></li>` +
      `</ul>` +
    `</footer>` +
  `</div>`;
}

module.exports = {
  renderDesktopProjectHtml,
  renderMobileProjectHtml
};
