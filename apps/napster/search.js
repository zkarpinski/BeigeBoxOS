/**
 * Napster v2.0 BETA – Search tab logic.
 */
(function () {
  'use strict';

  var ns = window.Napster97;
  if (!ns) return;

  var artistInput   = document.getElementById('nap-artist');
  var titleInput    = document.getElementById('nap-title');
  var resultsBody   = document.getElementById('nap-results-body');
  var resultsCount  = document.getElementById('nap-results-count');

  function renderResults(results) {
    ns.searchResults = results;
    ns.selectedRow   = null;

    if (!resultsBody) return;
    resultsBody.innerHTML = '';

    if (results.length === 0) {
      resultsCount.textContent = 'No results found.';
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 8;
      td.style.textAlign = 'center';
      td.style.padding   = '8px';
      td.style.color     = '#888';
      td.textContent = 'No files found. Try a different search.';
      tr.appendChild(td);
      resultsBody.appendChild(tr);
      return;
    }

    resultsCount.textContent = 'Returned ' + results.length + ' results.';

    results.forEach(function (r, idx) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-idx', idx);

      var tdFn = document.createElement('td');
      tdFn.className = 'col-filename';
      var dot = document.createElement('span');
      dot.className = 'napster-dot ' + r.dot;
      tdFn.appendChild(dot);
      tdFn.appendChild(document.createTextNode(r.filename));

      function mkTd(text, cls) {
        var td = document.createElement('td');
        td.className = cls || '';
        td.textContent = text;
        return td;
      }

      tr.appendChild(tdFn);
      tr.appendChild(mkTd(r.filesize, 'col-filesize'));
      tr.appendChild(mkTd(r.bitrate, 'col-bitrate'));
      tr.appendChild(mkTd(r.freq, 'col-freq'));
      tr.appendChild(mkTd(r.length, 'col-length'));
      tr.appendChild(mkTd(r.user, 'col-user'));
      tr.appendChild(mkTd(r.linespeed, 'col-linespeed'));
      tr.appendChild(mkTd(r.ping === 9999 ? 'N/A' : r.ping, 'col-ping'));

      tr.addEventListener('click', function () {
        document.querySelectorAll('#nap-results-body tr.selected').forEach(function (el) {
          el.classList.remove('selected');
        });
        tr.classList.add('selected');
        ns.selectedRow = idx;
      });

      tr.addEventListener('dblclick', function () {
        ns.selectedRow = idx;
        downloadSelected();
      });

      resultsBody.appendChild(tr);
    });
  }

  function doSearch() {
    var q = (artistInput ? artistInput.value : '') + ' ' + (titleInput ? titleInput.value : '');
    q = q.trim();
    if (!q) return;

    // Quick visual feedback
    if (resultsCount) resultsCount.textContent = 'Searching...';
    if (resultsBody)  resultsBody.innerHTML = '';

    setTimeout(function () {
      var results = ns.search(q);
      renderResults(results);
    }, ns.rnd(600, 1400));
  }

  document.getElementById('nap-find')?.addEventListener('click', doSearch);
  document.getElementById('nap-clear')?.addEventListener('click', function () {
    if (artistInput) artistInput.value = '';
    if (titleInput)  titleInput.value  = '';
    if (resultsBody) resultsBody.innerHTML = '';
    if (resultsCount) resultsCount.textContent = '';
    ns.searchResults = [];
    ns.selectedRow   = null;
  });

  // Enter key in either input
  [artistInput, titleInput].forEach(function (inp) {
    if (inp) inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSearch();
    });
  });

  function downloadSelected() {
    var idx = ns.selectedRow;
    if (idx === null || idx === undefined) {
      Windows97.alert('Napster', 'Please select a song first.');
      return;
    }
    var result = ns.searchResults[idx];
    if (!result) return;

    // Check not already downloading
    var already = ns.downloads.some(function (d) {
      return d.filename === result.filename && d.status !== 'complete' && d.status !== 'cancelled';
    });
    if (already) {
      Windows97.alert('Napster', result.filename + '\n\nThis file is already downloading.', 'warning');
      return;
    }

    ns.addDownload(result);
    ns.switchTab('transfer');
  }

  document.getElementById('nap-get-song')?.addEventListener('click', downloadSelected);
  document.getElementById('nap-hotlist')?.addEventListener('click', function () {
    var idx = ns.selectedRow;
    if (idx === null || idx === undefined) { Windows97.alert('Napster', 'Select a song first.'); return; }
    Windows97.alert('Napster', 'Added to Hot List!\n\n' + ns.searchResults[idx].filename, 'info');
  });

  ns.doSearch = doSearch;

  // Pre-populate *NSYNC on load
  if (artistInput) artistInput.value = '*NSYNC';
  if (resultsCount) resultsCount.textContent = 'Searching...';
  setTimeout(function () {
    var results = ns.search('nsync');
    renderResults(results);
  }, 800);
})();
