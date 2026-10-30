/**
 * Video Player & Lightbox Controller for Profile 2026
 * Videos act as seamless autoplay looping previews with zero controls.
 * Includes smart in-view playback and high-res image lightbox.
 */

(function () {
  const ICONS = {
    close: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  // Safe dummy functions for legacy / inline calls
  window._toggleVideoPlay = function () {};
  window._toggleVideoMute = function () {};
  window._toggleVideoFullscreen = function () {};
  window._seekVideo = function () {};

  // --- Smart Intersection Observer for In-View Autoplay & Loop ---
  let videoObserver = null;
  function getObserver() {
    if (!videoObserver && window.IntersectionObserver) {
      videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          const wrapper = entry.target;
          const video = wrapper.querySelector('video');
          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            video.muted = true;
            video.play().catch(function () {});
          } else {
            video.pause();
          }
        });
      }, { threshold: [0, 0.1, 0.5] });
    }
    return videoObserver;
  }

  // --- Initialize Single Video Wrapper (Loop Preview Only) ---
  function initVideoWrapper(wrapper) {
    if (wrapper.dataset.initialized === 'true') return;
    wrapper.dataset.initialized = 'true';

    const video = wrapper.querySelector('video');
    if (!video) return;

    // Force looping preview attributes
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.removeAttribute('controls');
    video.controls = false;

    // Automatic seamless replay when video reaches end
    video.addEventListener('ended', function () {
      video.currentTime = 0;
      video.play().catch(function () {});
    });

    // Make sure it starts playing immediately
    video.play().catch(function () {});

    const obs = getObserver();
    if (obs) obs.observe(wrapper);

    video.addEventListener('loadeddata', function () {
      video.style.opacity = '1';
      video.play().catch(function () {});
    });
    if (video.readyState >= 2) {
      video.style.opacity = '1';
      video.play().catch(function () {});
    }
  }

  window._initAllVideos = function () {
    const wrappers = document.querySelectorAll('.w-s-video-wrapper');
    wrappers.forEach(initVideoWrapper);
  };

  // --- High-End Lightbox for Project Detail Page Images ---
  let lightboxEl = null;
  let lightboxImg = null;
  let lightboxCaption = null;

  function ensureLightbox() {
    if (lightboxEl) return lightboxEl;
    lightboxEl = document.getElementById('pf-lightbox');
    if (!lightboxEl) {
      lightboxEl = document.createElement('div');
      lightboxEl.id = 'pf-lightbox';
      lightboxEl.innerHTML = `
        <div id="pf-lightbox-close" title="Đóng (ESC)">
          ${ICONS.close}
        </div>
        <img id="pf-lightbox-img" src="" alt="High-Resolution Preview">
        <div id="pf-lightbox-caption"></div>
      `;
      document.body.appendChild(lightboxEl);

      lightboxImg = lightboxEl.querySelector('#pf-lightbox-img');
      lightboxCaption = lightboxEl.querySelector('#pf-lightbox-caption');

      // Click backdrop or close button to close
      lightboxEl.addEventListener('click', function (e) {
        if (e.target !== lightboxImg) {
          closeLightbox();
        }
      });
      lightboxImg.addEventListener('click', function () {
        closeLightbox();
      });

      // ESC key to close
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
          closeLightbox();
        }
      });
    } else {
      lightboxImg = lightboxEl.querySelector('#pf-lightbox-img');
      lightboxCaption = lightboxEl.querySelector('#pf-lightbox-caption');
    }
    return lightboxEl;
  }

  function openLightbox(src, altText = '') {
    if (!src) return;
    const lb = ensureLightbox();
    lightboxImg.src = src;
    lightboxCaption.textContent = altText || document.title.replace(' — Profile 2026', '') || '';
    lb.classList.add('is-open');
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('is-open');
    setTimeout(function () {
      if (lightboxImg && !lightboxEl.classList.contains('is-open')) {
        lightboxImg.src = '';
      }
    }, 320);
  }

  window._openImageLightbox = openLightbox;
  window._closeImageLightbox = closeLightbox;

  // --- Setup Click-to-Zoom Listener for Project Gallery Images ---
  let startX = 0, startY = 0;
  document.addEventListener('mousedown', function (e) {
    startX = e.clientX;
    startY = e.clientY;
  }, true);

  document.addEventListener('mouseup', function (e) {
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
    if (dist > 8) return; // Ignore drag/swipe movements

    // Check if clicked inside a project section item (.w-s)
    const secItem = e.target.closest('.w-s > div');
    if (!secItem) return;

    // If clicked inside a video wrapper or preview badge, let video handler process it
    if (e.target.closest('.w-s-video-wrapper') || e.target.closest('.w-video-controls')) {
      return;
    }

    // Find the image element inside this section
    const img = secItem.querySelector('img');
    if (img) {
      const src = img.currentSrc || img.getAttribute('data-src') || img.src;
      if (src && !src.startsWith('data:,')) {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(src, img.alt || '');
      }
    }
  }, true);

  // --- Watch DOM mutations for SPA route transitions ---
  function observeDomChanges() {
    if (window.MutationObserver) {
      const observer = new MutationObserver(function (mutations) {
        let hasNew = false;
        for (let i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes.length > 0) {
            hasNew = true;
            break;
          }
        }
        if (hasNew) {
          window._initAllVideos();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window._initAllVideos();
      observeDomChanges();
    });
  } else {
    window._initAllVideos();
    observeDomChanges();
  }
})();
