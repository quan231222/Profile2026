# Profile 2026 Portfolio (Complete Replica with SQLite Database & Admin CMS)

A complete offline & online interactive portfolio for **Profile 2026**, featuring:
- **WebGL Shader Engine**: Custom Three.js/WebGL canvas shaders, post-processing, mouse tracking, distortion transitions, and interactive image morphs.
- **Micro-Animations & Smooth Physics**: Precise damping, custom RAF loops, kinetic inertia scrolling, and interactive timeline controls.
- **Typography & Font**: Custom font `s.woff2` with pixel-perfect responsive font sizing (`vh`/`vw` aspect-ratio clamps).
- **All 10 Routes Cloned**:
  - `/` (Home interactive showcase with 8 featured award-winning works)
  - `/about` (Bio, philosophy, experience timeline, awards & recognition, brand lists)
  - `/gucci`, `/samsung`, `/rituals`, `/moco`, `/sennheiser`, `/swarovski`, `/activia`, `/saeco`
- **All 463 Assets Included**: Every single texture, hero image, thumbnail carousel preview, SVG mask, favicon, and mobile asset is preserved locally.
- **Dual Device Experience**: Full responsive architecture supporting desktop (`/static/css/d.css`, `/static/js/d.js`) and mobile touch devices (`/static/css/m.css`, `/static/js/m.js`).

---

## Getting Started

### 1. Run the local server
Zero external dependencies required (uses native Node.js HTTP server):

```bash
npm start
# or: node server.js
```

### 2. View in Browser
- Portfolio Home: [http://localhost:3001](http://localhost:3001)
- About Page: [http://localhost:3001/about](http://localhost:3001/about)
- **Admin CMS Dashboard**: [http://localhost:3001/admin](http://localhost:3001/admin)

---

## Database & Content Management (/about)
Trang `/about` đã được liên kết trực tiếp với cơ sở dữ liệu **SQLite** (`database.sqlite`):
1. **Database Schema** (`db.js`):
   - `about_hero`: Tiêu đề (Headline) & 2 đoạn bio giới thiệu.
   - `about_experiences`: Danh sách vị trí làm việc, công ty, thời gian.
   - `about_awards`: Các giải thưởng, dự án, hạng mục, năm.
   - `about_clients`: Danh sách thương hiệu/đối tác hợp tác.
   - `about_contacts`: Email và các link mạng xã hội (Twitter, LinkedIn, Instagram, Behance...).
   - `about_credits`: Thông tin bản quyền, motion & typography.
2. **Dynamic HTML Rendering Engine** (`renderAbout.js`):
   - Tự động render HTML với đầy đủ animation classes (`.sfx-y`, split typography, miniature card `#a-l`) cho cả Desktop và Mobile.
3. **RESTful API** (`server.js`):
   - `GET /api/about`: Lấy toàn bộ dữ liệu hiện tại từ SQLite.
   - `POST /api/about`: Cập nhật dữ liệu vào SQLite và tự động cập nhật ngay trên trang `/about`.
4. **Giao diện quản trị Admin CMS** (`/admin`):
   - Quản lý trực quan toàn bộ nội dung `/about`.
   - Thêm/xoá/sửa nhanh chóng với nút "Lưu thay đổi vào DB".

---

## Project Structure
- `database.sqlite`: File cơ sở dữ liệu SQLite lưu trữ dữ liệu động.
- `db.js`: Tầng kết nối & thao tác CRUD với SQLite.
- `renderAbout.js`: Bộ sinh mã HTML động cho `/about` tương thích chuẩn WebGL SPA.
- `admin.html`: Giao diện quản trị Admin CMS trực quan.
- `index.html`: Root HTML shell with initial loading screen and device detection.
- `about/index.html`, `gucci/index.html`, `samsung/index.html`, ...: Deep-link route shells.
- `static/css/`: Desktop (`d.css`) and mobile (`m.css`) stylesheets.
- `static/js/`: Desktop (`d.js`) and mobile (`m.js`) WebGL application engines.
- `static/font/`: Custom font `s.woff2`.
- `static/media/`: All 400+ high-resolution project images, textures, and thumbnails.
- `data/`: Dynamic API payloads for all routes, devices, and format permutations.
- `server.js`: Lightweight HTTP server supporting route navigation, dynamic JSON API endpoints, and Admin CMS.
