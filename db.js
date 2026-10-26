const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(DB_PATH);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS about_hero (
      id INTEGER PRIMARY KEY,
      headline TEXT NOT NULL,
      paragraph1 TEXT NOT NULL,
      paragraph2 TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS about_visibility (
      section_key TEXT PRIMARY KEY,
      is_visible INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS about_experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      company TEXT DEFAULT '',
      period TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS about_awards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      project TEXT DEFAULT '',
      category TEXT DEFAULT '',
      year TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS about_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS about_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS about_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      url TEXT DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      h1_lines TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      team_prefix TEXT DEFAULT 'Done with',
      team_name TEXT DEFAULT '',
      home_tex TEXT NOT NULL,
      hero_tex TEXT NOT NULL,
      next_slug TEXT NOT NULL,
      next_title TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 1,
      is_visible INTEGER NOT NULL DEFAULT 1,
      sections TEXT NOT NULL
    );
  `);

  // 1. Seed About Hero if empty
  const heroCheck = db.prepare('SELECT COUNT(*) as count FROM about_hero').get();
  if (heroCheck.count === 0) {
    db.prepare(`
      INSERT INTO about_hero (id, headline, paragraph1, paragraph2)
      VALUES (1, 'Senior Designer<br>&amp; Art Director', 
      'I’m an Independent Interactive Designer with years of experience in building art direction and appealing web experiences.',
      'I specialize in visual design with a strong focus on interaction. I also love to illustrate elements to make each experience unique.')
    `).run();

    const expStmt = db.prepare('INSERT INTO about_experiences (role, company, period, order_index) VALUES (?, ?, ?, ?)');
    const initialExps = [
      ['Freelance Designer', '&amp; Art Director', '2022 – Present', 1],
      ['Senior Designer', 'AKQA Amsterdam', '2018 – 2022', 2],
      ['Designer', 'DDB Tribal Amsterdam', '2016 – 2018', 3],
      ['Designer', 'Fabrique Amsterdam', '2015 – 2016', 4],
      ['Intern', 'Media Monks', '2014 – 2015', 5],
    ];
    for (const exp of initialExps) {
      expStmt.run(...exp);
    }

    const awardStmt = db.prepare('INSERT INTO about_awards (title, project, category, year, order_index) VALUES (?, ?, ?, ?, ?)');
    const initialAwards = [
      ['Silver Webby Award', 'Samsung Galaxy Watch 4', 'Wearable Design', '2022', 1],
      ['Silver Webby Award', 'Samsung Galaxy Watch 4', 'Visual Aesthetic\n&amp; Connected Products', '2022', 2],
      ['Rookie Of The Year', 'AKQA Amsterdam', '', '2018', 3],
      ['FWA Of The Day', 'Adidas Ultraboost All Terrain', '', 'October 9, 2017', 4],
      ['Silver European Design Award', 'Great Fire Of London', '', '2016', 5],
    ];
    for (const aw of initialAwards) {
      awardStmt.run(...aw);
    }

    const clientStmt = db.prepare('INSERT INTO about_clients (name, order_index) VALUES (?, ?)');
    const initialClients = [
      'Samsung', 'Google', 'Nike', 'Sennheiser', 'Gucci', 'Swarovski', 'Adidas',
      'Polestar', 'Viktor&amp;Rolf', 'Museum Of London', 'TikTok', 'GoreTex',
      'Toyota', 'Van Gogh Museum', 'McDonald’s', 'Colgate'
    ];
    initialClients.forEach((name, i) => clientStmt.run(name, i + 1));

    const contactStmt = db.prepare('INSERT INTO about_contacts (label, url, order_index) VALUES (?, ?, ?)');
    const initialContacts = [
      ['Email', 'mailto:camimormal@gmail.com', 1],
      ['Twitter', 'https://twitter.com/CamilleMormal', 2],
      ['Linkedin', 'https://www.linkedin.com/in/camimormal', 3],
      ['Instagram', 'https://www.instagram.com/cami.channn', 4],
      ['Behance', 'https://www.behance.net/CMormal', 5],
    ];
    for (const c of initialContacts) {
      contactStmt.run(...c);
    }

    const creditStmt = db.prepare('INSERT INTO about_credits (name, role, url, order_index) VALUES (?, ?, ?, ?)');
    const initialCredits = [
      ['Aristide Benoist', 'Motion &amp; Development', 'https://www.aristidebenoist.com', 1],
      ['Klim Type Foundry', 'Söhne Buch', 'https://klim.co.nz/retail-fonts/soehne', 2],
    ];
    for (const cr of initialCredits) {
      creditStmt.run(...cr);
    }
  }

  // 2. Seed About Visibility if empty
  const visCheck = db.prepare('SELECT COUNT(*) as count FROM about_visibility').get();
  if (visCheck.count === 0) {
    const visStmt = db.prepare('INSERT INTO about_visibility (section_key, is_visible) VALUES (?, ?)');
    ['experience', 'awards', 'clients', 'contacts', 'credits'].forEach(key => {
      visStmt.run(key, 1);
    });
  }

  // 3. Seed Projects if empty
  const projCheck = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  if (projCheck.count === 0) {
    const seedFile = path.join(__dirname, 'seed_projects.json');
    if (fs.existsSync(seedFile)) {
      const projects = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
      const projStmt = db.prepare(`
        INSERT INTO projects (
          slug, title, h1_lines, role, description, team_prefix, team_name,
          home_tex, hero_tex, next_slug, next_title, order_index, is_visible, sections
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of projects) {
        projStmt.run(
          p.slug,
          p.title,
          JSON.stringify(p.h1_lines),
          p.role,
          p.description,
          p.team_prefix,
          p.team_name,
          p.home_tex,
          p.hero_tex,
          p.next_slug,
          p.next_title,
          p.order_index,
          1,
          JSON.stringify(p.sections)
        );
      }
    }
  }
}

