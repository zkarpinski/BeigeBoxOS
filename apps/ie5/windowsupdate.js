/**
 * Windows Update — fake update page injected into IE5 via srcdoc.
 */
(function () {
    'use strict';

    function getWindowsUpdatePage() {
        return '<!DOCTYPE html>' +
            '<html><head><meta charset="utf-8">' +
            '<style>' +
            'body{margin:0;padding:0;font-family:Arial,sans-serif;font-size:12px;background:#fff;color:#000}' +
            'a{color:#0000cc;text-decoration:underline;cursor:pointer}' +
            '#header{background:linear-gradient(to bottom,#003399,#0066cc);padding:8px 12px;color:#fff;display:flex;align-items:center;gap:8px}' +
            '#header-title{font-size:18px;font-weight:bold}' +
            '#layout{display:flex;min-height:400px}' +
            '#sidebar{width:140px;background:#d4d0c8;border-right:1px solid #808080;padding:8px;flex-shrink:0}' +
            '#sidebar a{display:block;margin-bottom:6px;font-size:11px;color:#000099}' +
            '#main{flex:1;padding:16px}' +
            'h2{font-size:14px;font-weight:bold;margin:0 0 10px 0;color:#003399}' +
            '.phase{display:none}' +
            '.phase.active{display:block}' +
            '.dots{display:inline-block;min-width:24px}' +
            'table{border-collapse:collapse;width:100%;margin:10px 0}' +
            'th{background:#003399;color:#fff;padding:4px 6px;text-align:left;font-size:11px}' +
            'td{padding:4px 6px;border-bottom:1px solid #d4d0c8;font-size:11px;vertical-align:middle}' +
            'tr:nth-child(even) td{background:#f0f0f0}' +
            '.btn{border:2px outset #c0c0c0;background:#c0c0c0;padding:4px 14px;font-size:12px;cursor:pointer;font-family:Arial,sans-serif}' +
            '.btn:active{border-style:inset}' +
            '.progress-wrap{border:2px inset #808080;width:300px;height:18px;background:#fff;margin:12px 0}' +
            '.progress-bar{height:100%;width:0%;background:#000080;transition:none}' +
            '.notice{background:#ffffc0;border:1px solid #c0c000;padding:6px 10px;margin-bottom:10px;font-size:11px}' +
            '</style></head><body>' +
            '<div id="header">' +
            '<span style="font-size:22px">&#x1F5BC;</span>' +
            '<span id="header-title">Windows Update</span>' +
            '</div>' +
            '<div id="layout">' +
            '<div id="sidebar">' +
            '<b style="font-size:11px">Windows Update</b><br><br>' +
            '<a onclick="return false">Product Updates</a>' +
            '<a onclick="return false">Driver Updates</a>' +
            '<a onclick="return false">History</a>' +
            '<a onclick="return false">Support</a>' +
            '</div>' +
            '<div id="main">' +
            /* Phase 0: scanning */
            '<div class="phase active" id="phase0">' +
            '<h2>Welcome to Windows Update</h2>' +
            '<div class="notice">Windows Update is scanning your computer for the latest updates&hellip;</div>' +
            '<p>Scanning your computer<span class="dots" id="scan-dots"></span></p>' +
            '</div>' +
            /* Phase 1: found */
            '<div class="phase" id="phase1">' +
            '<h2>Critical Updates Available</h2>' +
            '<div class="notice"><b>3 critical updates</b> are available for your computer. These updates are important and should be installed immediately.</div>' +
            '<table>' +
            '<tr><th></th><th>Name</th><th>Description</th><th>Type</th><th>Size</th></tr>' +
            '<tr><td><input type="checkbox" checked></td>' +
            '<td><b>Security Update for Windows 98 (KB813951)</b></td>' +
            '<td>Fixes a vulnerability in MSHTML.DLL that could allow remote code execution.</td>' +
            '<td>Critical</td><td>1.2 MB</td></tr>' +
            '<tr><td><input type="checkbox" checked></td>' +
            '<td><b>Windows Media Player 6.4 Security Patch (KB828026)</b></td>' +
            '<td>Fixes a buffer overrun vulnerability when processing malformed ASX files.</td>' +
            '<td>Critical</td><td>0.8 MB</td></tr>' +
            '<tr><td><input type="checkbox" checked></td>' +
            '<td><b>Year 2000 Update for Windows 98 SE</b></td>' +
            '<td>Ensures Y2K date compliance across system components.</td>' +
            '<td>Critical</td><td>2.1 MB</td></tr>' +
            '</table>' +
            '<button class="btn" id="install-btn" onclick="startInstall()">Install Now</button>' +
            '</div>' +
            /* Phase 2: installing */
            '<div class="phase" id="phase2">' +
            '<h2>Downloading and Installing Updates&hellip;</h2>' +
            '<p id="install-status">Preparing installation&hellip;</p>' +
            '<div class="progress-wrap"><div class="progress-bar" id="prog-bar"></div></div>' +
            '<p id="install-pct">0%</p>' +
            '</div>' +
            /* Phase 3: complete */
            '<div class="phase" id="phase3">' +
            '<h2>Installation Complete</h2>' +
            '<div class="notice">Updates have been installed successfully. <b>You must restart your computer</b> to complete the installation.</div>' +
            '<p>The following updates were installed:</p>' +
            '<ul style="font-size:11px;margin:6px 0 14px 18px">' +
            '<li>Security Update for Windows 98 (KB813951)</li>' +
            '<li>Windows Media Player 6.4 Security Patch (KB828026)</li>' +
            '<li>Year 2000 Update for Windows 98 SE</li>' +
            '</ul>' +
            '<button class="btn" onclick="alert(\'Windows 98 is shutting down...\\n\\nIt is now safe to turn off your computer.\')">Restart Now</button>' +
            '</div>' +
            '</div></div>' +
            '<script>' +
            '(function(){' +
            'var phases=["phase0","phase1","phase2","phase3"];' +
            'function show(n){phases.forEach(function(id,i){' +
            'var el=document.getElementById(id);' +
            'if(el)el.className="phase"+(i===n?" active":"");' +
            '});}' +
            /* animated dots */
            'var dots=0;' +
            'var dotEl=document.getElementById("scan-dots");' +
            'var dotTimer=setInterval(function(){' +
            'dots=(dots+1)%4;' +
            'if(dotEl)dotEl.textContent=".".repeat(dots);' +
            '},400);' +
            /* auto-advance: scan -> found */
            'setTimeout(function(){clearInterval(dotTimer);show(1);},1800);' +
            /* install */
            'window.startInstall=function(){' +
            'show(2);' +
            'var updates=["Security Update (KB813951)","Media Player Patch (KB828026)","Y2K Update"];' +
            'var pct=0;' +
            'var bar=document.getElementById("prog-bar");' +
            'var status=document.getElementById("install-status");' +
            'var pctEl=document.getElementById("install-pct");' +
            'var timer=setInterval(function(){' +
            'pct+=1;' +
            'if(bar)bar.style.width=pct+"%";' +
            'if(pctEl)pctEl.textContent=pct+"%";' +
            'var idx=Math.min(Math.floor(pct/34),updates.length-1);' +
            'if(status)status.textContent="Installing: "+updates[idx]+"...";' +
            'if(pct>=100){clearInterval(timer);setTimeout(function(){show(3);},400);}' +
            '},35);' +
            '};' +
            '})();' +
            '<\/script>' +
            '</body></html>';
    }

    function open() {
        if (window.Windows97) window.Windows97.showApp('ie5');
        var iframe = document.getElementById('ie5-iframe');
        if (iframe) iframe.srcdoc = getWindowsUpdatePage();
        var urlInput = document.getElementById('ie5-url-input');
        if (urlInput) urlInput.value = 'http://windowsupdate.microsoft.com/';
        var titleText = document.getElementById('ie5-title-text');
        if (titleText) titleText.textContent = 'Windows Update - Microsoft Internet Explorer';
        var statusText = document.getElementById('ie5-status-text');
        if (statusText) statusText.textContent = 'Done';
    }

    window.WindowsUpdate97 = { open: open, _getPage: getWindowsUpdatePage };
})();
