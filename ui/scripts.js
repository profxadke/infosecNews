/**
 * INFOSEC NEWS // Real-Time Threat Intelligence & Cyber Security Radar
 * Client-side Controller & Interactive Engine
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Constants & Configuration
  // ---------------------------------------------------------------------------
  const PLACEHOLDER_IMAGES = [
    '0.jpg', '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg',
    '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg', '11.jpg',
    '12.jpg', '13.jpg', '14.jpg', '15.jpg', 'img_0.jpg', 'img_1.jpg',
    'img_2.jpg', 'img_3.jpg', 'I.jpg', 'II.jpg', 'III.jpg', 'IV.jpg'
  ];

  const KNOWN_SOURCES = {
    'darkreading.com': { name: 'Dark Reading', color: '#f43f5e', icon: 'fa-shield-halved' },
    'thehackernews.com': { name: 'The Hacker News', color: '#ef4444', icon: 'fa-user-ninja' },
    'bleepingcomputer.com': { name: 'BleepingComputer', color: '#f59e0b', icon: 'fa-laptop-code' },
    'krebsonsecurity.com': { name: 'Krebs on Security', color: '#06b6d4', icon: 'fa-user-secret' },
    'thecyberwire.com': { name: 'The CyberWire', color: '#38bdf8', icon: 'fa-satellite-dish' },
    'csoonline.com': { name: 'CSO Online', color: '#10b981', icon: 'fa-building-shield' },
    'securityweek.com': { name: 'SecurityWeek', color: '#a855f7', icon: 'fa-newspaper' },
    'schneier.com': { name: 'Bruce Schneier', color: '#8b5cf6', icon: 'fa-lock' },
    'itsecurityguru.org': { name: 'IT Security Guru', color: '#14b8a6', icon: 'fa-graduation-cap' },
    'helpnetsecurity.com': { name: 'Help Net Security', color: '#6366f1', icon: 'fa-shield-heart' },
    'threatpost.com': { name: 'Threatpost', color: '#ec4899', icon: 'fa-bullhorn' },
    'bitdefender.com': { name: 'Bitdefender Labs', color: '#e11d48', icon: 'fa-virus-slash' },
    'grahamcluley.com': { name: 'Graham Cluley', color: '#d97706', icon: 'fa-feather' },
    'sophos.com': { name: 'Sophos News', color: '#2563eb', icon: 'fa-shield-cat' },
    'gbhackers.com': { name: 'GBHackers', color: '#10b981', icon: 'fa-terminal' },
    'infosecurity-magazine.com': { name: 'Infosecurity Mag', color: '#0ea5e9', icon: 'fa-book-journal-whills' },
    'eset.com': { name: 'ESET WeLiveSecurity', color: '#059669', icon: 'fa-shield' },
    'quickheal.com': { name: 'Quick Heal', color: '#ea580c', icon: 'fa-bolt' },
    'trendmicro.com': { name: 'Trend Micro Research', color: '#dc2626', icon: 'fa-microscope' },
    'troyhunt.com': { name: 'Troy Hunt', color: '#0284c7', icon: 'fa-key' },
    'cisco.com': { name: 'Cisco Security', color: '#0284c7', icon: 'fa-network-wired' },
    'tripwire.com': { name: 'Tripwire State of Sec', color: '#4f46e5', icon: 'fa-route' },
    'fortra.com': { name: 'Fortra Security', color: '#7c3aed', icon: 'fa-fort-awesome' }
  };

  const THEMES = ['cyber-dark', 'terminal', 'light'];

  // ---------------------------------------------------------------------------
  // 2. Application State & Audio Synthesizer
  // ---------------------------------------------------------------------------
  const state = {
    allNews: [],
    filteredNews: [],
    currentPage: 1,
    pageSize: 18,
    viewMode: localStorage.getItem('infosec_view_mode') || 'grid',
    theme: localStorage.getItem('infosec_theme') || 'cyber-dark',
    bookmarks: new Set(JSON.parse(localStorage.getItem('infosec_bookmarks') || '[]')),
    readItems: new Set(JSON.parse(localStorage.getItem('infosec_read_items') || '[]')),
    activeTopic: 'all',
    activeSource: 'all',
    activeStatus: 'all',
    sortOrder: 'newest',
    searchQuery: '',
    currentModalIndex: -1,
    isSyncing: false,
    syncPollTimer: null,
    streamMode: false,
    streamCount: 18
  };

  const AudioEngine = {
    ctx: null,
    enabled: localStorage.getItem('infosec_sound') === 'true',
    init() {
      if (!this.ctx && typeof AudioContext !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
    },
    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('infosec_sound', this.enabled ? 'true' : 'false');
      updateSoundIcon();
      if (this.enabled) {
        this.playSuccess();
        showToast('Cyber audio effects enabled', 'info');
      } else {
        showToast('Audio effects muted', 'info');
      }
    },
    playClick() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.035);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.035);
      } catch {}
    },
    playSuccess() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.22);
      } catch {}
    }
  };

  function updateSoundIcon() {
    const icon = document.getElementById('sound-icon');
    const btn = document.getElementById('sound-toggle-btn');
    if (!icon || !btn) return;
    if (AudioEngine.enabled) {
      icon.className = 'fa-solid fa-volume-high';
      btn.title = 'Mute Cyber Audio SFX';
      btn.style.color = 'var(--accent-cyan)';
    } else {
      icon.className = 'fa-solid fa-volume-xmark';
      btn.title = 'Enable Cyber Audio SFX';
      btn.style.color = '';
    }
  }

  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('theme') && THEMES.includes(params.get('theme'))) {
      state.theme = params.get('theme');
    }
    if (params.has('view') && ['grid', 'list'].includes(params.get('view'))) {
      state.viewMode = params.get('view');
    }
    if (params.has('search')) {
      state.searchQuery = params.get('search');
    }
    if (params.has('topic')) {
      state.activeTopic = params.get('topic');
    }
    if (params.has('source')) {
      state.activeSource = params.get('source');
    }
    if (params.has('status')) {
      state.activeStatus = params.get('status');
    }
    if (params.has('sort')) {
      state.sortOrder = params.get('sort');
    }
    if (params.has('story')) {
      state.initialStoryId = parseInt(params.get('story'), 10);
    }
  }

  function syncUrlState() {
    try {
      const url = new URL(window.location);
      if (state.searchQuery.trim()) url.searchParams.set('search', state.searchQuery.trim());
      else url.searchParams.delete('search');

      if (state.activeTopic !== 'all') url.searchParams.set('topic', state.activeTopic);
      else url.searchParams.delete('topic');

      if (state.activeSource !== 'all') url.searchParams.set('source', state.activeSource);
      else url.searchParams.delete('source');

      if (state.activeStatus !== 'all') url.searchParams.set('status', state.activeStatus);
      else url.searchParams.delete('status');

      if (state.sortOrder !== 'newest') url.searchParams.set('sort', state.sortOrder);
      else url.searchParams.delete('sort');

      if (state.viewMode !== 'grid') url.searchParams.set('view', state.viewMode);
      else url.searchParams.delete('view');

      if (state.theme !== 'cyber-dark') url.searchParams.set('theme', state.theme);
      else url.searchParams.delete('theme');

      if (state.currentModalIndex >= 0 && state.filteredNews[state.currentModalIndex]) {
        url.searchParams.set('story', state.filteredNews[state.currentModalIndex].id);
      } else {
        url.searchParams.delete('story');
      }

      window.history.replaceState({}, '', url.pathname + url.search);
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // 3. Helper Functions: Sanitization, Classification, Source Info
  // ---------------------------------------------------------------------------
  function sanitize(str) {
    if (!str) return '';
    if (window.DOMPurify) {
      return DOMPurify.sanitize(str, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'code', 'mark'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
      });
    }
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function extractDomain(url) {
    if (!url) return 'unknown';
    try {
      const parsed = new URL(url);
      let host = parsed.hostname.toLowerCase();
      if (host.startsWith('www.')) host = host.slice(4);
      return host;
    } catch {
      return 'infosec.feed';
    }
  }

  function getSourceInfo(url) {
    const domain = extractDomain(url);
    if (KNOWN_SOURCES[domain]) {
      return { domain, ...KNOWN_SOURCES[domain] };
    }
    // Check partial domain matches
    for (const [key, val] of Object.entries(KNOWN_SOURCES)) {
      if (domain.includes(key) || key.includes(domain)) {
        return { domain, ...val };
      }
    }
    const cleanName = domain.split('.')[0];
    const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    return {
      domain,
      name: capitalized,
      color: '#38bdf8',
      icon: 'fa-globe'
    };
  }

  function classifyThreatCategory(title, desc) {
    const text = `${title || ''} ${desc || ''}`.toLowerCase();

    if (/zero-day|0-day|\bcve-\d{4}-\d+|unauthenticated\s+rce|arbitrary\s+code\s+execution|poc\s+released/i.test(text)) {
      return { key: 'zero-day', label: 'Zero-Day / Exploit', class: 'zero-day' };
    }
    if (/ransomware|extortion|lockbit|blackcat|clop|decryptor|ransom/i.test(text)) {
      return { key: 'ransomware', label: 'Ransomware', class: 'ransomware' };
    }
    if (/malware|trojan|backdoor|spyware|stealer|botnet|infostealer|lumma|agent\s*tesla|rootkit|payload/i.test(text)) {
      return { key: 'malware', label: 'Malware & Botnets', class: 'malware' };
    }
    if (/breach|leaked|data\s+leak|database\s+dump|compromised|stolen\s+records|exposed\s+credentials/i.test(text)) {
      return { key: 'breach', label: 'Data Breach', class: 'breach' };
    }
    if (/vulnerabilit|security\s+flaw|security\s+bug|critical\s+patch|security\s+update|buffer\s+overflow/i.test(text)) {
      return { key: 'vulnerability', label: 'Vulnerability', class: 'vulnerability' };
    }
    if (/\bai\b|artificial\s+intelligence|\bllm\b|chatgpt|claude|openai|deepfake|prompt\s+injection|model\s+weights/i.test(text)) {
      return { key: 'ai-security', label: 'AI & LLM Threat', class: 'ai-security' };
    }
    if (/cloud|aws|azure|kubernetes|docker|container|s3\s+bucket|iam\s+role|api\s+security/i.test(text)) {
      return { key: 'cloud', label: 'Cloud Security', class: 'cloud' };
    }
    if (/nation-state|\bapt\b|espionage|cyber\s+espionage|russia|china|iran|north\s+korea|state-sponsored/i.test(text)) {
      return { key: 'apt', label: 'Nation-State APT', class: 'apt' };
    }
    if (/fbi|cisa|doj|ftc|gdpr|compliance|indictment|lawsuit|sanction|regulation|privacy\s+law/i.test(text)) {
      return { key: 'policy', label: 'Policy & Gov', class: 'policy' };
    }

    return { key: 'general', label: 'Threat Intel', class: 'general' };
  }

  function getDeterministicPlaceholder(news) {
    const str = `${news.id || 0}-${news.title || ''}-${news.link || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % PLACEHOLDER_IMAGES.length;
    return `img/${PLACEHOLDER_IMAGES[idx]}`;
  }

  function estimateReadingTime(text) {
    if (!text) return '1 min read';
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 140));
    return `${minutes} min read`;
  }

  function formatRelativeDate(dateStr) {
    if (!dateStr) return 'Recent';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays > 1 && diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return dateStr;
    }
  }

  function highlightMatches(text, query) {
    if (!query || !query.trim() || !text) return sanitize(text);
    const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map(part => {
      if (part.toLowerCase() === query.trim().toLowerCase()) {
        return `<mark class="search-highlight">${sanitize(part)}</mark>`;
      }
      return sanitize(part);
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // 4. Persistence Helpers
  // ---------------------------------------------------------------------------
  function saveBookmarks() {
    localStorage.setItem('infosec_bookmarks', JSON.stringify(Array.from(state.bookmarks)));
    updateBookmarkBadges();
  }

  function saveReadItems() {
    localStorage.setItem('infosec_read_items', JSON.stringify(Array.from(state.readItems)));
    updateMetricsDashboard();
  }

  function toggleBookmark(id, event) {
    if (event) event.stopPropagation();
    if (state.bookmarks.has(id)) {
      state.bookmarks.delete(id);
      showToast('Article removed from saved bookmarks.', 'info');
    } else {
      state.bookmarks.add(id);
      showToast('Article saved to triage bookmarks.', 'success');
    }
    saveBookmarks();
    renderCurrentPage();
    if (state.currentModalIndex >= 0) {
      updateModalContent(state.currentModalIndex);
    }
  }

  function toggleReadStatus(id, event) {
    if (event) event.stopPropagation();
    if (state.readItems.has(id)) {
      state.readItems.delete(id);
      showToast('Marked as unread.', 'info');
    } else {
      state.readItems.add(id);
      showToast('Marked as read.', 'success');
    }
    saveReadItems();
    renderCurrentPage();
    if (state.currentModalIndex >= 0) {
      updateModalContent(state.currentModalIndex);
    }
  }

  function copyArticleLink(link, event) {
    if (event) event.stopPropagation();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      showToast('Article link copied to clipboard!', 'success');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Article link copied to clipboard!', 'success');
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Toast Notification Engine
  // ---------------------------------------------------------------------------
  function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-stack-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `cyber-toast ${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'error') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <span class="toast-message">${sanitize(message)}</span>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode === container) {
          container.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // ---------------------------------------------------------------------------
  // 6. Data Fetching & Sync
  // ---------------------------------------------------------------------------
  async function fetchNewsData() {
    const skeleton = document.getElementById('skeleton-container');
    const newsContainer = document.getElementById('news-container');
    const emptyState = document.getElementById('empty-state-card');
    const paginationBar = document.getElementById('pagination-bar');

    if (skeleton) skeleton.style.display = 'grid';
    if (newsContainer) newsContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (paginationBar) paginationBar.style.display = 'none';

    try {
      const response = await fetch('/news');
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      const newsItems = Array.isArray(data.news) ? data.news : [];

      state.allNews = newsItems;
      populateSourceSelectOptions();
      populateTickerMarquee();
      applyFiltersAndSort();
      updateMetricsDashboard();
      updateBookmarkBadges();

      // Deep link to specific story if query parameter ?story=ID was provided
      if (state.initialStoryId) {
        const targetIdx = state.filteredNews.findIndex(n => n.id === state.initialStoryId);
        if (targetIdx !== -1) {
          openStoryModal(targetIdx);
        }
        state.initialStoryId = null;
      }

      if (skeleton) skeleton.style.display = 'none';
      if (newsContainer) {
        newsContainer.className = `news-container ${state.viewMode === 'list' ? 'list-layout' : 'grid-layout'}`;
        newsContainer.style.display = state.viewMode === 'list' ? 'flex' : 'grid';
      }
    } catch (err) {
      console.error('Failed to load news:', err);
      if (skeleton) skeleton.style.display = 'none';
      showToast('Failed to load news feed. Check server status.', 'error', 5000);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Threat Feed Synchronization & Real-Time Tracking Engine
  // ---------------------------------------------------------------------------

  async function fetchSyncStatus() {
    try {
      const resp = await fetch('/sync/status');
      if (!resp.ok) return null;
      return await resp.json();
    } catch (err) {
      console.warn('Failed to fetch sync status from endpoint:', err);
      return null;
    }
  }

  async function fetchSyncProgress() {
    try {
      const resp = await fetch('/sync/progress');
      if (!resp.ok) return null;
      return await resp.json();
    } catch (err) {
      console.warn('Failed to fetch sync progress from endpoint:', err);
      return null;
    }
  }

  function updateSyncUI(isSyncing, progress) {
    const syncBtn = document.getElementById('sync-feeds-btn');
    const emptySyncBtn = document.getElementById('empty-sync-btn');
    const syncBtnLabel = document.getElementById('sync-btn-label');
    const statusPill = document.getElementById('live-status-pill');
    const statusText = document.getElementById('status-text');
    const banner = document.getElementById('sync-live-banner');
    const bannerFill = document.getElementById('sync-banner-progress-fill');
    const bannerPct = document.getElementById('sync-banner-pct');
    const bannerSource = document.getElementById('sync-banner-source');
    const bannerDetails = document.getElementById('sync-banner-details');

    if (isSyncing) {
      if (syncBtn) {
        syncBtn.classList.add('syncing');
        syncBtn.disabled = true;
      }
      if (emptySyncBtn) {
        emptySyncBtn.classList.add('syncing');
        emptySyncBtn.disabled = true;
      }
      if (statusPill) statusPill.classList.add('syncing');

      if (banner) banner.style.display = 'block';

      if (progress) {
        const pct = Math.min(100, Math.max(0, Math.round(progress.percent || 0)));
        const cur = progress.current || 0;
        const tot = progress.total || 26;
        const sourceName = progress.current_source_name || (progress.current_source ? extractDomain(progress.current_source) : 'RSS Feeds');
        const added = progress.new_items_count || 0;

        if (syncBtnLabel) syncBtnLabel.textContent = `Syncing (${cur}/${tot})`;
        if (statusText) statusText.textContent = `SYNCING ${cur}/${tot} (${pct}%)`;

        if (bannerFill) bannerFill.style.width = `${pct}%`;
        if (bannerPct) bannerPct.textContent = `${pct}%`;
        if (bannerSource) bannerSource.textContent = sourceName ? `Ingesting: ${sourceName}` : 'Connecting to threat feeds...';
        if (bannerDetails) {
          bannerDetails.innerHTML = `Ingesting source <strong>${cur}</strong> of <strong>${tot}</strong> &bull; <strong>${pct}%</strong> complete &bull; <strong>${added}</strong> new disclosures`;
        }
      } else {
        if (syncBtnLabel) syncBtnLabel.textContent = 'Syncing...';
        if (statusText) statusText.textContent = 'SYNCING...';
      }
    } else {
      if (syncBtn) {
        syncBtn.classList.remove('syncing');
        syncBtn.disabled = false;
      }
      if (emptySyncBtn) {
        emptySyncBtn.classList.remove('syncing');
        emptySyncBtn.disabled = false;
      }
      if (syncBtnLabel) syncBtnLabel.textContent = 'Sync Feeds';
      if (statusPill) statusPill.classList.remove('syncing');
      if (statusText) statusText.textContent = 'FEED ACTIVE';

      if (progress && banner) {
        if (bannerFill) bannerFill.style.width = '100%';
        if (bannerPct) bannerPct.textContent = '100%';
        if (bannerSource) bannerSource.textContent = 'Synchronization Complete';
        if (bannerDetails) {
          bannerDetails.innerHTML = `All <strong>${progress.total || 26}</strong> sources processed &bull; <strong>${progress.new_items_count || 0}</strong> new threat disclosures indexed`;
        }
        setTimeout(() => {
          if (!state.isSyncing && banner) {
            banner.style.display = 'none';
          }
        }, 3000);
      } else if (banner) {
        banner.style.display = 'none';
      }
    }
  }

  function startSyncTracking() {
    if (state.syncPollTimer) {
      clearInterval(state.syncPollTimer);
      state.syncPollTimer = null;
    }

    state.isSyncing = true;
    updateSyncUI(true, null);

    // Immediately fetch progress to show real-time state without delay
    (async () => {
      const initialProgress = await fetchSyncProgress();
      if (initialProgress && state.isSyncing) {
        updateSyncUI(true, initialProgress);
      }
    })();

    // Poll status & progress in real time (every 1s) until synced
    state.syncPollTimer = setInterval(async () => {
      try {
        // Multiple Endpoints usage:
        // 1. Endpoint 1: track if the feed is syncing already
        const status = await fetchSyncStatus();
        // 2. Endpoint 2: keep track of how much already done
        const progress = await fetchSyncProgress();

        if (status && status.is_syncing) {
          updateSyncUI(true, progress);
        } else {
          // Sync completed!
          clearInterval(state.syncPollTimer);
          state.syncPollTimer = null;
          state.isSyncing = false;

          updateSyncUI(false, progress);
          AudioEngine.playSuccess();
          const addedCount = progress ? (progress.new_items_count || 0) : 0;
          showToast(`Threat feeds synchronized! ${addedCount} new disclosures indexed.`, 'success', 3500);

          // Refresh feed data to display newly synchronized articles
          await fetchNewsData();
        }
      } catch (err) {
        console.error('Error during real-time sync polling:', err);
      }
    }, 1000);
  }

  async function triggerFeedSync() {
    if (state.isSyncing) {
      showToast('Feed synchronization already in progress.', 'info', 2500);
      return;
    }

    AudioEngine.playClick();

    // Check Endpoint 1: Is the feed syncing already?
    const currentStatus = await fetchSyncStatus();
    if (currentStatus && currentStatus.is_syncing) {
      showToast('Feeds are already syncing in background. Connecting to live progress...', 'info', 3000);
      startSyncTracking();
      return;
    }

    // Set UI to syncing immediately
    state.isSyncing = true;
    updateSyncUI(true, { current: 0, total: 26, percent: 0, current_source_name: 'Connecting...', new_items_count: 0 });
    showToast('Connecting to 26 RSS sources... Synchronizing latest threat disclosures.', 'info', 4000);

    try {
      // Trigger feed synchronization
      const resp = await fetch('/news', { method: 'PATCH' });
      if (!resp.ok) throw new Error(`Sync HTTP error: ${resp.status}`);
      await resp.json();

      // Begin tracking sync status and progress in real-time until synced
      startSyncTracking();
    } catch (err) {
      console.error('Sync failed to initiate:', err);
      showToast('Feed synchronization failed to initiate. Backend might be busy.', 'error', 4000);
      state.isSyncing = false;
      updateSyncUI(false, null);
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Filtering, Searching, & Sorting Engine
  // ---------------------------------------------------------------------------
  function applyFiltersAndSort() {
    let result = [...state.allNews];

    // Search query filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      result = result.filter(item => {
        const title = (item.title || '').toLowerCase();
        const desc = (item.desc || '').toLowerCase();
        const domain = extractDomain(item.link);
        return title.includes(q) || desc.includes(q) || domain.includes(q);
      });
    }

    // Source filter
    if (state.activeSource !== 'all') {
      result = result.filter(item => extractDomain(item.link) === state.activeSource);
    }

    // Topic filter
    if (state.activeTopic !== 'all') {
      result = result.filter(item => {
        const cat = classifyThreatCategory(item.title, item.desc);
        return cat.key === state.activeTopic;
      });
    }

    // Reading Status filter
    if (state.activeStatus === 'unread') {
      result = result.filter(item => !state.readItems.has(item.id));
    } else if (state.activeStatus === 'read') {
      result = result.filter(item => state.readItems.has(item.id));
    } else if (state.activeStatus === 'saved') {
      result = result.filter(item => state.bookmarks.has(item.id));
    }

    // Sorting
    if (state.sortOrder === 'newest') {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (state.sortOrder === 'oldest') {
      result.sort((a, b) => (a.id || 0) - (b.id || 0));
    } else if (state.sortOrder === 'source') {
      result.sort((a, b) => extractDomain(a.link).localeCompare(extractDomain(b.link)));
    } else if (state.sortOrder === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (state.sortOrder === 'random') {
      // Deterministic pseudo-random shuffle
      result.sort(() => Math.random() - 0.5);
    }

    state.filteredNews = result;
    state.currentPage = 1;

    renderActiveFilterBadges();
    renderCurrentPage();
    updateResultsCountText();
    syncUrlState();
  }

  function renderActiveFilterBadges() {
    const container = document.getElementById('active-tags-container');
    const list = document.getElementById('active-tags-list');
    const resetBtn = document.getElementById('reset-filters-btn');
    if (!container || !list) return;

    list.innerHTML = '';
    const activeFilters = [];

    if (state.searchQuery.trim()) {
      activeFilters.push({
        label: `Search: "${state.searchQuery.trim()}"`,
        onRemove: () => {
          state.searchQuery = '';
          const input = document.getElementById('global-search-input');
          if (input) input.value = '';
          const clearBtn = document.getElementById('search-clear-btn');
          if (clearBtn) clearBtn.style.display = 'none';
          applyFiltersAndSort();
        }
      });
    }

    if (state.activeTopic !== 'all') {
      const chip = document.querySelector(`.topic-chip[data-topic="${state.activeTopic}"]`);
      const label = chip ? chip.textContent.trim() : state.activeTopic;
      activeFilters.push({
        label: `Topic: ${label}`,
        onRemove: () => {
          state.activeTopic = 'all';
          updateTopicChips();
          applyFiltersAndSort();
        }
      });
    }

    if (state.activeSource !== 'all') {
      const srcInfo = KNOWN_SOURCES[state.activeSource];
      const name = srcInfo ? srcInfo.name : state.activeSource;
      activeFilters.push({
        label: `Source: ${name}`,
        onRemove: () => {
          state.activeSource = 'all';
          const sel = document.getElementById('source-filter-select');
          if (sel) sel.value = 'all';
          applyFiltersAndSort();
        }
      });
    }

    if (state.activeStatus !== 'all') {
      let label = state.activeStatus;
      if (state.activeStatus === 'unread') label = 'Unread Only';
      if (state.activeStatus === 'saved') label = 'Saved / Bookmarked';
      if (state.activeStatus === 'read') label = 'Read Only';
      activeFilters.push({
        label: `Status: ${label}`,
        onRemove: () => {
          state.activeStatus = 'all';
          const sel = document.getElementById('status-filter-select');
          if (sel) sel.value = 'all';
          const bBtn = document.getElementById('toggle-bookmarks-btn');
          if (bBtn) bBtn.classList.remove('active-filter');
          applyFiltersAndSort();
        }
      });
    }

    if (activeFilters.length > 0) {
      container.style.display = 'flex';
      if (resetBtn) resetBtn.style.display = 'inline-flex';

      activeFilters.forEach(item => {
        const badge = document.createElement('span');
        badge.className = 'filter-badge-item';
        badge.innerHTML = `
          <span>${sanitize(item.label)}</span>
          <button class="filter-badge-remove" aria-label="Remove filter">
            <i class="fa-solid fa-xmark"></i>
          </button>
        `;
        badge.querySelector('.filter-badge-remove').addEventListener('click', item.onRemove);
        list.appendChild(badge);
      });
    } else {
      container.style.display = 'none';
      if (resetBtn) resetBtn.style.display = 'none';
    }
  }

  function resetAllFilters() {
    state.searchQuery = '';
    state.activeTopic = 'all';
    state.activeSource = 'all';
    state.activeStatus = 'all';
    state.sortOrder = 'newest';

    const searchInput = document.getElementById('global-search-input');
    if (searchInput) searchInput.value = '';
    const searchClear = document.getElementById('search-clear-btn');
    if (searchClear) searchClear.style.display = 'none';

    const sourceSelect = document.getElementById('source-filter-select');
    if (sourceSelect) sourceSelect.value = 'all';

    const statusSelect = document.getElementById('status-filter-select');
    if (statusSelect) statusSelect.value = 'all';

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'newest';

    const bBtn = document.getElementById('toggle-bookmarks-btn');
    if (bBtn) bBtn.classList.remove('active-filter');

    updateTopicChips();
    applyFiltersAndSort();
    showToast('All filters have been reset.', 'info');
  }

  function updateResultsCountText() {
    const el = document.getElementById('results-count-text');
    if (!el) return;
    const total = state.allNews.length;
    const filtered = state.filteredNews.length;
    if (total === 0) {
      el.textContent = '0 disclosures';
    } else if (filtered === total) {
      el.textContent = `Showing all ${total} disclosures`;
    } else {
      el.textContent = `Showing ${filtered} of ${total} disclosures`;
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Rendering Engine: Cards, List, & Empty States
  // ---------------------------------------------------------------------------
  function renderCurrentPage() {
    const newsContainer = document.getElementById('news-container');
    const emptyState = document.getElementById('empty-state-card');
    const paginationBar = document.getElementById('pagination-bar');
    if (!newsContainer) return;

    if (state.filteredNews.length === 0) {
      newsContainer.innerHTML = '';
      newsContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (paginationBar) paginationBar.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    newsContainer.className = `news-container ${state.viewMode === 'list' ? 'list-layout' : 'grid-layout'}`;
    newsContainer.style.display = state.viewMode === 'list' ? 'flex' : 'grid';

    // Calculate items to show
    let itemsToShow = [];
    if (state.pageSize === 'all') {
      itemsToShow = state.filteredNews;
    } else {
      const size = parseInt(state.pageSize, 10);
      if (state.streamMode) {
        const streamEnd = Math.min((state.streamCount || size), state.filteredNews.length);
        itemsToShow = state.filteredNews.slice(0, streamEnd);
      } else {
        const start = (state.currentPage - 1) * size;
        const end = Math.min(start + size, state.filteredNews.length);
        itemsToShow = state.filteredNews.slice(start, end);
      }
    }

    newsContainer.innerHTML = '';

    itemsToShow.forEach((item) => {
      const card = createNewsCardElement(item);
      newsContainer.appendChild(card);
    });

    renderPaginationControls();
  }

  function createNewsCardElement(item, index) {
    const card = document.createElement('article');
    const isBookmarked = state.bookmarks.has(item.id);
    const isRead = state.readItems.has(item.id);

    card.className = `news-card ${isRead ? 'is-read' : ''}`;
    card.setAttribute('data-id', item.id);

    const srcInfo = getSourceInfo(item.link);
    const category = classifyThreatCategory(item.title, item.desc);
    const placeholderImg = getDeterministicPlaceholder(item);
    const displayImg = item.image && item.image.trim() ? item.image.trim() : placeholderImg;
    const relDate = formatRelativeDate(item.date_added);
    const readTime = estimateReadingTime(item.desc || item.title);

    const titleHighlighted = highlightMatches(item.title || 'Untitled Threat Report', state.searchQuery);
    const descHighlighted = item.desc
      ? highlightMatches(item.desc, state.searchQuery)
      : '<i>No summary available for this intelligence item. Click below to inspect source report.</i>';

    if (state.viewMode === 'grid') {
      card.innerHTML = `
        <div class="card-thumb-wrapper" title="Click to view full intel report">
          <img 
            src="${displayImg}" 
            class="card-thumb-img" 
            alt="Cybersecurity Thumbnail" 
            loading="lazy"
            onerror="this.onerror=null;this.src='${placeholderImg}';"
          >
          <div class="card-thumb-overlay"></div>
          
          <div class="card-badges-top">
            <div class="badge-group-left">
              <span class="source-pill" style="border-left: 3px solid ${srcInfo.color};">
                <i class="fa-solid ${srcInfo.icon}"></i> ${sanitize(srcInfo.name)}
              </span>
              <span class="category-pill ${category.class}">
                ${sanitize(category.label)}
              </span>
            </div>
            
            <div class="badge-group-right">
              ${isRead ? `<span class="read-status-badge" title="You have read this article"><i class="fa-solid fa-check"></i> Read</span>` : ''}
              <button 
                class="thumb-action-btn ${isBookmarked ? 'bookmarked' : ''}" 
                data-action="bookmark" 
                title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark for Triage'}"
                aria-label="Bookmark"
              >
                <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
              </button>
            </div>
          </div>

          <div class="card-thumb-footer">
            <span><i class="fa-regular fa-calendar"></i> ${relDate}</span>
            <span><i class="fa-regular fa-clock"></i> ${readTime}</span>
          </div>
        </div>

        <div class="card-content">
          <h3 class="card-title" title="Open full story preview">${titleHighlighted}</h3>
          <p class="card-excerpt">${descHighlighted}</p>

          <div class="card-footer">
            <div class="card-footer-left">
              <button class="card-btn-action ${isBookmarked ? 'active-bookmark' : ''}" data-action="bookmark" title="Bookmark article">
                <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
              </button>
              <button class="card-btn-action ${isRead ? 'active-read' : ''}" data-action="toggle-read" title="${isRead ? 'Mark as Unread' : 'Mark as Read'}">
                <i class="fa-${isRead ? 'solid' : 'regular'} fa-circle-check"></i>
              </button>
              <button class="card-btn-action" data-action="copy-link" title="Copy article URL">
                <i class="fa-solid fa-link"></i>
              </button>
            </div>

            <div class="card-footer-right">
              <button class="card-btn-readmore" data-action="preview" title="Open Quick Preview">
                <span>Quick View</span>
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      // List Mode
      card.innerHTML = `
        <div class="card-thumb-wrapper" title="Click to view full intel report">
          <img 
            src="${displayImg}" 
            class="card-thumb-img" 
            alt="Thumbnail" 
            loading="lazy"
            onerror="this.onerror=null;this.src='${placeholderImg}';"
          >
          <div class="card-thumb-overlay"></div>
        </div>

        <div class="card-content">
          <div class="card-list-meta">
            <span class="source-pill" style="border-left: 3px solid ${srcInfo.color};">
              <i class="fa-solid ${srcInfo.icon}"></i> ${sanitize(srcInfo.name)}
            </span>
            <span class="category-pill ${category.class}">
              ${sanitize(category.label)}
            </span>
            <span><i class="fa-regular fa-calendar"></i> ${relDate}</span>
            <span><i class="fa-regular fa-clock"></i> ${readTime}</span>
            ${isRead ? `<span class="read-status-badge"><i class="fa-solid fa-check"></i> Read</span>` : ''}
          </div>

          <h3 class="card-title">${titleHighlighted}</h3>
          <p class="card-excerpt">${descHighlighted}</p>
        </div>

        <div class="card-footer">
          <button class="card-btn-action ${isBookmarked ? 'active-bookmark' : ''}" data-action="bookmark" title="Bookmark">
            <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
          </button>
          <button class="card-btn-action ${isRead ? 'active-read' : ''}" data-action="toggle-read" title="Mark read">
            <i class="fa-${isRead ? 'solid' : 'regular'} fa-circle-check"></i>
          </button>
          <button class="card-btn-action" data-action="copy-link" title="Copy link">
            <i class="fa-solid fa-link"></i>
          </button>
          <button class="card-btn-readmore" data-action="preview" title="Quick view">
            <i class="fa-solid fa-expand"></i>
          </button>
        </div>
      `;
    }

    // Attach Event Listeners
    const handleOpenStory = () => {
      const idx = state.filteredNews.findIndex(n => n.id === item.id);
      if (idx !== -1) openStoryModal(idx);
    };

    const thumbWrapper = card.querySelector('.card-thumb-wrapper');
    const titleElem = card.querySelector('.card-title');
    if (thumbWrapper) thumbWrapper.addEventListener('click', handleOpenStory);
    if (titleElem) titleElem.addEventListener('click', handleOpenStory);

    const bookmarkBtns = card.querySelectorAll('[data-action="bookmark"]');
    bookmarkBtns.forEach(b => b.addEventListener('click', (e) => toggleBookmark(item.id, e)));

    const readBtns = card.querySelectorAll('[data-action="toggle-read"]');
    readBtns.forEach(r => r.addEventListener('click', (e) => toggleReadStatus(item.id, e)));

    const copyBtns = card.querySelectorAll('[data-action="copy-link"]');
    copyBtns.forEach(c => c.addEventListener('click', (e) => copyArticleLink(item.link, e)));

    const previewBtns = card.querySelectorAll('[data-action="preview"]');
    previewBtns.forEach(p => p.addEventListener('click', (e) => {
      e.stopPropagation();
      handleOpenStory();
    }));

    return card;
  }

  function renderPaginationControls() {
    const bar = document.getElementById('pagination-bar');
    if (!bar) return;

    const total = state.filteredNews.length;
    if (total === 0 || state.pageSize === 'all') {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'flex';
    const size = parseInt(state.pageSize, 10);
    const totalPages = Math.ceil(total / size);

    let startNum, endNum;
    if (state.streamMode) {
      startNum = 1;
      endNum = Math.min((state.streamCount || size), total);
    } else {
      startNum = total > 0 ? (state.currentPage - 1) * size + 1 : 0;
      endNum = Math.min(state.currentPage * size, total);
    }

    document.getElementById('pag-start').textContent = startNum;
    document.getElementById('pag-end').textContent = endNum;
    document.getElementById('pag-total').textContent = total;

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      if (endNum >= total) {
        loadMoreBtn.style.display = 'none';
      } else {
        loadMoreBtn.style.display = 'inline-flex';
        loadMoreBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Load More Disclosures (${total - endNum} remaining)`;
      }
    }

    // Pagination numbers
    const prevBtn = document.getElementById('pag-prev-btn');
    const nextBtn = document.getElementById('pag-next-btn');
    const numbersList = document.getElementById('page-numbers-list');

    if (prevBtn) prevBtn.disabled = state.streamMode ? true : state.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = state.streamMode ? endNum >= total : state.currentPage >= totalPages;

    if (numbersList) {
      numbersList.innerHTML = '';
      const maxButtons = 5;
      let startPage = Math.max(1, state.currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxButtons - 1);

      if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
      }

      for (let p = startPage; p <= endPage; p++) {
        const pBtn = document.createElement('button');
        pBtn.className = `page-number-btn ${(!state.streamMode && p === state.currentPage) ? 'active' : ''}`;
        pBtn.textContent = p;
        pBtn.addEventListener('click', () => {
          state.streamMode = false;
          state.currentPage = p;
          renderCurrentPage();
          window.scrollTo({ top: document.getElementById('metrics-dashboard').offsetTop, behavior: 'smooth' });
        });
        numbersList.appendChild(pBtn);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Quick Preview Modal Engine
  // ---------------------------------------------------------------------------
  function openStoryModal(index) {
    if (index < 0 || index >= state.filteredNews.length) return;
    state.currentModalIndex = index;

    const modal = document.getElementById('preview-modal-backdrop');
    if (!modal) return;

    updateModalContent(index);

    // Mark as read when opened in preview
    const item = state.filteredNews[index];
    if (item && !state.readItems.has(item.id)) {
      state.readItems.add(item.id);
      saveReadItems();
      renderCurrentPage();
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    AudioEngine.playClick();
    syncUrlState();
  }

  function closeStoryModal() {
    const modal = document.getElementById('preview-modal-backdrop');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.currentModalIndex = -1;
    AudioEngine.playClick();
    syncUrlState();
  }

  function updateModalContent(index) {
    const item = state.filteredNews[index];
    if (!item) return;

    const total = state.filteredNews.length;
    document.getElementById('modal-index-counter').textContent = `Report ${index + 1} of ${total}`;

    // Prev / Next button states
    const prevBtn = document.getElementById('modal-prev-btn');
    const nextBtn = document.getElementById('modal-next-btn');
    if (prevBtn) prevBtn.disabled = index <= 0;
    if (nextBtn) nextBtn.disabled = index >= total - 1;

    // Badges & Meta
    const srcInfo = getSourceInfo(item.link);
    const category = classifyThreatCategory(item.title, item.desc);
    const relDate = formatRelativeDate(item.date_added);
    const readTime = estimateReadingTime(item.desc || item.title);
    const isBookmarked = state.bookmarks.has(item.id);
    const isRead = state.readItems.has(item.id);

    // Image
    const placeholderImg = getDeterministicPlaceholder(item);
    const displayImg = item.image && item.image.trim() ? item.image.trim() : placeholderImg;
    const heroImg = document.getElementById('modal-hero-img');
    if (heroImg) {
      heroImg.src = displayImg;
      heroImg.onerror = () => { heroImg.src = placeholderImg; };
    }

    // Pills
    const sourcePill = document.getElementById('modal-source-pill');
    if (sourcePill) {
      sourcePill.innerHTML = `<i class="fa-solid ${srcInfo.icon}"></i> ${sanitize(srcInfo.name)}`;
      sourcePill.style.borderLeft = `3px solid ${srcInfo.color}`;
    }

    const catPill = document.getElementById('modal-category-pill');
    if (catPill) {
      catPill.textContent = category.label;
      catPill.className = `category-pill ${category.class}`;
    }

    const datePill = document.getElementById('modal-date-pill');
    if (datePill) {
      datePill.innerHTML = `<i class="fa-regular fa-calendar"></i> ${relDate}`;
    }

    // Texts
    document.getElementById('modal-title').textContent = item.title || 'Untitled Threat Report';
    document.getElementById('modal-meta-domain').textContent = srcInfo.domain;
    document.getElementById('modal-meta-readtime').textContent = readTime;
    document.getElementById('modal-meta-status').textContent = isRead ? 'Read' : 'Unread';

    const descElem = document.getElementById('modal-description');
    if (descElem) {
      if (item.desc && item.desc.trim()) {
        descElem.innerHTML = `<p>${sanitize(item.desc)}</p>`;
      } else {
        descElem.innerHTML = `
          <p><i>The RSS feed provider did not attach a full text synopsis for this article. Please open the original publication to read the complete breakdown.</i></p>
        `;
      }
    }

    // External Link
    const openLink = document.getElementById('modal-open-link');
    if (openLink) openLink.href = item.link;

    // Bookmark button inside modal
    const bIcon = document.getElementById('modal-bookmark-icon');
    const bLabel = document.getElementById('modal-bookmark-label');
    if (bIcon && bLabel) {
      if (isBookmarked) {
        bIcon.className = 'fa-solid fa-bookmark';
        bLabel.textContent = 'Saved';
      } else {
        bIcon.className = 'fa-regular fa-bookmark';
        bLabel.textContent = 'Bookmark';
      }
    }

    // Read status button inside modal
    const rIcon = document.getElementById('modal-read-icon');
    const rLabel = document.getElementById('modal-read-label');
    if (rIcon && rLabel) {
      if (isRead) {
        rIcon.className = 'fa-solid fa-circle-check';
        rLabel.textContent = 'Read';
      } else {
        rIcon.className = 'fa-regular fa-circle-check';
        rLabel.textContent = 'Mark Read';
      }
    }

    // Scroll modal body to top
    const scrollBody = document.getElementById('modal-scroll-body');
    if (scrollBody) scrollBody.scrollTop = 0;
  }

  // ---------------------------------------------------------------------------
  // 10. Ticker Marquee & Dashboard Stats
  // ---------------------------------------------------------------------------
  function populateTickerMarquee() {
    const track = document.getElementById('ticker-track');
    if (!track || state.allNews.length === 0) return;

    // Pick top 12 items
    const topItems = state.allNews.slice(0, 12);
    track.innerHTML = '';

    const renderItems = (items) => {
      return items.map((item) => {
        const src = getSourceInfo(item.link);
        return `
          <span class="ticker-item" data-id="${item.id}" title="Click to view story preview">
            <span class="ticker-item-source">${sanitize(src.name)}</span>
            <span class="ticker-item-title">${sanitize(item.title)}</span>
          </span>
          <span class="ticker-sep">•</span>
        `;
      }).join('');
    };

    // Duplicate content for smooth infinite marquee looping
    track.innerHTML = renderItems(topItems) + renderItems(topItems);

    track.querySelectorAll('.ticker-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.getAttribute('data-id'), 10);
        const idx = state.filteredNews.findIndex(n => n.id === id);
        if (idx !== -1) {
          openStoryModal(idx);
        } else {
          // If filtered out, find in allNews
          const allIdx = state.allNews.findIndex(n => n.id === id);
          if (allIdx !== -1) {
            state.filteredNews = [...state.allNews];
            renderCurrentPage();
            openStoryModal(allIdx);
          }
        }
      });
    });
  }

  function updateMetricsDashboard() {
    const total = state.allNews.length;
    document.getElementById('stat-total-disclosures').textContent = total;
    document.getElementById('header-total-badge').textContent = total;

    // Monitored sources count
    const domains = new Set(state.allNews.map(n => extractDomain(n.link)));
    document.getElementById('stat-monitored-sources').textContent = domains.size;

    // Today's disclosures count
    const nowIso = new Date().toISOString().slice(0, 10);
    const todayCount = state.allNews.filter(n => (n.date_added || '').startsWith(nowIso)).length;
    document.getElementById('stat-latest-count').textContent = todayCount || total;

    // Reading Progress
    const readCount = state.allNews.filter(n => state.readItems.has(n.id)).length;
    const pct = total > 0 ? Math.round((readCount / total) * 100) : 0;
    document.getElementById('stat-read-progress').textContent = `${pct}%`;
    document.getElementById('stat-read-ratio').textContent = `${readCount} read / ${total} total`;
  }

  function updateBookmarkBadges() {
    const count = state.bookmarks.size;
    const badge = document.getElementById('saved-counter-badge');
    if (badge) badge.textContent = count;
  }

  function populateSourceSelectOptions() {
    const select = document.getElementById('source-filter-select');
    if (!select) return;

    // Count articles per source
    const counts = {};
    state.allNews.forEach(item => {
      const d = extractDomain(item.link);
      counts[d] = (counts[d] || 0) + 1;
    });

    const sortedDomains = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    select.innerHTML = `<option value="all">All Sources (${state.allNews.length})</option>`;
    sortedDomains.forEach(domain => {
      const src = getSourceInfo(`https://${domain}`);
      const opt = document.createElement('option');
      opt.value = domain;
      opt.textContent = `${src.name} (${counts[domain]})`;
      select.appendChild(opt);
    });
  }

  function updateTopicChips() {
    const chips = document.querySelectorAll('.topic-chip');
    chips.forEach(chip => {
      if (chip.getAttribute('data-topic') === state.activeTopic) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 11. Theme Engine
  // ---------------------------------------------------------------------------
  function applyTheme(themeName) {
    if (!THEMES.includes(themeName)) themeName = 'cyber-dark';
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('infosec_theme', themeName);

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      if (themeName === 'cyber-dark') {
        themeIcon.className = 'fa-solid fa-moon theme-icon';
      } else if (themeName === 'terminal') {
        themeIcon.className = 'fa-solid fa-terminal theme-icon';
      } else {
        themeIcon.className = 'fa-solid fa-sun theme-icon';
      }
    }
  }

  function cycleTheme() {
    const currentIndex = THEMES.indexOf(state.theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    applyTheme(THEMES[nextIndex]);
    AudioEngine.playClick();
    syncUrlState();
    showToast(`Theme switched to: ${THEMES[nextIndex]}`, 'info');
  }

  // ---------------------------------------------------------------------------
  // 12. Export Intelligence Engine
  // ---------------------------------------------------------------------------
  function openExportModal() {
    const modal = document.getElementById('export-modal-backdrop');
    if (!modal) return;

    document.getElementById('export-filtered-count').textContent = state.filteredNews.length;
    document.getElementById('export-saved-count').textContent = state.bookmarks.size;

    updateExportPreview();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeExportModal() {
    const modal = document.getElementById('export-modal-backdrop');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateExportPreview() {
    const textarea = document.getElementById('export-preview-text');
    if (!textarea) return;

    const scopeRadio = document.querySelector('input[name="export-scope"]:checked');
    const isSavedOnly = scopeRadio && scopeRadio.value === 'saved';

    let items = isSavedOnly
      ? state.allNews.filter(n => state.bookmarks.has(n.id))
      : state.filteredNews;

    const isJson = document.getElementById('tab-format-json').classList.contains('active');

    if (isJson) {
      textarea.value = JSON.stringify(items, null, 2);
    } else {
      // Markdown Brief
      const nowStr = new Date().toLocaleString();
      let md = `# InfoSec News // Cyber Threat Intelligence Brief\n`;
      md += `*Generated:* ${nowStr}\n`;
      md += `*Total Disclosures Included:* ${items.length}\n\n`;
      md += `---\n\n`;

      items.forEach((item, i) => {
        const src = getSourceInfo(item.link);
        const cat = classifyThreatCategory(item.title, item.desc);
        md += `### ${i + 1}. ${item.title}\n`;
        md += `- **Source:** ${src.name} (${src.domain})\n`;
        md += `- **Category:** ${cat.label}\n`;
        md += `- **Published:** ${item.date_added}\n`;
        md += `- **Link:** ${item.link}\n\n`;
        if (item.desc && item.desc.trim()) {
          md += `> ${item.desc.trim().replace(/\n+/g, ' ')}\n\n`;
        }
      });

      textarea.value = md;
    }
  }

  function downloadExportFile() {
    const textarea = document.getElementById('export-preview-text');
    if (!textarea) return;

    const isJson = document.getElementById('tab-format-json').classList.contains('active');
    const content = textarea.value;
    const ext = isJson ? 'json' : 'md';
    const mime = isJson ? 'application/json' : 'text/markdown';
    const filename = `infosec-intel-brief-${Date.now()}.${ext}`;

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'success');
  }

  // ---------------------------------------------------------------------------
  // 13. Back to Top Progress Floating Button
  // ---------------------------------------------------------------------------
  function setupBackToTopButton() {
    const btn = document.getElementById('floating-top-btn');
    const circle = document.querySelector('.progress-ring-circle');
    if (!btn || !circle) return;

    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollProgress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      const offset = circumference - (scrollProgress * circumference);
      circle.style.strokeDashoffset = offset;

      const progressLine = document.getElementById('page-scroll-progress');
      if (progressLine) progressLine.style.width = `${scrollProgress * 100}%`;

      if (scrollTop > 350) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------------------------------------------------------------------------
  // 14. Event Listeners & Keyboard Controller
  // ---------------------------------------------------------------------------
  function setupEventListeners() {
    // Brand Logo reload
    document.getElementById('brand-logo').addEventListener('click', (e) => {
      e.preventDefault();
      resetAllFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Global Search Input with Debounce
    const searchInput = document.getElementById('global-search-input');
    const searchClear = document.getElementById('search-clear-btn');
    let searchDebounceTimer = null;

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (searchClear) searchClear.style.display = val ? 'flex' : 'none';

        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          state.searchQuery = val;
          applyFiltersAndSort();
        }, 200);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        state.searchQuery = '';
        applyFiltersAndSort();
        searchInput.focus();
      });
    }

    // Sync Feeds Button
    const syncBtn = document.getElementById('sync-feeds-btn');
    if (syncBtn) syncBtn.addEventListener('click', triggerFeedSync);

    const emptySyncBtn = document.getElementById('empty-sync-btn');
    if (emptySyncBtn) emptySyncBtn.addEventListener('click', triggerFeedSync);

    // Bookmarks Filter Toggle
    const bookmarksBtn = document.getElementById('toggle-bookmarks-btn');
    if (bookmarksBtn) {
      bookmarksBtn.addEventListener('click', () => {
        if (state.activeStatus === 'saved') {
          state.activeStatus = 'all';
          bookmarksBtn.classList.remove('active-filter');
        } else {
          state.activeStatus = 'saved';
          bookmarksBtn.classList.add('active-filter');
        }
        const statusSelect = document.getElementById('status-filter-select');
        if (statusSelect) statusSelect.value = state.activeStatus;
        applyFiltersAndSort();
      });
    }

    // View Mode Toggle (Grid vs List)
    const gridBtn = document.getElementById('view-grid-btn');
    const listBtn = document.getElementById('view-list-btn');

    if (gridBtn && listBtn) {
      gridBtn.addEventListener('click', () => {
        state.viewMode = 'grid';
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        localStorage.setItem('infosec_view_mode', 'grid');
        AudioEngine.playClick();
        syncUrlState();
        renderCurrentPage();
      });

      listBtn.addEventListener('click', () => {
        state.viewMode = 'list';
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        localStorage.setItem('infosec_view_mode', 'list');
        AudioEngine.playClick();
        syncUrlState();
        renderCurrentPage();
      });
    }

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.addEventListener('click', cycleTheme);

    // Audio SFX Toggle
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) soundBtn.addEventListener('click', () => AudioEngine.toggle());

    // Export Modal Triggers
    const openExportBtn = document.getElementById('open-export-btn');
    if (openExportBtn) openExportBtn.addEventListener('click', openExportModal);

    const closeExportBtn = document.getElementById('export-close-btn');
    if (closeExportBtn) closeExportBtn.addEventListener('click', closeExportModal);

    const cancelExportBtn = document.getElementById('export-cancel-btn');
    if (cancelExportBtn) cancelExportBtn.addEventListener('click', closeExportModal);

    const downloadExportBtn = document.getElementById('export-download-btn');
    if (downloadExportBtn) downloadExportBtn.addEventListener('click', downloadExportFile);

    const copyExportBtn = document.getElementById('export-copy-btn');
    if (copyExportBtn) {
      copyExportBtn.addEventListener('click', () => {
        const text = document.getElementById('export-preview-text').value;
        navigator.clipboard.writeText(text).then(() => {
          showToast('Intelligence brief copied to clipboard!', 'success');
        });
      });
    }

    // Export Format Tabs
    const tabMd = document.getElementById('tab-format-md');
    const tabJson = document.getElementById('tab-format-json');
    if (tabMd && tabJson) {
      tabMd.addEventListener('click', () => {
        tabMd.classList.add('active');
        tabJson.classList.remove('active');
        updateExportPreview();
      });
      tabJson.addEventListener('click', () => {
        tabJson.classList.add('active');
        tabMd.classList.remove('active');
        updateExportPreview();
      });
    }

    // Export Scope Radios
    const scopeFiltered = document.getElementById('export-scope-filtered');
    const scopeSaved = document.getElementById('export-scope-saved');
    if (scopeFiltered && scopeSaved) {
      scopeFiltered.addEventListener('change', updateExportPreview);
      scopeSaved.addEventListener('change', updateExportPreview);
    }

    // Shortcuts Modal
    const openShortcutsBtn = document.getElementById('open-shortcuts-btn');
    const shortcutsModal = document.getElementById('shortcuts-modal-backdrop');
    const closeShortcutsBtn = document.getElementById('shortcuts-close-btn');

    if (openShortcutsBtn && shortcutsModal) {
      openShortcutsBtn.addEventListener('click', () => {
        shortcutsModal.classList.add('is-open');
        shortcutsModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    }

    if (closeShortcutsBtn && shortcutsModal) {
      closeShortcutsBtn.addEventListener('click', () => {
        shortcutsModal.classList.remove('is-open');
        shortcutsModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    }

    // Topic Chips
    const topicChips = document.querySelectorAll('.topic-chip');
    topicChips.forEach(chip => {
      chip.addEventListener('click', () => {
        state.activeTopic = chip.getAttribute('data-topic');
        updateTopicChips();
        applyFiltersAndSort();
      });
    });

    // Source Filter Select
    const sourceSelect = document.getElementById('source-filter-select');
    if (sourceSelect) {
      sourceSelect.addEventListener('change', (e) => {
        state.activeSource = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Reading Status Filter Select
    const statusSelect = document.getElementById('status-filter-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        state.activeStatus = e.target.value;
        const bBtn = document.getElementById('toggle-bookmarks-btn');
        if (bBtn) {
          if (state.activeStatus === 'saved') bBtn.classList.add('active-filter');
          else bBtn.classList.remove('active-filter');
        }
        applyFiltersAndSort();
      });
    }

    // Sort Select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortOrder = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Clear All Filters Buttons
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAllFilters);

    const clearAllTagsBtn = document.getElementById('clear-all-tags-btn');
    if (clearAllTagsBtn) clearAllTagsBtn.addEventListener('click', resetAllFilters);

    const emptyResetBtn = document.getElementById('empty-reset-btn');
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAllFilters);

    // Mark Visible Page As Read
    const markPageReadBtn = document.getElementById('mark-visible-read-btn');
    if (markPageReadBtn) {
      markPageReadBtn.addEventListener('click', () => {
        const size = state.pageSize === 'all' ? state.filteredNews.length : parseInt(state.pageSize, 10);
        const start = (state.currentPage - 1) * size;
        const pageItems = state.filteredNews.slice(start, start + size);
        pageItems.forEach(i => state.readItems.add(i.id));
        saveReadItems();
        renderCurrentPage();
        showToast(`Marked ${pageItems.length} stories as read.`, 'success');
      });
    }

    // Ticker Close
    const tickerClose = document.getElementById('ticker-close-btn');
    const tickerBar = document.getElementById('threat-ticker-bar');
    if (tickerClose && tickerBar) {
      tickerClose.addEventListener('click', () => {
        tickerBar.style.display = 'none';
      });
    }

    // Pagination Load More & Navigation
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        state.streamMode = true;
        const size = parseInt(state.pageSize, 10);
        state.streamCount = (state.streamCount || size) + size;
        renderCurrentPage();
      });
    }

    const prevPageBtn = document.getElementById('pag-prev-btn');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
        state.streamMode = false;
        if (state.currentPage > 1) {
          state.currentPage--;
          renderCurrentPage();
          window.scrollTo({ top: document.getElementById('metrics-dashboard').offsetTop, behavior: 'smooth' });
        }
      });
    }

    const nextPageBtn = document.getElementById('pag-next-btn');
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
        state.streamMode = false;
        const size = parseInt(state.pageSize, 10);
        const totalPages = Math.ceil(state.filteredNews.length / size);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderCurrentPage();
          window.scrollTo({ top: document.getElementById('metrics-dashboard').offsetTop, behavior: 'smooth' });
        }
      });
    }

    const pageSizeSelect = document.getElementById('page-size-select');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        state.pageSize = e.target.value;
        state.streamMode = false;
        state.currentPage = 1;
        state.streamCount = parseInt(e.target.value, 10) || 18;
        renderCurrentPage();
      });
    }

    // Modal Navigation & Actions
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeStoryModal);

    const modalBackdrop = document.getElementById('preview-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeStoryModal();
      });
    }

    const modalPrevBtn = document.getElementById('modal-prev-btn');
    if (modalPrevBtn) {
      modalPrevBtn.addEventListener('click', () => {
        if (state.currentModalIndex > 0) {
          openStoryModal(state.currentModalIndex - 1);
        }
      });
    }

    const modalNextBtn = document.getElementById('modal-next-btn');
    if (modalNextBtn) {
      modalNextBtn.addEventListener('click', () => {
        if (state.currentModalIndex < state.filteredNews.length - 1) {
          openStoryModal(state.currentModalIndex + 1);
        }
      });
    }

    const modalBookmarkBtn = document.getElementById('modal-bookmark-btn');
    if (modalBookmarkBtn) {
      modalBookmarkBtn.addEventListener('click', (e) => {
        if (state.currentModalIndex >= 0) {
          const item = state.filteredNews[state.currentModalIndex];
          if (item) toggleBookmark(item.id, e);
        }
      });
    }

    const modalMarkReadBtn = document.getElementById('modal-mark-read-btn');
    if (modalMarkReadBtn) {
      modalMarkReadBtn.addEventListener('click', (e) => {
        if (state.currentModalIndex >= 0) {
          const item = state.filteredNews[state.currentModalIndex];
          if (item) toggleReadStatus(item.id, e);
        }
      });
    }

    const modalCopyBtn = document.getElementById('modal-copy-btn');
    if (modalCopyBtn) {
      modalCopyBtn.addEventListener('click', (e) => {
        if (state.currentModalIndex >= 0) {
          const item = state.filteredNews[state.currentModalIndex];
          if (item) copyArticleLink(item.link, e);
        }
      });
    }

    const modalShareBtn = document.getElementById('modal-share-btn');
    if (modalShareBtn) {
      modalShareBtn.addEventListener('click', () => {
        if (state.currentModalIndex >= 0) {
          const item = state.filteredNews[state.currentModalIndex];
          if (item && navigator.share) {
            navigator.share({
              title: item.title,
              text: item.desc || item.title,
              url: item.link
            }).catch(() => {});
          } else if (item) {
            copyArticleLink(item.link);
          }
        }
      });
    }

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();

      // Priority 1: CTRL+Shift+R vs CTRL+R handling
      if (isCtrl && keyLower === 'r') {
        if (e.shiftKey) {
          // CTRL+Shift+R: actual browser refresh (hard reload) - let browser execute native refresh
          return;
        } else {
          // CTRL+R: trigger feed sync behaviour instead of browser page reload!
          e.preventDefault();
          triggerFeedSync();
          return;
        }
      }

      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

      // Esc closes modals or clears search
      if (e.key === 'Escape') {
        const previewModal = document.getElementById('preview-modal-backdrop');
        const exportModal = document.getElementById('export-modal-backdrop');
        const shortcutsModal = document.getElementById('shortcuts-modal-backdrop');

        if (previewModal && previewModal.classList.contains('is-open')) {
          closeStoryModal();
          return;
        }
        if (exportModal && exportModal.classList.contains('is-open')) {
          closeExportModal();
          return;
        }
        if (shortcutsModal && shortcutsModal.classList.contains('is-open')) {
          shortcutsModal.classList.remove('is-open');
          document.body.style.overflow = '';
          return;
        }
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          state.searchQuery = '';
          applyFiltersAndSort();
          return;
        }
      }

      // Inside Modal Arrow Navigation
      const previewModal = document.getElementById('preview-modal-backdrop');
      if (previewModal && previewModal.classList.contains('is-open')) {
        if (e.key === 'ArrowLeft') {
          if (state.currentModalIndex > 0) openStoryModal(state.currentModalIndex - 1);
        } else if (e.key === 'ArrowRight') {
          if (state.currentModalIndex < state.filteredNews.length - 1) openStoryModal(state.currentModalIndex + 1);
        }
        return;
      }

      // Outside inputs shortcuts
      if (isInput) return;

      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (keyLower === 'r' && !isCtrl && !e.altKey) {
        e.preventDefault();
        triggerFeedSync();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        cycleTheme();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        const newMode = state.viewMode === 'grid' ? 'list' : 'grid';
        if (newMode === 'grid') gridBtn.click();
        else listBtn.click();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        bookmarksBtn.click();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        openExportModal();
      } else if (e.key === '?') {
        e.preventDefault();
        shortcutsModal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 15. Initialization Lifecycle & State Recovery
  // ---------------------------------------------------------------------------
  async function checkSyncStateOnStartup() {
    try {
      // Query Endpoint 1 upon refresh / load to know current syncing state
      const status = await fetchSyncStatus();
      if (status && status.is_syncing) {
        // Feed is already syncing in backend - restore real-time tracking until synced
        showToast('Feed synchronization active in background. Tracking live progress...', 'info', 3500);
        startSyncTracking();
        // Concurrently populate existing news so user has immediate content
        await fetchNewsData();
      } else {
        // Idle state: normal news fetch
        await fetchNewsData();
      }
    } catch (err) {
      console.warn('Startup sync check error:', err);
      await fetchNewsData();
    }
  }

  function init() {
    readUrlParams();
    applyTheme(state.theme);
    updateSoundIcon();

    // Initial View Mode button states
    const gridBtn = document.getElementById('view-grid-btn');
    const listBtn = document.getElementById('view-list-btn');
    if (gridBtn && listBtn) {
      if (state.viewMode === 'list') {
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
      } else {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
      }
    }

    // Set initial input/select controls from URL if present
    const searchInput = document.getElementById('global-search-input');
    if (searchInput && state.searchQuery) {
      searchInput.value = state.searchQuery;
      const clearBtn = document.getElementById('search-clear-btn');
      if (clearBtn) clearBtn.style.display = 'flex';
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect && state.sortOrder) sortSelect.value = state.sortOrder;

    const statusSelect = document.getElementById('status-filter-select');
    if (statusSelect && state.activeStatus) statusSelect.value = state.activeStatus;

    updateTopicChips();
    setupBackToTopButton();
    setupEventListeners();

    // Setup 7-minute periodic sync check interval ("7 min. setInterval to re-check if synced ~ until synced")
    const SEVEN_MINUTES_MS = 7 * 60 * 1000;
    setInterval(async () => {
      try {
        const status = await fetchSyncStatus();
        if (status && status.is_syncing) {
          if (!state.isSyncing) {
            startSyncTracking();
          }
        }
      } catch (err) {
        console.warn('Periodic 7-minute sync check error:', err);
      }
    }, SEVEN_MINUTES_MS);

    // Upon refresh or initial boot, know the state from the backend and update accordingly
    checkSyncStateOnStartup();
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