initDb();

// --- About Page API ---
function getAboutData() {
  const hero = db.prepare('SELECT * FROM about_hero WHERE id = 1').get() || {
    headline: 'Senior Designer<br>&amp; Art Director',
    paragraph1: '',
    paragraph2: ''
  };
  const experiences = db.prepare('SELECT * FROM about_experiences ORDER BY order_index ASC, id ASC').all();
  const awards = db.prepare('SELECT * FROM about_awards ORDER BY order_index ASC, id ASC').all();
  const clients = db.prepare('SELECT * FROM about_clients ORDER BY order_index ASC, id ASC').all();
  const contacts = db.prepare('SELECT * FROM about_contacts ORDER BY order_index ASC, id ASC').all();
  const credits = db.prepare('SELECT * FROM about_credits ORDER BY order_index ASC, id ASC').all();

  const visRows = db.prepare('SELECT * FROM about_visibility').all();
  const visibility = {
    experience: true,
    awards: true,
    clients: true,
    contacts: true,
    credits: true
  };
  visRows.forEach(r => {
    visibility[r.section_key] = r.is_visible === 1;
  });

  return {
    hero,
    visibility,
    experiences,
    awards,
    clients,
    contacts,
    credits
  };
}

function updateAboutData(data) {
  // Update Hero
  if (data.hero) {
    db.prepare(`
      UPDATE about_hero 
      SET headline = ?, paragraph1 = ?, paragraph2 = ?
      WHERE id = 1
    `).run(data.hero.headline || '', data.hero.paragraph1 || '', data.hero.paragraph2 || '');
  }

  // Update Visibility
  if (data.visibility && typeof data.visibility === 'object') {
    const stmt = db.prepare('INSERT OR REPLACE INTO about_visibility (section_key, is_visible) VALUES (?, ?)');
    for (const [key, val] of Object.entries(data.visibility)) {
      stmt.run(key, val ? 1 : 0);
    }
  }

  // Update Experiences
  if (Array.isArray(data.experiences)) {
    db.exec('DELETE FROM about_experiences');
    const stmt = db.prepare('INSERT INTO about_experiences (role, company, period, order_index) VALUES (?, ?, ?, ?)');
    data.experiences.forEach((exp, i) => {
      stmt.run(exp.role || '', exp.company || '', exp.period || '', i + 1);
    });
  }

  // Update Awards
  if (Array.isArray(data.awards)) {
    db.exec('DELETE FROM about_awards');
    const stmt = db.prepare('INSERT INTO about_awards (title, project, category, year, order_index) VALUES (?, ?, ?, ?, ?)');
    data.awards.forEach((aw, i) => {
      stmt.run(aw.title || '', aw.project || '', aw.category || '', aw.year || '', i + 1);
    });
  }

  // Update Clients
  if (Array.isArray(data.clients)) {
    db.exec('DELETE FROM about_clients');
    const stmt = db.prepare('INSERT INTO about_clients (name, order_index) VALUES (?, ?)');
    data.clients.forEach((c, i) => {
      const name = typeof c === 'string' ? c : c.name;
      stmt.run(name || '', i + 1);
    });
  }

  // Update Contacts
  if (Array.isArray(data.contacts)) {
    db.exec('DELETE FROM about_contacts');
    const stmt = db.prepare('INSERT INTO about_contacts (label, url, order_index) VALUES (?, ?, ?)');
    data.contacts.forEach((ct, i) => {
      stmt.run(ct.label || '', ct.url || '', i + 1);
    });
  }

  // Update Credits
  if (Array.isArray(data.credits)) {
    db.exec('DELETE FROM about_credits');
    const stmt = db.prepare('INSERT INTO about_credits (name, role, url, order_index) VALUES (?, ?, ?, ?)');
    data.credits.forEach((cr, i) => {
      stmt.run(cr.name || '', cr.role || '', cr.url || '', i + 1);
    });
  }

  return getAboutData();
}

