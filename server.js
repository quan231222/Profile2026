const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const {
  getAboutData,
  updateAboutData,
  getProjects,
  getProjectBySlug,
  updateProject
} = require('./db');

const { renderDesktopAboutHtml, renderMobileAboutHtml } = require('./renderAbout');
const { renderDesktopProjectHtml, renderMobileProjectHtml } = require('./renderProject');

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

  // --- API: /api/projects (GET all, POST update) ---
  if (pathname === '/api/projects') {
    if (req.method === 'GET') {
      const projs = getProjects();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(projs));
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

        allDbProjects.forEach(proj => {
          const projKey = '/' + proj.slug;
          const dynamicProjHtml = device === 'm'
            ? renderMobileProjectHtml(proj)
            : renderDesktopProjectHtml(proj, totalProjects);

          if (payload.cache && payload.cache[projKey]) {
            payload.cache[projKey].html = dynamicProjHtml;
            payload.cache[projKey].title = proj.title;
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
    const filePath = path.join(ROOT_DIR, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);
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

  // --- 3. HTML route requests (/ or /about or /gucci, etc.) ---
  const route = pathname.replace(/^\/+|\/+$/g, '');
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
