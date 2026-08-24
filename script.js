/* ============================================================
   SCRIPT.JS — Presentation Interactivity & Animations
   ============================================================ */

"use strict";

// ─── STATE ───────────────────────────────────────────────────
let currentSlide = 0;
const TOTAL_SLIDES = 8;
let isAnimating = false;
let hintHidden = false;

// ─── DOM REFS ─────────────────────────────────────────────────
const slides    = document.querySelectorAll('.slide');
const dots      = document.querySelectorAll('.dot');
const navCurrent= document.getElementById('navCurrent');
const progressFill = document.getElementById('progressFill');
const keyboardHint = document.getElementById('keyboardHint');

// ─── INIT ─────────────────────────────────────────────────────
function init() {
  slides[0].classList.add('active');
  updateNav(0);
  setTimeout(() => keyboardHint.classList.add('hidden'), 4000);
}

// ─── NAVIGATION ───────────────────────────────────────────────
function goToSlide(index) {
  if (isAnimating || index === currentSlide) return;
  if (index < 0 || index >= TOTAL_SLIDES) return;

  isAnimating = true;

  const prev = currentSlide;
  const next = index;
  const dir  = next > prev ? 1 : -1;

  // Animate out current
  const outSlide = slides[prev];
  outSlide.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  outSlide.style.opacity    = '0';
  outSlide.style.transform  = dir > 0 ? 'translateX(-60px)' : 'translateX(60px)';

  setTimeout(() => {
    outSlide.classList.remove('active');
    outSlide.style.opacity   = '';
    outSlide.style.transform = '';
    outSlide.style.transition= '';

    // Reset scroll
    outSlide.scrollTop = 0;

    // Reset animated children
    const children = outSlide.querySelectorAll('.fade-up, .fade-in');
    children.forEach(el => {
      el.style.transition = 'none';
      el.style.opacity = '0';
      el.style.transform = el.classList.contains('fade-up') ? 'translateY(24px)' : '';
    });

    // Animate in next
    const inSlide = slides[next];
    inSlide.style.opacity    = '0';
    inSlide.style.transform  = dir > 0 ? 'translateX(60px)' : 'translateX(-60px)';
    inSlide.classList.add('active');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inSlide.style.transition = 'opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)';
        inSlide.style.opacity    = '1';
        inSlide.style.transform  = 'translateX(0)';

        // Trigger children animations
        const inChildren = inSlide.querySelectorAll('.fade-up, .fade-in');
        inChildren.forEach(el => {
          el.style.transition = '';
        });

        setTimeout(() => {
          inSlide.style.transition = '';
          inSlide.style.opacity    = '';
          inSlide.style.transform  = '';
          currentSlide = next;
          updateNav(next);
          isAnimating = false;
        }, 520);
      });
    });
  }, 400);

  // Hide keyboard hint after first navigation
  if (!hintHidden) {
    hintHidden = true;
    keyboardHint.classList.add('hidden');
  }
}

function changeSlide(delta) {
  goToSlide(currentSlide + delta);
}

function updateNav(index) {
  // Update counter
  navCurrent.textContent = index + 1;

  // Update progress bar
  const pct = ((index + 1) / TOTAL_SLIDES) * 100;
  progressFill.style.width = pct + '%';

  // Update dots
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  // Update prev/next buttons visibility
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  prevBtn.style.opacity = index === 0 ? '0.4' : '1';
  nextBtn.style.opacity = index === TOTAL_SLIDES - 1 ? '0.4' : '1';
}

// ─── KEYBOARD NAVIGATION ──────────────────────────────────────
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case ' ':
    case 'PageDown':
      e.preventDefault();
      changeSlide(1);
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      e.preventDefault();
      changeSlide(-1);
      break;
    case 'Home':
      e.preventDefault();
      goToSlide(0);
      break;
    case 'End':
      e.preventDefault();
      goToSlide(TOTAL_SLIDES - 1);
      break;
  }
});

// ─── TOUCH / SWIPE ────────────────────────────────────────────
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    changeSlide(dx < 0 ? 1 : -1);
  }
}, { passive: true });

// ─── WHEEL NAVIGATION ─────────────────────────────────────────
let wheelCooldown = false;

document.addEventListener('wheel', (e) => {
  // Only intercept if the slide isn't scrollable
  const activeSlide = slides[currentSlide];
  const atBottom = activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 5;
  const atTop    = activeSlide.scrollTop <= 5;

  if (wheelCooldown) return;
  if (Math.abs(e.deltaY) < 30) return;

  if (e.deltaY > 0 && atBottom) {
    wheelCooldown = true;
    changeSlide(1);
    setTimeout(() => { wheelCooldown = false; }, 800);
  } else if (e.deltaY < 0 && atTop) {
    wheelCooldown = true;
    changeSlide(-1);
    setTimeout(() => { wheelCooldown = false; }, 800);
  }
}, { passive: true });

