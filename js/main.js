// ===== GLOBALS =====
const panelsContainer = document.getElementById('tabPanels');
let activeObserver = null;

// ===== Deck Passcode Gate =====
const DECK_PASSCODE = 'Javinsdeepcases22@';

(function () {
  const modal    = document.getElementById('deck-modal');
  const card     = modal.querySelector('.deck-modal__card');
  const input    = document.getElementById('deck-passcode-input');
  const unlockBtn = document.getElementById('deck-unlock-btn');
  const errorMsg = document.getElementById('deck-modal-error');
  let targetUrl  = null;

  function openModal(url) {
    targetUrl = url;
    input.value = '';
    errorMsg.classList.remove('error--visible');
    card.classList.remove('card--shake');
    modal.classList.add('modal--open');
    setTimeout(() => input.focus(), 50);
  }

  function closeModal() {
    modal.classList.remove('modal--open');
    targetUrl = null;
  }

  function tryUnlock() {
    if (input.value === DECK_PASSCODE) {
      const url = targetUrl;
      closeModal();
      setTimeout(() => window.open(url, '_blank', 'noopener'), 220);
    } else {
      card.classList.remove('card--shake');
      void card.offsetWidth;
      card.classList.add('card--shake');
      errorMsg.classList.add('error--visible');
      input.value = '';
      input.focus();
      card.addEventListener('animationend', () => {
        card.classList.remove('card--shake');
      }, { once: true });
    }
  }

  unlockBtn.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.querySelectorAll('.deck-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(btn.dataset.url);
    });
  });
})();

// Shared cursor speed state (written by cursor tracker, read by speed widget)
let cursorTargetSpeed = 0;
let cursorSpeedResetTimer = null;
let speedEnabled = true;

