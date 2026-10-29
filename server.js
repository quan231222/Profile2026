const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const {
  getAboutData,
  updateAboutData,
  getProjects,
  getProjectBySlug,
  updateProject,
  createProject,
  deleteProject
} = require('./db');

const { renderDesktopAboutHtml, renderMobileAboutHtml } = require('./renderAbout');
const { renderDesktopProjectHtml, renderMobileProjectHtml, generateProjectHtmlShell } = require('./renderProject');
const {
  cleanTexturePath,
  getRandomIntroTextures,
  getRandomizedProjects,
  renderDesktopHomeHtml,
  renderMobileHomeHtml
} = require('./workIntro');

const PORT = process.env.PORT || 3001;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOAD_DIR = path.join(ROOT_DIR, 'static', 'media', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.m4v': 'video/mp4',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  const query = parsedUrl.query;

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API: /api/upload (POST base64 image) ---
  if (pathname === '/api/upload' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const { data, name } = JSON.parse(bodyStr);
        if (!data) throw new Error('Missing file data');

        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const base64Data = matches ? matches[2] : data;
        let ext = '.jpg';
        if (matches && matches[1]) {
          ext = '.' + matches[1].split('/')[1].replace('jpeg', 'jpg');
        } else if (name) {
          ext = path.extname(name) || '.jpg';
        }
        const cleanExt = (ext.startsWith('.') ? ext : '.' + ext).toLowerCase();
        const safeBaseName = (name ? path.basename(name, path.extname(name)) : 'img')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .substring(0, 20);

        const filename = `${Date.now()}_${safeBaseName}${cleanExt}`;
        const savePath = path.join(UPLOAD_DIR, filename);

        fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));
        const publicUrl = `/static/media/uploads/${filename}`;

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, url: publicUrl }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- API: /api/about (GET / POST) ---
  if (pathname === '/api/about') {
    if (req.method === 'GET') {
      const data = getAboutData();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
      return;
    } else if (req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(bodyStr);
          const updated = updateAboutData(parsed);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, data: updated }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }
  }

  // --- API: /api/projects (GET all, POST create) ---
  if (pathname === '/api/projects') {
    if (req.method === 'GET') {
      const projs = getProjects();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(projs));
      return;
    } else if (req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(bodyStr);
          const created = createProject(parsed);
          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, project: created }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }
  }

  if (pathname.startsWith('/api/projects/')) {
    const slug = pathname.replace('/api/projects/', '').replace(/^\/+|\/+$/g, '');
    if (req.method === 'GET') {
      const proj = getProjectBySlug(slug);
      if (!proj) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Project not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(proj));
      return;
    } else if (req.method === 'POST' || req.method === 'PUT') {
      let bodyStr = '';
      req.on('data', chunk => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(bodyStr);
          const updated = updateProject(slug, parsed);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, data: updated }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    } else if (req.method === 'DELETE') {
      const result = deleteProject(slug);
      if (!result.success) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
      return;
    }
  }

  // --- ADMIN CMS: /admin ---
  if (pathname === '/admin' || pathname === '/admin/') {
    const adminPath = path.join(ROOT_DIR, 'admin.html');
    if (fs.existsSync(adminPath)) {
      const stat = fs.statSync(adminPath);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': stat.size,
      });
      fs.createReadStream(adminPath).pipe(res);
      return;
    }
  }

  // --- 1. Dynamic API request from frontend framework (R.Fetch in d.js / m.js) ---
  if (query.device !== undefined && query.webp !== undefined) {
    const routeName = pathname.replace(/^\/+|\/+$/g, '') || 'home';
    const device = query.device === 'm' ? 'm' : 'd';
    const webp = query.webp === 'true' ? 'true' : 'false';
    const jsonFileName = `${routeName}_${device}_${webp}.json`;
    let jsonPath = path.join(DATA_DIR, jsonFileName);

    if (!fs.existsSync(jsonPath)) {
      jsonPath = path.join(DATA_DIR, `home_${device}_${webp}.json`);
    }

    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const payload = JSON.parse(raw);

        // 1.1 Dynamically inject SQLite database data for /about
        const aboutDbData = getAboutData();
        const dynamicAboutHtml = device === 'm'
          ? renderMobileAboutHtml(aboutDbData)
          : renderDesktopAboutHtml(aboutDbData);

        if (payload.cache && payload.cache['/about']) {
          payload.cache['/about'].html = dynamicAboutHtml;
        }

        if (routeName === 'about' && payload.body) {
          const mainOpen = '<main id="main">';
          const mainClose = '</main>';
          const idxOpen = payload.body.indexOf(mainOpen);
          const idxClose = payload.body.lastIndexOf(mainClose);
          if (idxOpen !== -1 && idxClose !== -1) {
            payload.body = payload.body.slice(0, idxOpen + mainOpen.length) +
                           dynamicAboutHtml +
                           payload.body.slice(idxClose);
          }
        }

        // 1.2 Dynamically inject SQLite database data for Projects
        const allDbProjects = getProjects();
        const totalProjects = allDbProjects.length;

        // 1.3 Dynamically randomize Intro Textures from DB projects
        if (payload.data && payload.data.load) {
          const introTextures = getRandomIntroTextures(allDbProjects, 25);
          payload.data.load.tex = introTextures;
          payload.data.load.texL = introTextures.length;
        }

        // 1.4 Maintain fixed order for Work Page projects (sorted by order_index in DB)
        const homeProjects = allDbProjects;
        if (payload.data && payload.data['/']) {
          payload.data['/'].tex = homeProjects.map(p => cleanTexturePath(p.home_tex));
          payload.data['/'].texL = homeProjects.length;
        }

        const dynamicDesktopHomeHtml = renderDesktopHomeHtml(homeProjects);
        const dynamicMobileHomeHtml = renderMobileHomeHtml(homeProjects);

        if (payload.cache && payload.cache['/']) {
          payload.cache['/'].html = device === 'm' ? dynamicMobileHomeHtml : dynamicDesktopHomeHtml;
        }

        if ((routeName === 'home' || routeName === '') && payload.body) {
          const dynamicHomeHtml = device === 'm' ? dynamicMobileHomeHtml : dynamicDesktopHomeHtml;
          const mainOpen = '<main id="main">';
          const mainClose = '</main>';
          const idxOpen = payload.body.indexOf(mainOpen);
          const idxClose = payload.body.lastIndexOf(mainClose);
          if (idxOpen !== -1 && idxClose !== -1) {
            payload.body = payload.body.slice(0, idxOpen + mainOpen.length) +
                           dynamicHomeHtml +
                           payload.body.slice(idxClose);
          }
        }

        // 1.5 Dynamically rebuild payload.routes for all DB projects
        payload.routes = {
          '/': { page: 'ho', index: 0 },
          '/about': { page: 'ab', index: 0 }
        };
        allDbProjects.forEach((proj, idx) => {
          payload.routes['/' + proj.slug] = {
            page: 'wo',
            index: idx
          };
        });

        // Prune stale cache and data entries for obsolete project slugs (keep root and /about)
        if (payload.cache) {
          const keepCache = { '/': payload.cache['/'] };
          if (payload.cache['/about']) keepCache['/about'] = payload.cache['/about'];
          payload.cache = keepCache;
        }
        if (payload.data) {
          const keepData = {};
          if (payload.data['/']) keepData['/'] = payload.data['/'];
          if (payload.data['/about']) keepData['/about'] = payload.data['/about'];
          if (payload.data.load) keepData.load = payload.data.load;
          payload.data = keepData;
        }

        allDbProjects.forEach(proj => {
          const projKey = '/' + proj.slug;
          const dynamicProjHtml = device === 'm'
            ? renderMobileProjectHtml(proj)
            : renderDesktopProjectHtml(proj, totalProjects);

          if (!payload.cache) payload.cache = {};
          payload.cache[projKey] = {
            title: proj.title,
            html: dynamicProjHtml
          };

          if (payload.data) {
            const heroClean = cleanTexturePath(proj.hero_tex || proj.home_tex);
            const nextP = allDbProjects.find(p => p.slug === proj.next_slug) || allDbProjects[0];
            const nextHomeClean = cleanTexturePath(nextP ? (nextP.home_tex || nextP.hero_tex) : heroClean);
            payload.data[projKey] = {
              preload: true,
              texL: 2,
              tex: [heroClean, nextHomeClean],
              heroFit: proj.hero_fit || 'contain'
            };
          }

          if (routeName === proj.slug && payload.body) {
            const mainOpen = '<main id="main">';
            const mainClose = '</main>';
            const idxOpen = payload.body.indexOf(mainOpen);
            const idxClose = payload.body.lastIndexOf(mainClose);
            if (idxOpen !== -1 && idxClose !== -1) {
              payload.body = payload.body.slice(0, idxOpen + mainOpen.length) +
                             dynamicProjHtml +
                             payload.body.slice(idxClose);
            }
          }
        });

        const outStr = JSON.stringify(payload);
        const outBuf = Buffer.from(outStr, 'utf-8');

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': outBuf.length,
          'Cache-Control': 'no-cache',
        });
        res.end(outBuf);
        return;
      } catch (e) {
        console.error('Error generating dynamic payload:', e);
      }
    }
  }

  // --- 2. Static asset request (/static/...) ---
  if (pathname.startsWith('/static/')) {
    let filePath = path.join(ROOT_DIR, pathname);
    if (!fs.existsSync(filePath)) {
      const parsedPath = path.parse(filePath);
      const possibleExtensions = ['.jpg', '.png', '.webp', '.jpeg'];
      for (const ext of possibleExtensions) {
        const candidate = path.join(parsedPath.dir, parsedPath.name + ext);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          filePath = candidate;
          break;
        }
      }
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);

      if (req.headers.range && (ext === '.mp4' || ext === '.webm' || ext === '.ogg' || ext === '.mov' || ext === '.m4v')) {
        const parts = req.headers.range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Asset Not Found');
      return;
    }
  }

  // --- 3. HTML route requests (/ or /about or /guardian, etc.) ---
  const route = pathname.replace(/^\/+|\/+$/g, '');

  // 3.1 Dynamic project HTML shell if route matches any project in database
  if (route && route !== 'admin') {
    const dbProj = getProjectBySlug(route);
    if (dbProj) {
      const allDbProjects = getProjects();
      const shellHtml = generateProjectHtmlShell(dbProj, allDbProjects);
      const buf = Buffer.from(shellHtml, 'utf-8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': buf.length,
        'Cache-Control': 'no-cache',
      });
      res.end(buf);
      return;
    }
  }

  // 3.2 Static HTML files for / or /about
  let htmlPath;
  if (!route) {
    htmlPath = path.join(ROOT_DIR, 'index.html');
  } else {
    htmlPath = path.join(ROOT_DIR, route, 'index.html');
  }

  if (fs.existsSync(htmlPath)) {
    const stat = fs.statSync(htmlPath);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(htmlPath).pipe(res);
    return;
  }

  // Fallback to root index.html
  const defaultHtmlPath = path.join(ROOT_DIR, 'index.html');
  if (fs.existsSync(defaultHtmlPath)) {
    const stat = fs.statSync(defaultHtmlPath);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': stat.size,
    });
    fs.createReadStream(defaultHtmlPath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin CMS available at http://localhost:${PORT}/admin`);
});
