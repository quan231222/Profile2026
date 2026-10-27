function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDesktopAboutHtml(data) {
  const { hero, experiences, awards, clients, contacts, credits, visibility = {}, section_titles = {} } = data;

  const showExp = visibility.experience !== false && visibility.experience !== 0;
  const showAwards = visibility.awards !== false && visibility.awards !== 0;
  const showClients = visibility.clients !== false && visibility.clients !== 0;
  const showContacts = visibility.contacts !== false && visibility.contacts !== 0;
  const showCredits = visibility.credits !== false && visibility.credits !== 0;

  const titleExp = section_titles.experience || 'Working Experience';
  const titleAwards = section_titles.awards || 'Awards & Recognition';
  const titleClients = section_titles.clients || 'Brands I Worked With';
  const titleContacts = section_titles.contacts || 'Get In Touch';
  const titleCredits = section_titles.credits || 'Credits';

  // 1. Right Column Sections (#a-r)
  // Experiences
  let expSectionR = '';
  if (showExp) {
    const expItemsR = experiences.map((exp, index) => {
      const marginClass = index === 0 ? 'a-r-mtl' : 'a-r-mtm';
      const roleHtml = `<div class="a-r-tm sfx-y"><div>${escapeHtml(exp.role)}</div></div>`;
      const companyHtml = exp.company ? `<div class="a-r-tm sfx-y"><div>${escapeHtml(exp.company)}</div></div>` : '';
      const periodHtml = `<div class="a-r-ts sfx-y a-r-mts"><div>${escapeHtml(exp.period)}</div></div>`;
      return `<li class="${marginClass}">${roleHtml}${companyHtml}${periodHtml}</li>`;
    }).join('');
    expSectionR = `<section id="a-r-experience" class="a-r-s"><h2 class="sfx-y"><span>${escapeHtml(titleExp)}</span></h2><ul class="a-r-ml">${expItemsR}</ul></section>`;
  }

  // Awards
  let awardSectionR = '';
  if (showAwards) {
    const awardItemsR = awards.map((aw, index) => {
      const marginClass = index === 0 ? 'a-r-mtl' : 'a-r-mtm';
      const titleHtml = `<div class="a-r-tm sfx-y"><div>${escapeHtml(aw.title)}</div></div>`;
      const projHtml = aw.project ? `<div class="a-r-ts sfx-y a-r-mts"><div>${escapeHtml(aw.project)}</div></div>` : '';
      let catHtml = '';
      if (aw.category) {
        const lines = aw.category.split('\n');
        catHtml = lines.map(l => `<div class="a-r-ts sfx-y"><div>${escapeHtml(l.trim())}</div></div>`).join('');
      }
      const yearHtml = aw.year ? `<div class="a-r-ts sfx-y"><div>${escapeHtml(aw.year)}</div></div>` : '';
      return `<li class="${marginClass}">${titleHtml}${projHtml}${catHtml}${yearHtml}</li>`;
    }).join('');
    awardSectionR = `<section id="a-r-recognition" class="a-r-s"><h2 class="sfx-y"><span>${escapeHtml(titleAwards)}</span></h2><ul class="a-r-ml">${awardItemsR}</ul></section>`;
  }

  // Clients
  let clientSectionR = '';
  if (showClients) {
    const clientItemsR = clients.map(c => {
      const name = typeof c === 'string' ? c : c.name;
      return `<li><div class="a-r-ts sfx-y"><div>${escapeHtml(name)}</div></div></li>`;
    }).join('');
    clientSectionR = `<section id="a-r-clients" class="a-r-s"><h2 class="sfx-y"><span>${escapeHtml(titleClients)}</span></h2><ul class="a-r-ml a-r-mtl">${clientItemsR}</ul></section>`;
  }

  // Contacts
  let contactSectionR = '';
  if (showContacts) {
    const contactItemsR = contacts.map(ct => {
      const isExternal = ct.url && !ct.url.startsWith('mailto:');
      const target = isExternal ? ' target="_blank" rel="noopener"' : '';
      return `<li><a class="a-r-ts sfx-y" href="${escapeHtml(ct.url)}"${target}><div>${escapeHtml(ct.label)}</div></a></li>`;
    }).join('');
    contactSectionR = `<section id="a-r-contact" class="a-r-s"><h2 class="sfx-y"><span>${escapeHtml(titleContacts)}</span></h2><ul class="a-r-ml a-r-mtl">${contactItemsR}</ul></section>`;
  }

  // Credits
  let creditSectionR = '';
  if (showCredits) {
    const creditItemsR = credits.map((cr, index) => {
      const marginClass = index === 0 ? 'a-r-mtl' : 'a-r-mtm';
      const content = `<div class="a-r-tm sfx-y"><div>${escapeHtml(cr.name)}</div></div><div class="a-r-ts a-r-mts sfx-y"><div>${escapeHtml(cr.role)}</div></div>`;
      if (cr.url) {
        return `<li class="${marginClass}"><a href="${escapeHtml(cr.url)}" target="_blank" rel="noopener">${content}</a></li>`;
      }
      return `<li class="${marginClass}">${content}</li>`;
    }).join('');
    creditSectionR = `<section id="a-r-credits" class="a-r-s"><h2 class="sfx-y"><span>${escapeHtml(titleCredits)}</span></h2><ul class="a-r-ml">${creditItemsR}</ul></section>`;
  }

  const rightHtml = `<div id="a-r">` +
    `<header id="a-r-hero" class="a-r-s">` +
      `<p >${escapeHtml(hero.paragraph1)}</p>` +
      `<p  class="a-r-mtm">${escapeHtml(hero.paragraph2)}</p>` +
    `</header>` +
    `${expSectionR}` +
    `${awardSectionR}` +
    `${clientSectionR}` +
    `${contactSectionR}` +
    `${creditSectionR}` +
  `</div>`;

  // 2. Left Column Miniature Card (#a-l)
  let expSectionL = '';
  if (showExp) {
    const expItemsL = experiences.map((exp, index) => {
      const marginClass = index === 0 ? 'a-l-mtl' : 'a-l-mtm';
      const roleHtml = `<div class="a-l-tm">${escapeHtml(exp.role)}</div>`;
      const companyHtml = exp.company ? `<div class="a-l-tm">${escapeHtml(exp.company)}</div>` : '';
      const periodHtml = `<div class="a-l-ts a-l-mts">${escapeHtml(exp.period)}</div>`;
      return `<li class="${marginClass}">${roleHtml}${companyHtml}${periodHtml}</li>`;
    }).join('');
    expSectionL = `<div class="a-l-s"><div>${escapeHtml(titleExp)}</div><ul class="a-l-ml">${expItemsL}</ul></div>`;
  }

  let awardSectionL = '';
  if (showAwards) {
    const awardItemsL = awards.map((aw, index) => {
      const marginClass = index === 0 ? 'a-l-mtl' : 'a-l-mtm';
      const titleHtml = `<div class="a-l-tm">${escapeHtml(aw.title)}</div>`;
      const projHtml = aw.project ? `<div class="a-l-ts a-l-mts">${escapeHtml(aw.project)}</div>` : '';
      let catHtml = '';
      if (aw.category) {
        const lines = aw.category.split('\n');
        catHtml = lines.map(l => `<div class="a-l-ts">${escapeHtml(l.trim())}</div>`).join('');
      }
      const yearHtml = aw.year ? `<div class="a-l-ts">${escapeHtml(aw.year)}</div>` : '';
      return `<li class="${marginClass}">${titleHtml}${projHtml}${catHtml}${yearHtml}</li>`;
    }).join('');
    awardSectionL = `<div class="a-l-s"><div>${escapeHtml(titleAwards)}</div><ul class="a-l-ml">${awardItemsL}</ul></div>`;
  }

  let clientSectionL = '';
  if (showClients) {
    const clientItemsL = clients.map(c => {
      const name = typeof c === 'string' ? c : c.name;
      return `<li><div class="a-l-ts">${escapeHtml(name)}</div></li>`;
    }).join('');
    clientSectionL = `<div class="a-l-s"><div>${escapeHtml(titleClients)}</div><ul class="a-l-ml a-l-mtl">${clientItemsL}</ul></div>`;
  }

  let contactSectionL = '';
  if (showContacts) {
    const contactItemsL = contacts.map(ct => {
      return `<li><div class="a-l-ts">${escapeHtml(ct.label)}</div></li>`;
    }).join('');
    contactSectionL = `<div class="a-l-s"><div>${escapeHtml(titleContacts)}</div><ul class="a-l-ml a-l-mtl">${contactItemsL}</ul></div>`;
  }

  let creditSectionL = '';
  if (showCredits) {
    const creditItemsL = credits.map((cr, index) => {
      const marginClass = index === 0 ? 'a-l-mtl' : 'a-l-mtm';
      return `<li class="${marginClass}"><div class="a-l-tm">${escapeHtml(cr.name)}</div><div class="a-l-ts a-l-mts">${escapeHtml(cr.role)}</div></li>`;
    }).join('');
    creditSectionL = `<div class="a-l-s"><div>${escapeHtml(titleCredits)}</div><ul class="a-l-ml">${creditItemsL}</ul></div>`;
  }

  const leftHtml = `<div id="a-l-w"><div id="a-l">` +
    `<div class="a-l-s">` +
      `<p >${escapeHtml(hero.paragraph1)}</p>` +
      `<p  class="a-l-mtm">${escapeHtml(hero.paragraph2)}</p>` +
    `</div>` +
    `${expSectionL}` +
    `${awardSectionL}` +
    `${clientSectionL}` +
    `${contactSectionL}` +
    `${creditSectionL}` +
  `</div></div>`;

  return `<div class="page">${rightHtml}${leftHtml}<div id="a-lp"></div></div>`;
}