// ===== CUSTOM CURSOR + SNOW TRAIL + SPEED TRACKING =====
(function () {
  if (window.innerWidth < 768 || navigator.maxTouchPoints > 0) return;
  const cursor = document.getElementById('custom-cursor');
  let lastX = null, lastY = null, lastMoveTime = 0;
  let trailLastX = null, trailLastY = null;
  const MIN_TRAIL_DIST = 6;

  document.addEventListener('mousemove', (e) => {
    const x = e.clientX, y = e.clientY;
    const now = Date.now();

    // Update cursor position
    cursor.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%)) rotate(-35deg)`;

    // Snow trail
    if (trailLastX === null || Math.hypot(x - trailLastX, y - trailLastY) >= MIN_TRAIL_DIST) {
      spawnTrail(x, y);
      trailLastX = x; trailLastY = y;
    }

    // Cursor speed → speedometer
    if (lastX !== null) {
      const dx = x - lastX, dy = y - lastY;
      const dt = Math.max(now - lastMoveTime, 1);
      const pxPerSec = Math.sqrt(dx * dx + dy * dy) / dt * 1000;
      cursorTargetSpeed = Math.min(Math.round(pxPerSec * 0.06), 99);
    }
    lastX = x; lastY = y; lastMoveTime = now;

    clearTimeout(cursorSpeedResetTimer);
    cursorSpeedResetTimer = setTimeout(() => { cursorTargetSpeed = 0; }, 300);
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    cursorTargetSpeed = 0;
  });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });

  function spawnTrail(x, y) {
    const p = document.createElement('div');
    p.className = 'cursor-trail';
    const size = Math.random() * 3 + 2;
    p.style.cssText = [
      `width:${size}px`, `height:${size}px`,
      `left:${x + (Math.random() - 0.5) * 8}px`,
      `top:${y  + (Math.random() - 0.5) * 8}px`,
    ].join(';');
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
})();

// ===== FALLING SNOW =====
(function () {
  const container = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const flake = document.createElement('div');
    flake.className = 'star';
    const size  = Math.random() * 3 + 1;
    const x     = Math.random() * 100;
    const dur   = Math.random() * 14 + 10;
    const del   = Math.random() * -24;
    const drift = (Math.random() - 0.5) * 60;
    flake.style.cssText = [
      `width:${size}px`, `height:${size}px`,
      `left:${x}%`, `top:-${size}px`,
      `--drift:${drift}px`,
      `animation-duration:${dur}s`,
      `animation-delay:${del}s`,
    ].join(';');
    container.appendChild(flake);
  }
})();

// ===== SPEED WIDGET (cursor-movement based) =====
(function () {
  const arcEl = document.getElementById('speedArc');
  const numEl = document.getElementById('speedVal');
  const toggle = document.getElementById('speedToggle');
  if (!arcEl || !numEl) return;

  if (toggle) {
    toggle.addEventListener('change', () => {
      speedEnabled = toggle.checked;
      if (!speedEnabled) cursorTargetSpeed = 0;
    });
  }

  const ARC_LEN = 101;
  let currentSpeed = 0;
  let rafId = null;

  function animate() {
    const target = speedEnabled ? cursorTargetSpeed : 0;
    const diff = target - currentSpeed;
    currentSpeed += diff * 0.18;

    const val  = Math.round(currentSpeed);
    const fill = (currentSpeed / 99) * ARC_LEN;
    numEl.textContent = val;
    arcEl.setAttribute('stroke-dasharray', `${fill.toFixed(1)} ${(ARC_LEN - fill + 20).toFixed(1)}`);

    if (Math.abs(diff) > 0.3) {
      rafId = requestAnimationFrame(animate);
    } else {
      currentSpeed = target;
      rafId = null;
    }
  }

  function tick() {
    const target = speedEnabled ? cursorTargetSpeed : 0;
    const diff = target - currentSpeed;
    if (Math.abs(diff) > 0.3) {
      if (!rafId) animate();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

// ===== SCROLL-REVEAL =====
function setupAnimations(panel) {
  if (activeObserver) activeObserver.disconnect();

  const items = panel.querySelectorAll('.anim-item');
  items.forEach((el, i) => {
    el.classList.remove('anim-visible');
    el.style.transitionDelay = `${Math.min(i, 6) * 75}ms`;
  });

  activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('anim-visible');
          activeObserver.unobserve(entry.target);
        }
      });
    },
    { root: panelsContainer, threshold: 0.06, rootMargin: '0px 0px -20px 0px' }
  );

  items.forEach((el) => activeObserver.observe(el));
}

// ===== MOBILE TAP-TO-REVEAL (project cards) =====
(function () {
  document.querySelectorAll('.proj-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (window.innerWidth >= 768) return;
      if (e.target.closest('.proj-card__link') || e.target.closest('.proj-card__name')) return;
      const isOpen = card.classList.contains('touched');
      document.querySelectorAll('.proj-card').forEach((c) => c.classList.remove('touched'));
      if (!isOpen) card.classList.add('touched');
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.proj-card')) {
      document.querySelectorAll('.proj-card').forEach((c) => c.classList.remove('touched'));
    }
  });
})();

// ===== TRAIL ITEM DROPDOWNS =====
document.querySelectorAll('.trail-item__header').forEach((header) => {
  header.addEventListener('click', () => {
    header.closest('.trail-item').classList.toggle('trail-item--open');
  });
});

// ===== MISC ITEM DROPDOWNS =====
document.querySelectorAll('.misc-item__header').forEach((header) => {
  header.addEventListener('click', () => {
    header.closest('.misc-item').classList.toggle('misc-item--open');
  });
});

// ===== LOADER =====
(function () {
  const loader = document.getElementById('loader');
  setTimeout(() => { loader.classList.add('loader--done'); }, 1450);
  setTimeout(() => {
    loader.style.display = 'none';
    const initial = document.querySelector('.tab-panel.active');
    if (initial) setupAnimations(initial);
  }, 1980);
})();

// ===== TAB SWITCHING =====
(function () {
  const btns = document.querySelectorAll('.tab-btn');
  let switching = false;

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (switching) return;

      const targetId     = btn.dataset.tab;
      const currentPanel = document.querySelector('.tab-panel.active');
      const nextPanel    = document.getElementById('tab-' + targetId);
      if (currentPanel === nextPanel) return;

      switching = true;
      btns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      currentPanel.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      currentPanel.style.opacity    = '0';
      currentPanel.style.transform  = 'translateY(-8px)';

      setTimeout(() => {
        currentPanel.classList.remove('active');
        currentPanel.style.cssText = '';

        nextPanel.classList.add('active');
        nextPanel.classList.add('panel-entering');
        nextPanel.addEventListener('animationend', () => {
          nextPanel.classList.remove('panel-entering');
        }, { once: true });

        panelsContainer.scrollTop = 0;
        setupAnimations(nextPanel);
        switching = false;
      }, 165);
    });
  });
})();
