const DATA_URL = 'vla_research.json';
const THEME_STORAGE_KEY = 'vla-theme';

const elements = {
  results: document.getElementById('results'),
  resultCount: document.getElementById('result-count'),
  filterSummary: document.getElementById('filter-summary'),
  searchInput: document.getElementById('search'),
  yearFilter: document.getElementById('year-filter'),
  themeToggle: document.getElementById('theme-toggle'),
  entryTemplate: document.getElementById('entry-template'),
};

const state = {
  entries: [],
};

document.addEventListener('DOMContentLoaded', () => {
  initialiseTheme();
  attachEventListeners();
  loadEntries();
});

function attachEventListeners() {
  elements.searchInput.addEventListener('input', render);
  elements.yearFilter.addEventListener('change', render);
  elements.themeToggle.addEventListener('click', toggleTheme);
}

async function loadEntries() {
  setLoadingState();
  try {
    const response = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error('Unable to load research entries.');
    }
    const data = await response.json();
    state.entries = prepareEntries(data);
    populateYearFilter(state.entries);
    render();
  } catch (error) {
    showError(error.message);
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

function prepareEntries(rawEntries) {
  return rawEntries
    .map((entry) => {
      const yearValue = extractYear(entry.year);
      const lastReviewedValue = parseDate(entry.last_reviewed ?? entry.year);
      const searchIndex = buildSearchIndex(entry);
      return {
        ...entry,
        yearValue,
        lastReviewedValue,
        searchIndex,
      };
    })
    .sort((a, b) => (b.lastReviewedValue || 0) - (a.lastReviewedValue || 0));
}

function render() {
  if (!state.entries.length) {
    return;
  }

  const searchTerm = elements.searchInput.value.trim().toLowerCase();
  const selectedYear = elements.yearFilter.value;

  const filtered = state.entries.filter((entry) => {
    const matchesSearch = !searchTerm || entry.searchIndex.includes(searchTerm);
    const matchesYear = selectedYear === 'all' || entry.yearValue === Number.parseInt(selectedYear, 10);
    return matchesSearch && matchesYear;
  });

  updateResults(filtered);
  updateMeta(filtered.length, state.entries.length, searchTerm, selectedYear);
}

function updateResults(entries) {
  elements.results.innerHTML = '';
  elements.results.removeAttribute('aria-busy');

  if (!entries.length) {
    elements.results.innerHTML = '<div class="empty-state">No entries match the current filters.</div>';
    return;
  }

  const template = elements.entryTemplate.content;

  entries.forEach((entry) => {
    const fragment = template.cloneNode(true);
    const container = fragment.querySelector('.entry');
    const titleEl = fragment.querySelector('.entry-title');
    const metaEl = fragment.querySelector('.entry-meta');
    const summaryEl = fragment.querySelector('.entry-summary');
    const tagsEl = fragment.querySelector('.tag-list');
    const sourcesEl = fragment.querySelector('.sources');

    container.setAttribute('role', 'listitem');

    const primarySource = entry.sources.find((source) => source.type === 'paper') || entry.sources[0];

    if (primarySource) {
      const link = document.createElement('a');
      link.href = primarySource.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = entry.title;
      titleEl.append(link);
    } else {
      titleEl.textContent = entry.title;
    }

    metaEl.textContent = formatMeta(entry);
    summaryEl.textContent = entry.summary;

    entry.tags.forEach((tag) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-pill';
      tagEl.textContent = tag;
      tagsEl.append(tagEl);
    });

    entry.sources.forEach((source) => {
      const sourceLink = document.createElement('a');
      sourceLink.className = 'source-link';
      sourceLink.href = source.url;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';
      sourceLink.textContent = source.title;
      sourceLink.setAttribute('data-source-type', source.type);
      sourcesEl.append(sourceLink);
    });

    elements.results.append(fragment);
  });
}

function updateMeta(filteredCount, totalCount, searchTerm, selectedYear) {
  elements.resultCount.textContent = `Showing ${filteredCount} of ${totalCount} entries`;

  if (!searchTerm && (selectedYear === 'all' || !selectedYear)) {
    elements.filterSummary.textContent = 'Use search or the year filter to refine the catalog.';
    return;
  }

  const activeFilters = [];
  if (searchTerm) {
    activeFilters.push(`matching “${searchTerm}”`);
  }
  if (selectedYear !== 'all' && selectedYear) {
    activeFilters.push(`from ${selectedYear}`);
  }

  elements.filterSummary.textContent = `Filters: ${activeFilters.join(' and ')}`;
}

function populateYearFilter(entries) {
  const years = Array.from(new Set(entries.map((entry) => entry.yearValue).filter(Number.isFinite))).sort(
    (a, b) => b - a,
  );

  years.forEach((year) => {
    if (!elements.yearFilter.querySelector(`option[value="${year}"]`)) {
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = year;
      elements.yearFilter.append(option);
    }
  });
}

function setLoadingState() {
  elements.resultCount.textContent = 'Loading entries…';
  elements.filterSummary.textContent = '';
  elements.results.innerHTML = '';
  elements.results.setAttribute('aria-busy', 'true');
}

function showError(message) {
  elements.resultCount.textContent = '0 entries';
  elements.filterSummary.textContent = 'Unable to display results.';
  elements.results.innerHTML = `<div class="empty-state">${message}</div>`;
  elements.results.removeAttribute('aria-busy');
}

function formatMeta(entry) {
  const published = entry.year ? `Published ${entry.year}` : null;
  const lastReviewed = entry.last_reviewed ? `Last reviewed ${entry.last_reviewed}` : null;
  return [published, lastReviewed].filter(Boolean).join(' · ');
}

function buildSearchIndex(entry) {
  const fields = [entry.title, entry.summary, ...(entry.tags || [])];
  return fields.join(' ').toLowerCase();
}

function extractYear(yearString) {
  if (!yearString) return null;
  const match = yearString.match(/(19|20)\d{2}/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function parseDate(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function initialiseTheme() {
  const preferredTheme = loadStoredTheme() ?? systemTheme();
  applyTheme(preferredTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

function applyTheme(theme) {
  const isLight = theme === 'light';

  if (isLight) {
    document.documentElement.setAttribute('data-theme', 'light');
    elements.themeToggle.textContent = '🌞';
    elements.themeToggle.setAttribute('aria-label', 'Switch to dark theme');
  } else {
    document.documentElement.removeAttribute('data-theme');
    elements.themeToggle.textContent = '🌙';
    elements.themeToggle.setAttribute('aria-label', 'Switch to light theme');
  }

  elements.themeToggle.setAttribute('aria-pressed', String(isLight));
}

function loadStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function systemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