// --- Projects API ---
function getProjects() {
  const rows = db.prepare('SELECT * FROM projects ORDER BY order_index ASC, id ASC').all();
  return rows.map(r => {
    return {
      ...r,
      h1_lines: JSON.parse(r.h1_lines || '[]'),
      sections: JSON.parse(r.sections || '[]'),
      is_visible: r.is_visible === 1
    };
  });
}

function getProjectBySlug(slug) {
  const cleanSlug = slug.replace(/^\/+/, '');
  const r = db.prepare('SELECT * FROM projects WHERE slug = ?').get(cleanSlug);
  if (!r) return null;
  return {
    ...r,
    h1_lines: JSON.parse(r.h1_lines || '[]'),
    sections: JSON.parse(r.sections || '[]'),
    is_visible: r.is_visible === 1
  };
}

function updateProject(slug, data) {
  const cleanSlug = slug.replace(/^\/+/, '');
  db.prepare(`
    UPDATE projects SET
      title = ?,
      h1_lines = ?,
      role = ?,
      description = ?,
      team_prefix = ?,
      team_name = ?,
      next_slug = ?,
      next_title = ?,
      order_index = ?,
      is_visible = ?,
      sections = ?
    WHERE slug = ?
  `).run(
    data.title || '',
    JSON.stringify(data.h1_lines || []),
    data.role || '',
    data.description || '',
    data.team_prefix || 'Done with',
    data.team_name || '',
    data.next_slug || '',
    data.next_title || '',
    data.order_index || 1,
    data.is_visible ? 1 : 0,
    JSON.stringify(data.sections || []),
    cleanSlug
  );
  return getProjectBySlug(cleanSlug);
}

module.exports = {
  db,
  getAboutData,
  updateAboutData,
  getProjects,
  getProjectBySlug,
  updateProject
};
