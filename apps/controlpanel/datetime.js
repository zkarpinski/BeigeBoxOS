/**
 * Control Panel – Date/Time Properties applet.
 * Lets the user preview and set a Win98 time offset stored in localStorage.
 */
(function () {
  'use strict';

  var cp = window.ControlPanel97;
  if (!cp) return;

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  var dialog = null;
  var monthSelect = null;
  var yearInput = null;
  var calBody = null;
  var clockCanvas = null;
  var timeInput = null;
  var tickInterval = null;
  var workDate = null;

  /* ── Restore persisted offset ── */
  var stored = parseInt(localStorage.getItem('win98-time-offset'), 10);
  if (!isNaN(stored)) window.Win98TimeOffset = stored;

  /* ── Drag helper ── */
  function addDrag(dlg, handle) {
    var ox = 0, oy = 0, dragging = false;
    handle.addEventListener('mousedown', function (e) {
      if (e.target.closest('.dp-titlebtn')) return;
      dragging = true;
      var r = dlg.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var x = Math.max(0, Math.min(e.clientX - ox, window.innerWidth  - dlg.offsetWidth));
      var y = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - dlg.offsetHeight));
      dlg.style.left = x + 'px';
      dlg.style.top  = y + 'px';
    });
    document.addEventListener('mouseup', function () { dragging = false; });
  }

  /* ── Build month dropdown ── */
  function buildMonthSelect() {
    monthSelect.innerHTML = '';
    MONTHS.forEach(function (m, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = m;
      monthSelect.appendChild(opt);
    });
  }

  /* ── Build calendar grid ── */
  function buildCalendar() {
    var y = workDate.getFullYear();
    var m = workDate.getMonth();
    var d = workDate.getDate();

    monthSelect.value = m;
    yearInput.value   = y;

    calBody.innerHTML = '';
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    var row = document.createElement('tr');
    for (var pad = 0; pad < firstDay; pad++) {
      row.appendChild(document.createElement('td')).className = 'dt-empty';
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var td = document.createElement('td');
      td.textContent = day;
      if (day === d) td.classList.add('dt-selected');
      (function (dayNum) {
        td.addEventListener('click', function () {
          workDate.setDate(dayNum);
          buildCalendar();
        });
      }(day));
      row.appendChild(td);
      if (row.children.length === 7) {
        calBody.appendChild(row);
        row = document.createElement('tr');
      }
    }
    if (row.children.length > 0) calBody.appendChild(row);
  }

  /* ── Draw analog clock ── */
  function drawClock() {
    if (!clockCanvas) return;
    var ctx = clockCanvas.getContext('2d');
    var cx = 60, cy = 60, r = 56;
    ctx.clearRect(0, 0, 120, 120);

    // Face
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tick marks
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      var inner = i % 3 === 0 ? r - 10 : r - 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
      ctx.strokeStyle = '#333';
      ctx.lineWidth = i % 3 === 0 ? 2 : 1;
      ctx.stroke();
    }

    var h = workDate.getHours() % 12;
    var m = workDate.getMinutes();
    var s = workDate.getSeconds();

    function hand(angle, length, width, color) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    hand((h / 12 + m / 720) * Math.PI * 2 - Math.PI / 2, 30, 3, '#222');
    hand((m / 60 + s / 3600) * Math.PI * 2 - Math.PI / 2, 42, 2, '#222');
    hand(s / 60 * Math.PI * 2 - Math.PI / 2, 48, 1, '#c00');

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
  }

  /* ── Sync time input field ── */
  function syncTimeInput() {
    var h = String(workDate.getHours()).padStart(2, '0');
    var m = String(workDate.getMinutes()).padStart(2, '0');
    var s = String(workDate.getSeconds()).padStart(2, '0');
    timeInput.value = h + ':' + m + ':' + s;
  }

  /* ── Tick ── */
  function tick() {
    workDate = new Date(workDate.getTime() + 1000);
    drawClock();
    syncTimeInput();
  }

  /* ── Apply offset ── */
  function applyOffset() {
    window.Win98TimeOffset = workDate.getTime() - Date.now();
    localStorage.setItem('win98-time-offset', String(window.Win98TimeOffset));
  }

  /* ── Open ── */
  function openDialog() {
    if (!dialog) {
      dialog = document.getElementById('datetime-dialog');
      monthSelect = document.getElementById('dt-month-select');
      yearInput   = document.getElementById('dt-year-input');
      calBody     = document.getElementById('dt-calendar-body');
      clockCanvas = document.getElementById('dt-clock-canvas');
      timeInput   = document.getElementById('dt-time-input');

      buildMonthSelect();

      monthSelect.addEventListener('change', function () {
        workDate.setMonth(parseInt(this.value, 10));
        buildCalendar();
      });
      yearInput.addEventListener('change', function () {
        var y = parseInt(this.value, 10);
        if (!isNaN(y)) { workDate.setFullYear(y); buildCalendar(); }
      });
      timeInput.addEventListener('change', function () {
        var parts = this.value.split(':').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0])) {
          workDate.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0);
          drawClock();
        }
      });

      document.getElementById('dt-apply-btn').addEventListener('click', applyOffset);
      document.getElementById('dt-ok-btn').addEventListener('click', function () {
        applyOffset();
        closeDialog();
      });
      document.getElementById('dt-cancel-btn').addEventListener('click', closeDialog);
      document.getElementById('dt-close-btn').addEventListener('click', closeDialog);

      addDrag(dialog, dialog.querySelector('.dp-titlebar'));
    }

    workDate = new Date(Date.now() + (window.Win98TimeOffset || 0));
    buildCalendar();
    drawClock();
    syncTimeInput();

    dialog.removeAttribute('hidden');
    var w = 370;
    dialog.style.left = Math.round((window.innerWidth  - w) / 2) + 'px';
    dialog.style.top  = Math.round((window.innerHeight - (dialog.offsetHeight || 320)) / 2) + 'px';
    var h = dialog.offsetHeight;
    dialog.style.top  = Math.round((window.innerHeight - h) / 2) + 'px';

    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(tick, 1000);
  }

  function closeDialog() {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
    if (dialog) dialog.setAttribute('hidden', '');
  }

  /* ── Wire CP icon ── */
  var icon = document.getElementById('cp-applet-datetime');
  if (icon) {
    var clicks = 0, clickTimer = null;
    icon.addEventListener('click', function () {
      document.querySelectorAll('.cp-applet-icon').forEach(function (el) { el.classList.remove('selected'); });
      icon.classList.add('selected');
      clicks++;
      if (clicks === 1) {
        clickTimer = setTimeout(function () { clicks = 0; }, 350);
      } else {
        clearTimeout(clickTimer);
        clicks = 0;
        openDialog();
      }
    });
    icon.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.cp-applet-icon').forEach(function (el) { el.classList.remove('selected'); });
      icon.classList.add('selected');
      clearTimeout(clickTimer);
      clicks = 0;
      openDialog();
    });
  }

  cp.openDateTimeDialog = openDialog;
})();
