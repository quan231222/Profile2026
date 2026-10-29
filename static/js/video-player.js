/**
 * Video Player & Lightbox Controller for Profile 2026
 * Handles custom video controls, autoplay, smart in-view playback,
 * audio toggle, progress scrubbing, fullscreen, and high-res image lightbox.
 */

(function () {
  const ICONS = {
    play: '<svg viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    unmute: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    exitFullscreen: '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  // --- Interaction Handlers for Videos ---
  window._toggleVideoPlay = function (el, event) {
    if (event) event.stopPropagation();
    const wrapper = el.closest('.w-s-video-wrapper');
    if (!wrapper) return;
    const video = wrapper.querySelector('video');
    if (!video) return;

    if (video.paused) {
      video.play().catch(function () {});
      wrapper.classList.remove('is-paused');
      wrapper.dataset.userPaused = 'false';
    } else {
      video.pause();
      wrapper.classList.add('is-paused');
      wrapper.dataset.userPaused = 'true';
    }
    updatePlayState(wrapper, video);
  };

  window._toggleVideoMute = function (el, event) {
    if (event) event.stopPropagation();
    const wrapper = el.closest('.w-s-video-wrapper');
    if (!wrapper) return;
    const video = wrapper.querySelector('video');
    if (!video) return;

    video.muted = !video.muted;
    updateMuteState(wrapper, video);
  };

  window._toggleVideoFullscreen = function (el, event) {
    if (event) event.stopPropagation();
    const wrapper = el.closest('.w-s-video-wrapper');
    if (!wrapper) return;
    const video = wrapper.querySelector('video');
    if (!video) return;

    const target = wrapper.requestFullscreen ? wrapper : video;
    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(function () {});
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      }
    }
  };

  window._seekVideo = function (wrapEl, event) {
    if (event) event.stopPropagation();
    const wrapper = wrapEl.closest('.w-s-video-wrapper');
    if (!wrapper) return;
    const video = wrapper.querySelector('video');
    if (!video || !video.duration) return;

    const rect = wrapEl.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    video.currentTime = pos * video.duration;
  };

  function updatePlayState(wrapper, video) {
    const playBtn = wrapper.querySelector('.w-video-btn-play');
    if (playBtn) {
      playBtn.innerHTML = video.paused ? ICONS.play : ICONS.pause;
    }
    if (video.paused) {
      wrapper.classList.add('is-paused');
    } else {
      wrapper.classList.remove('is-paused');
    }
  }

  function updateMuteState(wrapper, video) {
    const muteBtns = wrapper.querySelectorAll('.w-video-btn-mute, .w-video-quick-mute');
    const iconHtml = video.muted ? ICONS.mute : ICONS.unmute;
    muteBtns.forEach(function (btn) {
      btn.innerHTML = iconHtml;
      btn.setAttribute('title', video.muted ? 'Bật âm thanh' : 'Tắt âm thanh');
    });
  }

  // --- Smart Intersection Observer for In-View Autoplay ---
  let videoObserver = null;
  function getObserver() {
    if (!videoObserver && window.IntersectionObserver) {
      videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          const wrapper = entry.target;
          const video = wrapper.querySelector('video');
          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            if (wrapper.dataset.userPaused !== 'true') {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch(function () {});
              }
              wrapper.classList.remove('is-paused');
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      }, { threshold: [0, 0.2, 0.5] });
    }
    return videoObserver;
  }

  // --- Initialize Single Video Wrapper ---
  function initVideoWrapper(wrapper) {
    if (wrapper.dataset.initialized === 'true') return;
    wrapper.dataset.initialized = 'true';

    const video = wrapper.querySelector('video');
    if (!video) return;

    const obs = getObserver();
    if (obs) obs.observe(wrapper);

    updateMuteState(wrapper, video);

    video.addEventListener('loadeddata', function () {
      video.style.opacity = '1';
    });
    if (video.readyState >= 2) {
      video.style.opacity = '1';
    }

    const fill = wrapper.querySelector('.w-video-progress-fill');
    const timeEl = wrapper.querySelector('.w-video-time');
    video.addEventListener('timeupdate', function () {
      if (video.duration) {
        const pct = (video.currentTime / video.duration) * 100;
        if (fill) fill.style.width = pct + '%';
        if (timeEl) {
          timeEl.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
        }
      }
    });

    video.addEventListener('play', function () {
      updatePlayState(wrapper, video);
    });
    video.addEventListener('pause', function () {
      updatePlayState(wrapper, video);
    });

    let hideTimer = null;
    function resetHideControls() {
      wrapper.classList.add('show-controls');
      clearTimeout(hideTimer);
      if (!video.paused) {
        hideTimer = setTimeout(function () {
          wrapper.classList.remove('show-controls');
        }, 2200);
      }
    }

    wrapper.addEventListener('mousemove', resetHideControls);
    wrapper.addEventListener('touchstart', function () {
      if (wrapper.classList.contains('show-controls')) {
        wrapper.classList.remove('show-controls');
      } else {
        resetHideControls();
      }
    }, { passive: true });
    wrapper.addEventListener('mouseleave', function () {
      clearTimeout(hideTimer);
      if (!video.paused) {
        wrapper.classList.remove('show-controls');
      }
    });
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
