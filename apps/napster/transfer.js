/**
 * Napster v2.0 BETA – Transfer tab: download simulation.
 */
(function () {
  'use strict';

  var ns = window.Napster97;
  if (!ns) return;

  var transferBody  = document.getElementById('nap-transfer-body');
  var dlCountEl     = document.getElementById('nap-dl-count');
  var statusLeft    = document.getElementById('nap-status-left');
  var statusRight   = document.getElementById('nap-status-right');
  var libraryBody   = document.getElementById('nap-library-body');
  var libCountEl    = document.getElementById('nap-lib-count');

  ns.library = ns.library || [];

  var TICK_MS = 500;  // update interval

  // Speed in KB/s per connection type
  var SPEED_KBPS = {
    '56K Modem': function () { return ns.rnd(3, 7); },
    'ISDN':      function () { return ns.rnd(8, 15); },
    'DSL':       function () { return ns.rnd(20, 50); },
    'Cable':     function () { return ns.rnd(30, 80); },
    'T1':        function () { return ns.rnd(60, 150); },
    'T3':        function () { return ns.rnd(100, 300); },
    'Unknown':   function () { return ns.rnd(5, 60); },
  };

  function speedFn(linespeed) {
    return (SPEED_KBPS[linespeed] || SPEED_KBPS['Unknown']);
  }

  // Status progression
  function getStatus(pct) {
    if (pct < 3)  return 'Getting Info...';
    if (pct < 8)  return 'Connecting...';
    if (pct < 100) return 'Downloading...';
    return 'File Complete!';
  }

  function fmtTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '--:--';
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  // ── Library helpers ─────────────────────────────────────────────────────────

  function renderLibrary() {
    if (!libraryBody) return;
    libraryBody.innerHTML = '';

    if (ns.library.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'napster-lib-empty';
      empty.textContent = 'No songs yet. Download songs using the Search tab.';
      libraryBody.appendChild(empty);
      if (libCountEl) libCountEl.textContent = '';
      return;
    }

    if (libCountEl) libCountEl.textContent = ns.library.length + ' song' + (ns.library.length === 1 ? '' : 's') + ' in library.';

    ns.library.forEach(function (item, idx) {
      var row = document.createElement('div');
      row.className = 'napster-library-row';
      row.setAttribute('data-libidx', idx);

      function mkLibTd(text, cls) {
        var d = document.createElement('div');
        d.className = 'napster-lib-td ' + (cls || '');
        d.textContent = text;
        d.title = text;
        return d;
      }

      row.appendChild(mkLibTd(item.filename, 'lcol-filename'));
      row.appendChild(mkLibTd(item.filesize, 'lcol-filesize'));
      row.appendChild(mkLibTd(item.bitrate, 'lcol-bitrate'));
      row.appendChild(mkLibTd(item.freq, 'lcol-freq'));
      row.appendChild(mkLibTd(item.length, 'lcol-length'));
      row.appendChild(mkLibTd('C:\\My Napster\\Music\\' + item.filename, 'lcol-path'));

      row.addEventListener('click', function () {
        document.querySelectorAll('#nap-library-body .napster-library-row.selected').forEach(function (el) {
          el.classList.remove('selected');
        });
        row.classList.add('selected');
        ns.selectedLibRow = idx;
      });

      row.addEventListener('dblclick', function () {
        ns.selectedLibRow = idx;
        window.open(spotifyUrl(item), '_blank');
      });

      libraryBody.appendChild(row);
    });
  }

  function addToLibrary(dl) {
    // avoid duplicates
    var exists = ns.library.some(function (item) { return item.filename === dl.filename; });
    if (exists) return;
    ns.library.push({
      filename:  dl.filename,
      filesize:  dl.filesizeStr,
      bitrate:   dl.bitrate   || '128 kbps',
      freq:      dl.freq      || '44100 Hz',
      length:    dl.length    || '--:--',
      rawArtist: dl.rawArtist || '',
      rawTitle:  dl.rawTitle  || '',
    });
    renderLibrary();
  }

  ns.renderLibrary = renderLibrary;

  // Add a download (called from search.js)
  function addDownload(result) {
    var rateKbps  = speedFn(result.linespeed)();
    var totalKb   = result.filesizeBytes / 1024;

    ns.downloads.push({
      id:           Date.now() + Math.random(),
      filename:     result.filename,
      filesizeBytes: result.filesizeBytes,
      filesizeStr:  result.filesize,
      bitrate:      result.bitrate,
      freq:         result.freq,
      length:       result.length,
      rawArtist:    result.rawArtist,
      rawTitle:     result.rawTitle,
      user:         result.user,
      linespeed:    result.linespeed,
      status:       'Getting Info...',
      rateKbps:     rateKbps,
      progress:     0,          // 0-100
      downloadedKb: 0,
      totalKb:      totalKb,
      cancelled:    false,
      rowEl:        null,
    });

    renderTransferTable();
    updateCounts();
  }

  ns.addDownload = addDownload;

  // Render the full transfer table
  function renderTransferTable() {
    if (!transferBody) return;
    transferBody.innerHTML = '';

    ns.downloads.forEach(function (dl) {
      if (dl.rowEl) {
        // row already exists — re-attach it after the innerHTML clear
        transferBody.appendChild(dl.rowEl);
        return;
      }
      var row = document.createElement('div');
      row.className = 'napster-transfer-row';
      row.setAttribute('data-dlid', dl.id);

      row.innerHTML =
        '<div class="napster-td tcol-icon napster-dl-icon">⬇</div>' +
        '<div class="napster-td tcol-filename nap-td-fn" title="' + dl.filename + '">' + dl.filename + '</div>' +
        '<div class="napster-td tcol-filesize">' + dl.filesizeStr + '</div>' +
        '<div class="napster-td tcol-user">' + dl.user + '</div>' +
        '<div class="napster-td tcol-status nap-td-status">Getting Info...</div>' +
        '<div class="napster-td tcol-speed">' + dl.linespeed + '</div>' +
        '<div class="napster-td tcol-progress">' +
          '<div class="napster-progress-cell">' +
            '<div class="napster-progress-fill nap-fill" style="width:0%"></div>' +
            '<div class="napster-progress-text nap-pct">0%</div>' +
          '</div>' +
        '</div>' +
        '<div class="napster-td tcol-rate nap-td-rate">—</div>' +
        '<div class="napster-td tcol-timeleft nap-td-time">—</div>';

      dl.rowEl = row;
      transferBody.appendChild(row);
    });
  }

  // Tick: advance all active downloads
  function tick() {
    var anyActive = false;

    ns.downloads.forEach(function (dl) {
      if (dl.cancelled || dl.progress >= 100) return;
      anyActive = true;

      // Vary rate slightly each tick
      var rate = dl.rateKbps * (0.7 + Math.random() * 0.6);
      dl.downloadedKb += rate * (TICK_MS / 1000);
      dl.downloadedKb = Math.min(dl.downloadedKb, dl.totalKb);
      dl.progress = Math.min(100, Math.round((dl.downloadedKb / dl.totalKb) * 100));
      dl.status = getStatus(dl.progress);
      dl.currentRate = rate;

      var remaining = (dl.totalKb - dl.downloadedKb) / rate;

      // Update DOM row
      var row = dl.rowEl;
      if (!row) return;

      var statusEl = row.querySelector('.nap-td-status');
      var fillEl   = row.querySelector('.nap-fill');
      var pctEl    = row.querySelector('.nap-pct');
      var rateEl   = row.querySelector('.nap-td-rate');
      var timeEl   = row.querySelector('.nap-td-time');

      if (statusEl) statusEl.textContent = dl.status;
      if (fillEl)   fillEl.style.width   = dl.progress + '%';
      if (pctEl)    pctEl.textContent    = dl.progress + '%';
      if (rateEl)   rateEl.textContent   = rate.toFixed(1) + ' k/s';
      if (timeEl)   timeEl.textContent   = dl.progress < 100 ? fmtTime(remaining) : '00:00';

      if (dl.progress >= 100) {
        dl.status = 'File Complete!';
        if (statusEl) statusEl.textContent = 'File Complete!';
        if (rateEl)   rateEl.textContent   = '—';
        if (timeEl)   timeEl.textContent   = '—';
        if (row) row.style.background = '#e8f5e8';
        // Brief flash of status bar
        updateStatusBar('File saved to C:\\My Napster\\Music\\' + dl.filename);
        setTimeout(function () { updateStatusBar(null); }, 4000);
        // Add to Library tab
        addToLibrary(dl);
      }
    });

    updateCounts();
  }

  function updateCounts() {
    var active = ns.downloads.filter(function (d) {
      return !d.cancelled && d.progress < 100;
    }).length;
    if (dlCountEl) dlCountEl.textContent = 'Concurrent Downloads: ' + active;
  }

  function updateStatusBar(msg) {
    if (!statusLeft) return;
    if (msg) {
      statusLeft.textContent = msg;
    } else {
      statusLeft.textContent = 'Online [F4$tRunn3r200] Sharing 0 Songs.';
    }
  }

  // Clear finished downloads
  document.getElementById('nap-clear-finished')?.addEventListener('click', function () {
    ns.downloads = ns.downloads.filter(function (d) {
      return d.progress < 100 && !d.cancelled;
    });
    if (transferBody) {
      transferBody.innerHTML = '';
      ns.downloads.forEach(function (dl) {
        if (dl.rowEl) transferBody.appendChild(dl.rowEl);
      });
    }
    updateCounts();
  });

  // Cancel selected / all
  document.getElementById('nap-cancel')?.addEventListener('click', function () {
    ns.downloads.forEach(function (dl) {
      if (dl.progress < 100) {
        dl.cancelled = true;
        if (dl.rowEl) {
          var statusEl = dl.rowEl.querySelector('.nap-td-status');
          if (statusEl) statusEl.textContent = 'Cancelled';
          dl.rowEl.style.color = '#888';
        }
      }
    });
    updateCounts();
  });

  // Global status bar stats
  function updateGlobalStats() {
    var totalSongs = ns.rnd(500000, 750000);
    var totalGB    = (totalSongs * 0.004).toFixed(0);
    var libraries  = ns.rnd(4000, 9000);
    if (statusRight) {
      statusRight.textContent =
        'Currently ' + totalSongs.toLocaleString() + ' songs [' + totalGB + ' gigabytes] available in ' + libraries.toLocaleString() + ' libraries.';
    }
  }

  function spotifyUrl(item) {
    var slug = (item.rawArtist + ' ' + item.rawTitle)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return 'https://open.spotify.com/search/' + encodeURIComponent(slug);
  }

  function playSelected() {
    if (ns.selectedLibRow === null || ns.selectedLibRow === undefined) {
      Windows97.alert('Napster', 'Select a song first.'); return;
    }
    var item = ns.library[ns.selectedLibRow];
    if (!item) return;
    window.open(spotifyUrl(item), '_blank');
  }

  // Library toolbar buttons
  document.getElementById('nap-lib-play')?.addEventListener('click', playSelected);
  document.getElementById('nap-lib-clear')?.addEventListener('click', function () {
    if (ns.selectedLibRow === null || ns.selectedLibRow === undefined) {
      Windows97.alert('Napster', 'Select a song first.'); return;
    }
    ns.library.splice(ns.selectedLibRow, 1);
    ns.selectedLibRow = null;
    renderLibrary();
  });
  document.getElementById('nap-lib-clear-all')?.addEventListener('click', function () {
    if (ns.library.length === 0) return;
    Windows97.confirm('Napster', 'Remove all songs from your library?').then(function (ok) {
      if (!ok) return;
      ns.library = [];
      ns.selectedLibRow = null;
      renderLibrary();
    });
  });

  // Start the download ticker
  setInterval(tick, TICK_MS);
  updateGlobalStats();
  updateStatusBar(null);
  updateCounts();
  renderLibrary();
})();