function renderMobileAboutHtml(data) {
  const { hero, experiences, awards, clients, contacts, credits, visibility = {}, section_titles = {} } = data;

  const showExp = visibility.experience !== false && visibility.experience !== 0;
  const showAwards = visibility.awards !== false && visibility.awards !== 0;
  const showClients = visibility.clients !== false && visibility.clients !== 0;
  const showContacts = visibility.contacts !== false && visibility.contacts !== 0;
  const showCredits = visibility.credits !== false && visibility.credits !== 0;

  const titleExp = section_titles.experience || 'Working Experience';
  const titleAwards = section_titles.awards || 'Awards & Recognition';
  const titleClients = section_titles.clients || 'Brands I Worked With';
  const titleContacts = section_titles.contacts || 'Get In Touch';
  const titleCredits = section_titles.credits || 'Credits';

  let expSectionM = '';
  if (showExp) {
    const expItemsM = experiences.map(exp => {
      const companyHtml = exp.company ? `<div>${escapeHtml(exp.company)}</div>` : '';
      return `<li class="a-mtm"><div>${escapeHtml(exp.role)}</div>${companyHtml}<div class="a-txt-s a-mtxs">${escapeHtml(exp.period)}</div></li>`;
    }).join('');
    expSectionM = `<section class="wrap wrap-t a-mtxl"><h2>${escapeHtml(titleExp)}</h2><ul class="a-ml">${expItemsM}</ul></section>`;
  }

  let awardSectionM = '';
  if (showAwards) {
    const awardItemsM = awards.map(aw => {
      const projHtml = aw.project ? `<div class="a-txt-s a-mtxs">${escapeHtml(aw.project)}</div>` : '';
      let catHtml = '';
      if (aw.category) {
        const lines = aw.category.split('\n');
        catHtml = lines.map(l => `<div class="a-txt-s">${escapeHtml(l.trim())}</div>`).join('');
      }
      const yearHtml = aw.year ? `<div class="a-txt-s">${escapeHtml(aw.year)}</div>` : '';
      return `<li class="a-mtm"><div>${escapeHtml(aw.title)}</div>${projHtml}${catHtml}${yearHtml}</li>`;
    }).join('');
    awardSectionM = `<section class="wrap wrap-t a-mtxl"><h2>${escapeHtml(titleAwards)}</h2><ul class="a-ml">${awardItemsM}</ul></section>`;
  }

  let clientSectionM = '';
  if (showClients) {
    const clientItemsM = clients.map(c => {
      const name = typeof c === 'string' ? c : c.name;
      return `<li><div class="a-txt-s">${escapeHtml(name)}</div></li>`;
    }).join('');
    clientSectionM = `<section class="wrap wrap-t a-mtxl"><h2>${escapeHtml(titleClients)}</h2><ul class="a-ml a-mtm">${clientItemsM}</ul></section>`;
  }

  let creditSectionM = '';
  if (showCredits) {
    const creditItemsM = credits.map(cr => {
      const content = `<div class="a-mtm">${escapeHtml(cr.name)}</div><div class="a-txt-s a-mtxs">${escapeHtml(cr.role)}</div>`;
      if (cr.url) {
        return `<li class=""><a href="${escapeHtml(cr.url)}" target="_blank" rel="noopener">${content}</a></li>`;
      }
      return `<li class="">${content}</li>`;
    }).join('');
    creditSectionM = `<section class="wrap wrap-t a-mtxl"><h2>${escapeHtml(titleCredits)}</h2><ul class="a-ml">${creditItemsM}</ul></section>`;
  }

  let contactSectionM = '';
  if (showContacts) {
    const contactItemsM = contacts.map(ct => {
      const isExternal = ct.url && !ct.url.startsWith('mailto:');
      const target = isExternal ? ' target="_blank" rel="noopener"' : '';
      return `<li><a href="${escapeHtml(ct.url)}"${target}>${escapeHtml(ct.label)}</a></li>`;
    }).join('');
    contactSectionM = `<ul class="footer-contact">${contactItemsM}</ul>`;
  }

  const headlineHtml = hero.headline || 'Senior Designer<br>&amp; Art Director';

  return `<div id="a" class="page">` +
    `<nav class="nav wrap"><a href="/">Profile 2026</a> <a href="/">Back</a></nav>` +
    `<header id="a-hero" class="wrap wrap-t">` +
      `<h1>${headlineHtml}</h1>` +
      `<p class="a-mtl">${escapeHtml(hero.paragraph1)}</p>` +
      `<p class="a-mts">${escapeHtml(hero.paragraph2)}</p>` +
    `</header>` +
    `${expSectionM}` +
    `${awardSectionM}` +
    `${clientSectionM}` +
    `${creditSectionM}` +
    `<div id="a-img" class="a-mtxl" style="aspect-ratio: 856/1150;"><img class="_lz" src="data:," data-src="/static/media/m/about/cami.jpg?1" alt="Portrait" width="856" height="1150"></div>` +
    `<footer class="footer wrap">` +
      `<div class="footer-title">Profile 2026<br>Portfolio</div>` +
      `<ul class="footer-list">` +
        `<li><a class="footer-list-cta" href="/"><div>Work</div><div><svg viewBox="0 0 12 56"><polygon points="7.944,31.752 11.7,28.003 11.697,28 11.7,27.997 7.771,24.074 7.129,24.716 9.941,27.528 0.3,27.528 0.3,28.436 9.977,28.436 7.129,31.284 7.597,31.752 7.771,31.926 "/></svg></div></a></li>` +
        `<li><div class="footer-list-touch footer-list-cta"><div>Get In Touch</div><div><svg viewBox="0 0 12 56"><rect x="0.3" y="27.561" width="11.4" height="0.878"/><rect class="footer-list-touch-cross-vertical" x="5.561" y="22.3" width="0.878" height="11.4"/></svg></div></div></li>` +
      `</ul>` +
      `${contactSectionM}` +
      `<div class="footer-top"><svg viewBox="0 0 46 54"><path d="M23,53.034c-12.188,0-22.104-9.916-22.104-22.104V23.07C0.896,10.882,10.812,0.966,23,0.966c12.188,0,22.104,9.916,22.104,22.104v7.859C45.104,43.118,35.188,53.034,23,53.034z M23,1.949c-11.646,0-21.122,9.475-21.122,21.122v7.859c0,11.646,9.475,21.122,21.122,21.122s21.122-9.476,21.122-21.122V23.07C44.122,11.424,34.646,1.949,23,1.949z"/><polygon points="26.752,25.056 23.003,21.3 23,21.303 22.997,21.3 19.074,25.229 19.716,25.871 22.528,23.059 22.528,32.7 23.436,32.7 23.436,23.023 26.284,25.871 26.752,25.403 26.926,25.229"/></svg></div>` +
    `</footer>` +
  `</div>`;
}

module.exports = {
  renderDesktopAboutHtml,
  renderMobileAboutHtml
};
