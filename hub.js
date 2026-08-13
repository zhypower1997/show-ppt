(() => {
  const list = document.getElementById('deckList');
  if (!list || location.protocol === 'file:') return;

  fetch('./decks.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load deck registry: ${response.status}`);
      return response.json();
    })
    .then(({ decks }) => {
      if (!Array.isArray(decks) || decks.length === 0) return;
      const fragment = document.createDocumentFragment();
      decks.forEach((deck, index) => {
        const link = document.createElement('a');
        link.className = `deck-entry${deck.featured ? ' featured' : ''}`;
        link.href = deck.path;

        const number = document.createElement('b');
        number.className = 'entry-no';
        number.textContent = String(index + 1).padStart(2, '0');

        const path = document.createElement('code');
        path.textContent = deck.path;

        const title = document.createElement('span');
        title.className = 'entry-title';
        title.textContent = deck.title;

        const summary = document.createElement('span');
        summary.className = 'entry-summary';
        summary.textContent = deck.summary;

        const count = document.createElement('small');
        count.textContent = `${deck.slides} 页`;

        const arrow = document.createElement('i');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '↗';

        link.append(number, path, title, summary, count, arrow);
        fragment.append(link);
      });
      list.replaceChildren(fragment);
    })
    .catch(() => {
      // Static fallback entries in index.html remain available.
    });
})();