// ─── ANIMATED TIMELINE LINE DRAW ──────────────────────────────
function animateTimelineLine() {
  const line = document.querySelector('.timeline-line');
  if (!line) return;
  line.style.height = '0';
  line.style.transition = 'height 1.5s ease';
  setTimeout(() => {
    const tl = document.querySelector('.timeline-container');
    if (tl) line.style.height = tl.scrollHeight + 'px';
  }, 100);
}

// ─── INTERSECTION OBSERVER for timeline ───────────────────────
function setupObservers() {
  // When slide 2 (timeline) becomes active, animate the line
  const timelineSlide = document.getElementById('slide-1');
  if (!timelineSlide) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.target.classList.contains('active')) {
        setTimeout(animateTimelineLine, 300);
      }
    });
  });

  observer.observe(timelineSlide, { attributes: true, attributeFilter: ['class'] });
}

// ─── STATS COUNTER ANIMATION ──────────────────────────────────
function animateCounters() {
  const stats = document.querySelectorAll('.stat-num');
  stats.forEach(el => {
    const text = el.textContent;
    if (/^\d+$/.test(text)) {
      const target = parseInt(text, 10);
      let current = 0;
      const step = Math.ceil(target / 30);
      const interval = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(interval);
      }, 40);
    }
  });
}

// Watch for cover slide activation
const coverSlide = document.getElementById('slide-0');
if (coverSlide) {
  const coverObserver = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.target.classList.contains('active')) {
        setTimeout(animateCounters, 800);
      }
    });
  });
  coverObserver.observe(coverSlide, { attributes: true, attributeFilter: ['class'] });
}

// ─── LESSON CARD HOVER EFFECTS ────────────────────────────────
function setupLessonCards() {
  const cards = document.querySelectorAll('.lesson-card');
  const colors = [
    'var(--burgundy)',
    'var(--teal)',
    'var(--navy)',
    'var(--orange)',
    'var(--gold)',
    'var(--burgundy-light)'
  ];
  cards.forEach((card, i) => {
    card.style.borderTop = `4px solid ${colors[i % colors.length]}`;
  });
}

// ─── ANIMATED BACKGROUND PARTICLES ───────────────────────────
function createParticle(slide) {
  if (!slide) return;
  const p = document.createElement('div');
  p.style.cssText = `
    position: absolute;
    width: ${Math.random() * 4 + 2}px;
    height: ${Math.random() * 4 + 2}px;
    background: rgba(139,26,44,${Math.random() * 0.06 + 0.02});
    border-radius: 50%;
    left: ${Math.random() * 100}%;
    top: ${Math.random() * 100}%;
    pointer-events: none;
    animation: float ${Math.random() * 8 + 6}s ease-in-out infinite alternate;
    z-index: 0;
  `;
  slide.appendChild(p);
}

// Add CSS keyframes for float
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%   { transform: translateY(0px) translateX(0px); opacity: 0.4; }
    100% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
  }

  @keyframes pulse-ring {
    0%   { transform: scale(1); opacity: 0.5; }
    50%  { transform: scale(1.08); opacity: 0.3; }
    100% { transform: scale(1); opacity: 0.5; }
  }

  .breakdown-hub {
    animation: pulse-ring 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .progress-bar-fill {
    background-size: 200% auto;
    background-image: linear-gradient(90deg, var(--burgundy) 0%, var(--gold) 50%, var(--burgundy) 100%);
    animation: shimmer 3s linear infinite;
  }

  @keyframes draw-line {
    from { width: 0; }
    to   { width: 100%; }
  }

  .cover-rule {
    animation: draw-line 0.8s ease 0.6s both;
  }

  .dg-monogram {
    animation: none;
    transition: transform 0.3s ease;
  }

  .cover-visual-card:hover .dg-monogram {
    transform: scale(1.05);
  }
`;
document.head.appendChild(style);

// Add particles to cover slide
setTimeout(() => {
  const cover = document.getElementById('slide-0');
  if (cover) {
    for (let i = 0; i < 8; i++) createParticle(cover);
  }
}, 100);

// ─── CARD RIPPLE EFFECT ───────────────────────────────────────
document.querySelectorAll('.lesson-card, .camp-card, .cons-card, .tl-card').forEach(card => {
  card.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${e.clientX - rect.left - size/2}px;
      top: ${e.clientY - rect.top - size/2}px;
      background: rgba(139,26,44,0.08);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-effect 0.5s ease-out forwards;
      pointer-events: none;
      z-index: 1;
    `;
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
});

const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple-effect {
    from { transform: scale(0); opacity: 1; }
    to   { transform: scale(2); opacity: 0; }
  }
`;
document.head.appendChild(rippleStyle);

// ─── BOOT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupObservers();
  setupLessonCards();

  // Trigger counter animation on first load
  setTimeout(animateCounters, 1000);
});
