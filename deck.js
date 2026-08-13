(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const shell = document.getElementById('deckShell');
  const progress = document.getElementById('progress');
  const currentPage = document.getElementById('currentPage');
  const totalPages = document.querySelector('.page-indicator > span');
  const announcer = document.getElementById('announcer');
  const notesPanel = document.getElementById('notesPanel');
  const notesContent = document.getElementById('notesContent');
  const overview = document.getElementById('overview');
  const overviewGrid = document.getElementById('overviewGrid');
  let current = 0;

  if (totalPages) totalPages.textContent = String(slides.length);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const pad = value => String(value).padStart(2, '0');

  function fitDeck() {
    const scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    document.documentElement.style.setProperty('--deck-scale', scale.toFixed(5));
  }

  function updateNotes() {
    const note = slides[current].querySelector('.speaker-note');
    notesContent.innerHTML = note ? note.innerHTML : '本页没有讲者提示。';
  }

  function updateOverview() {
    [...overviewGrid.children].forEach((card, index) => {
      card.setAttribute('aria-current', index === current ? 'true' : 'false');
    });
  }

  function syncSlideMedia() {
    document.querySelectorAll('video[data-slide-autoplay]').forEach(video => {
      const shouldPlay = slides[current].contains(video);
      if (shouldPlay) video.play().catch(() => {});
      else video.pause();
    });
  }

  function goTo(index, announce = true) {
    current = clamp(index, 0, slides.length - 1);
    slides.forEach((slide, slideIndex) => {
      const isCurrent = slideIndex === current;
      slide.classList.toggle('is-active', isCurrent);
      slide.setAttribute('aria-hidden', String(!isCurrent));
    });
    currentPage.textContent = pad(current + 1);
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    history.replaceState(null, '', `#slide-${current + 1}`);
    updateNotes();
    updateOverview();
    syncSlideMedia();
    if (announce) announcer.textContent = `第 ${current + 1} 页，共 ${slides.length} 页：${slides[current].dataset.title}`;
  }

  function move(delta) { goTo(current + delta); }

  function toggleNotes(force) {
    const nextState = typeof force === 'boolean' ? force : !notesPanel.classList.contains('is-open');
    notesPanel.classList.toggle('is-open', nextState);
    notesPanel.setAttribute('aria-hidden', String(!nextState));
    if (nextState) updateNotes();
  }

  function toggleOverview(force) {
    const nextState = typeof force === 'boolean' ? force : !overview.classList.contains('is-open');
    overview.classList.toggle('is-open', nextState);
    overview.setAttribute('aria-hidden', String(!nextState));
    if (nextState) updateOverview();
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      announcer.textContent = '当前浏览器不允许进入全屏。';
    }
  }

  slides.forEach((slide, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'overview-card';
    card.innerHTML = `<b>${pad(index + 1)}</b><span>${slide.dataset.title}</span>`;
    card.addEventListener('click', () => { goTo(index); toggleOverview(false); });
    overviewGrid.appendChild(card);
  });

  document.getElementById('prevBtn').addEventListener('click', () => move(-1));
  document.getElementById('nextBtn').addEventListener('click', () => move(1));
  document.getElementById('notesBtn').addEventListener('click', () => toggleNotes());
  document.getElementById('overviewBtn').addEventListener('click', () => toggleOverview());
  document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
  document.getElementById('closeNotes').addEventListener('click', () => toggleNotes(false));

  document.addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (['arrowright', 'pagedown', ' ', 'enter'].includes(key)) { event.preventDefault(); move(1); }
    else if (['arrowleft', 'pageup', 'backspace'].includes(key)) { event.preventDefault(); move(-1); }
    else if (key === 'home') { event.preventDefault(); goTo(0); }
    else if (key === 'end') { event.preventDefault(); goTo(slides.length - 1); }
    else if (key === 'n') { event.preventDefault(); toggleNotes(); }
    else if (key === 'o') { event.preventDefault(); toggleOverview(); }
    else if (key === 'f') { event.preventDefault(); toggleFullscreen(); }
    else if (key === 'escape') { toggleOverview(false); toggleNotes(false); }
  });

  let touchStartX = 0;
  document.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
  document.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 60) move(delta < 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener('resize', fitDeck, { passive: true });
  window.addEventListener('hashchange', () => {
    const match = location.hash.match(/slide-(\d+)/);
    if (match) goTo(Number(match[1]) - 1, false);
  });

  const params = new URLSearchParams(location.search);
  if (params.get('clean') === '1') document.body.classList.add('clean');
  const initial = location.hash.match(/slide-(\d+)/);
  fitDeck();
  goTo(initial ? Number(initial[1]) - 1 : 0, false);
})();
