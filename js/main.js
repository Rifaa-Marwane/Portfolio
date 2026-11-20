(() => {
  const LANG = document.documentElement.lang === 'en' ? 'en' : 'fr';
  const PROJECTS = window.PORTFOLIO_PROJECTS || [];

  let activeFilter = 'all';
  let activeProject = null;
  let activeImageIndex = 0;

  // ══ 1. HERO SLIDING IMAGES (AUTO-PAUSED WHEN OFFSCREEN / HIDDEN) ══
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroDots = Array.from(document.querySelectorAll('.hero-dot'));
  let heroIndex = 0;
  let heroTimer = null;
  let heroVisible = true;

  function setHeroSlide(nextIdx) {
    if (!heroSlides.length) return;
    heroIndex = (nextIdx + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === heroIndex));
    heroDots.forEach((dot, i) => {
      dot.className = i === heroIndex
        ? 'hero-dot w-7 h-1.5 rounded-full bg-gold transition-all'
        : 'hero-dot w-2.5 h-1.5 rounded-full bg-ivory/35 hover:bg-ivory/60 transition-all';
    });
  }

  function startHeroSlider() {
    stopHeroSlider();
    if (heroSlides.length < 2 || !heroVisible || document.hidden) return;
    heroTimer = setInterval(() => setHeroSlide(heroIndex + 1), 5000);
  }

  function stopHeroSlider() {
    if (heroTimer) {
      clearInterval(heroTimer);
      heroTimer = null;
    }
  }

  heroDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      setHeroSlide(i);
      startHeroSlider();
    });
  });

  const heroPrevBtn = document.getElementById('heroPrevBtn');
  const heroNextBtn = document.getElementById('heroNextBtn');
  if (heroPrevBtn) heroPrevBtn.addEventListener('click', () => { setHeroSlide(heroIndex - 1); startHeroSlider(); });
  if (heroNextBtn) heroNextBtn.addEventListener('click', () => { setHeroSlide(heroIndex + 1); startHeroSlider(); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopHeroSlider();
    else startHeroSlider();
  });

  // ══ 2. INTERSECTION-GATED BLUEPRINT CANVAS (ZERO OFFSCREEN CPU USAGE) ══
  const canvas = document.getElementById('heroCanvas');
  const heroEl = document.getElementById('hero');
  let ctx = canvas ? canvas.getContext('2d') : null;
  let cw = 0, ch = 0, points = [], pointerX = -999, pointerY = -999, rafId = null;

  function initCanvas() {
    if (!canvas) return;
    cw = canvas.width = canvas.offsetWidth;
    ch = canvas.height = canvas.offsetHeight;
    points = [];
    const step = window.innerWidth < 640 ? 96 : 76;
    for (let x = 0; x <= cw; x += step) {
      for (let y = 0; y <= ch; y += step) {
        points.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
      }
    }
  }

  function tickCanvas() {
    if (!ctx || !heroVisible || document.hidden) {
      rafId = null;
      return;
    }
    ctx.clearRect(0, 0, cw, ch);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dx = pointerX - p.x;
      const dy = pointerY - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 100) {
        const force = (100 - dist) / 100;
        p.vx += (-dx / dist) * force * 0.4;
        p.vy += (-dy / dist) * force * 0.4;
      }
      p.vx += (p.ox - p.x) * 0.05;
      p.vy += (p.oy - p.y) * 0.05;
      p.vx *= 0.84;
      p.vy *= 0.84;
      p.x += p.vx;
      p.y += p.vy;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 169, 126, 0.22)';
      ctx.fill();
    }
    rafId = requestAnimationFrame(tickCanvas);
  }

  function startCanvas() {
    if (!rafId && heroVisible && !document.hidden) {
      rafId = requestAnimationFrame(tickCanvas);
    }
  }

  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) {
        startCanvas();
        startHeroSlider();
      } else {
        stopHeroSlider();
      }
    }, { threshold: 0.05 }).observe(heroEl);
  }

  window.addEventListener('mousemove', (e) => { pointerX = e.clientX; pointerY = e.clientY; }, { passive: true });
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initCanvas, 150);
  }, { passive: true });

  // ══ 3. NAVBAR & MOBILE DRAWER ══
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    const scrolled = window.scrollY > 40;
    navbar.classList.toggle('bg-obsidian/90', scrolled);
    navbar.classList.toggle('backdrop-blur-xl', scrolled);
    navbar.classList.toggle('border-hairline', scrolled);
    navbar.classList.toggle('border-transparent', !scrolled);
  }, { passive: true });

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const menuIconOpen = document.getElementById('menuIconOpen');
  const menuIconClose = document.getElementById('menuIconClose');

  function toggleMobileMenu(forceClose = false) {
    if (!mobileDrawer) return;
    const shouldOpen = forceClose ? false : mobileDrawer.classList.contains('hidden');
    mobileDrawer.classList.toggle('hidden', !shouldOpen);
    if (menuIconOpen) menuIconOpen.classList.toggle('hidden', shouldOpen);
    if (menuIconClose) menuIconClose.classList.toggle('hidden', !shouldOpen);
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => toggleMobileMenu());
  document.querySelectorAll('.mobile-nav-link').forEach((link) => {
    link.addEventListener('click', () => toggleMobileMenu(true));
  });

  // ══ 4. ORGANIZED PROJECT GRID & FILTER ══
  function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    const filtered = activeFilter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === activeFilter);

    grid.innerHTML = filtered.map((p) => {
      const title = LANG === 'fr' ? p.titleFr : p.titleEn;
      const type = LANG === 'fr' ? p.typeFr : p.typeEn;
      const countLabel = LANG === 'fr' ? `${p.images.length} images ↗` : `${p.images.length} photos ↗`;
      return `
        <article data-project-id="${p.id}" class="project-card group bg-card border border-hairline hover:border-goldDim rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col">
          <div class="relative aspect-[4/3] overflow-hidden bg-obsidian">
            <img src="${p.images[0].src}" alt="${title}" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent"></div>
            <span class="absolute top-3 right-3 bg-obsidian/75 backdrop-blur-md border border-hairline group-hover:border-gold text-ivory group-hover:text-gold font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors">${countLabel}</span>
            <span class="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-gold bg-obsidian/70 backdrop-blur-sm px-2 py-0.5 rounded">${p.phases}</span>
          </div>
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="font-mono text-[10px] uppercase tracking-widest text-goldDim mb-1">${type} · ${p.location}</div>
              <h3 class="font-display text-2xl tracking-wide text-ivory group-hover:text-gold transition-colors">${title}</h3>
            </div>
            <div class="mt-4 pt-3 border-t border-hairline flex items-center justify-between font-mono text-[11px] text-stone">
              <span>${p.scale}</span>
              <span class="text-gold group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  const projectsGrid = document.getElementById('projectsGrid');
  if (projectsGrid) {
    projectsGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.project-card');
      if (card) openProject(card.dataset.projectId);
    });
  }

  const projectFilters = document.getElementById('projectFilters');
  if (projectFilters) {
    projectFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      activeFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach((b) => {
        const isAct = b === btn;
        b.className = isAct
          ? 'filter-btn active px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider bg-gold text-obsidian font-medium transition-all'
          : 'filter-btn px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider bg-card text-stone border border-hairline hover:border-goldDim hover:text-ivory transition-all';
      });
      renderProjects();
    });
  }

  // ══ 5. PROJECT DETAIL MODAL & MULTI-IMAGE GALLERY (PRELOADED) ══
  function preloadGalleryImages(images) {
    images.forEach((item) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = item.src;
    });
  }

  function openProject(projectId) {
    activeProject = PROJECTS.find((p) => p.id === projectId);
    if (!activeProject) return;
    activeImageIndex = 0;
    preloadGalleryImages(activeProject.images);
    updateModalContent();
    const modal = document.getElementById('projectModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  function updateModalContent() {
    if (!activeProject) return;
    const p = activeProject;
    document.getElementById('modalCategory').textContent = LANG === 'fr' ? p.typeFr : p.typeEn;
    document.getElementById('modalTitle').textContent = LANG === 'fr' ? p.titleFr : p.titleEn;
    document.getElementById('modalLocation').textContent = p.location;
    document.getElementById('modalDesc').textContent = LANG === 'fr' ? p.descFr : p.descEn;
    document.getElementById('modalPhases').textContent = p.phases;
    document.getElementById('modalScale').textContent = p.scale;
    document.getElementById('modalTools').innerHTML = p.tools.map((t) =>
      `<span class="font-mono text-[10px] uppercase tracking-wider text-ivory bg-card border border-hairline px-2.5 py-1 rounded-md">${t}</span>`
    ).join('');
    updateGallerySlide();
  }

  function updateGallerySlide() {
    if (!activeProject) return;
    const imgs = activeProject.images;
    const item = imgs[activeImageIndex];
    const cap = LANG === 'fr' ? item.capFr : item.capEn;
    const mainImg = document.getElementById('modalMainImg');
    mainImg.src = item.src;
    mainImg.alt = cap;
    document.getElementById('modalImgCaption').textContent = cap;
    document.getElementById('modalImgCounter').textContent = `${String(activeImageIndex + 1).padStart(2, '0')} / ${String(imgs.length).padStart(2, '0')}`;

    const thumbsEl = document.getElementById('modalThumbnails');
    thumbsEl.innerHTML = imgs.map((img, idx) => `
      <button type="button" data-idx="${idx}" class="thumb-btn relative w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${idx === activeImageIndex ? 'border-gold opacity-100' : 'border-transparent opacity-50 hover:opacity-85'}">
        <img src="${img.src}" alt="" loading="lazy" decoding="async" class="w-full h-full object-cover" />
      </button>
    `).join('');
  }

  function stepGallery(delta) {
    if (!activeProject) return;
    const len = activeProject.images.length;
    activeImageIndex = (activeImageIndex + delta + len) % len;
    updateGallerySlide();
  }

  const thumbsContainer = document.getElementById('modalThumbnails');
  if (thumbsContainer) {
    thumbsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.thumb-btn');
      if (!btn) return;
      activeImageIndex = Number(btn.dataset.idx);
      updateGallerySlide();
    });
  }

  const closeModalBtn = document.getElementById('closeModalBtn');
  const prevImgBtn = document.getElementById('prevImgBtn');
  const nextImgBtn = document.getElementById('nextImgBtn');
  const projectModal = document.getElementById('projectModal');

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeProjectModal);
  if (prevImgBtn) prevImgBtn.addEventListener('click', () => stepGallery(-1));
  if (nextImgBtn) nextImgBtn.addEventListener('click', () => stepGallery(1));
  if (projectModal) projectModal.addEventListener('click', (e) => { if (e.target.id === 'projectModal') closeProjectModal(); });

  document.addEventListener('keydown', (e) => {
    if (!projectModal || projectModal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeProjectModal();
    if (e.key === 'ArrowLeft') stepGallery(-1);
    if (e.key === 'ArrowRight') stepGallery(1);
  });

  const stage = document.getElementById('galleryStage');
  if (stage) {
    let touchStartX = 0;
    stage.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 40) stepGallery(diff < 0 ? 1 : -1);
    }, { passive: true });
  }

  const modalQuoteBtn = document.getElementById('modalQuoteBtn');
  if (modalQuoteBtn) {
    modalQuoteBtn.addEventListener('click', () => {
      if (!activeProject) return;
      const pTitle = LANG === 'fr' ? activeProject.titleFr : activeProject.titleEn;
      document.getElementById('formDesc').value = `${LANG === 'fr' ? 'Projet similaire à' : 'Project similar to'}: ${pTitle} (${activeProject.phases})`;
      closeProjectModal();
      document.getElementById('request').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ══ 6. CAREER TABS & REQUEST FORM ══
  const tabExp = document.getElementById('tabExp');
  const tabSkills = document.getElementById('tabSkills');
  const panelExp = document.getElementById('panelExp');
  const panelSkills = document.getElementById('panelSkills');

  if (tabExp && tabSkills) {
    tabExp.addEventListener('click', () => {
      panelExp.classList.remove('hidden');
      panelSkills.classList.add('hidden');
      tabExp.className = 'career-tab px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider bg-gold text-obsidian font-medium transition-all';
      tabSkills.className = 'career-tab px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider text-stone hover:text-ivory transition-all';
    });
    tabSkills.addEventListener('click', () => {
      panelSkills.classList.remove('hidden');
      panelExp.classList.add('hidden');
      tabSkills.className = 'career-tab px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider bg-gold text-obsidian font-medium transition-all';
      tabExp.className = 'career-tab px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider text-stone hover:text-ivory transition-all';
    });
  }

  let selectedProjectType = 'Villa';
  const typeSelector = document.getElementById('typeSelector');
  if (typeSelector) {
    typeSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.type-btn');
      if (!btn) return;
      selectedProjectType = btn.dataset.type;
      const hiddenType = document.getElementById('formProjectType');
      if (hiddenType) hiddenType.value = selectedProjectType;
      document.querySelectorAll('.type-btn').forEach((b) => {
        const active = b === btn;
        b.className = active
          ? 'type-btn active bg-gold/10 border border-gold text-gold rounded-xl p-3 text-center transition-all'
          : 'type-btn bg-card border border-hairline text-stone hover:text-ivory rounded-xl p-3 text-center transition-all';
      });
    });
  }

  const requestForm = document.getElementById('requestForm');
  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('formName').value.trim();
      const contact = document.getElementById('formContact').value.trim();
      const role = document.getElementById('formRole').value;
      const phase = document.getElementById('formPhase').value;
      const desc = document.getElementById('formDesc').value.trim();
      const hiddenType = document.getElementById('formProjectType');
      if (hiddenType) hiddenType.value = selectedProjectType;

      // Submit to Netlify Forms when hosted over http(s)
      if (window.location.protocol.startsWith('http')) {
        try {
          const encoded = new URLSearchParams(new FormData(requestForm)).toString();
          await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: encoded
          });
        } catch (err) {
          // Fall back gracefully to the WhatsApp button if offline or non-Netlify host
        }
      }

      document.getElementById('formSummaryText').textContent = LANG === 'fr'
        ? `Merci ${name}. Votre demande (${selectedProjectType} · ${phase}) a bien été enregistrée. Vous pouvez aussi me contacter directement sur WhatsApp.`
        : `Thank you ${name}. Your request (${selectedProjectType} · ${phase}) has been recorded. You can also reach out directly on WhatsApp.`;

      const waMsg = encodeURIComponent(`Bonjour Marwane, je suis ${name} (${role}). Projet: ${selectedProjectType} | Phase: ${phase} | Contact: ${contact}. ${desc}`);
      document.getElementById('whatsappLaunch').href = `https://wa.me/212602152534?text=${waMsg}`;

      requestForm.classList.add('hidden');
      document.getElementById('formSuccess').classList.remove('hidden');
    });
  }

  const resetFormBtn = document.getElementById('resetFormBtn');
  if (resetFormBtn && requestForm) {
    resetFormBtn.addEventListener('click', () => {
      requestForm.reset();
      document.getElementById('formSuccess').classList.add('hidden');
      requestForm.classList.remove('hidden');
    });
  }

  // ══ 7. SCROLL REVEAL ══
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
  }

  // ══ INIT ══
  renderProjects();
  initCanvas();
  startCanvas();
  startHeroSlider();
})();
