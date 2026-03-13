/**
 * MS-DOS Prompt - Windows 98 Logic
 */
(function () {
    'use strict';

    const msdosConsole = document.getElementById('msdos-console');
    const msdosHistory = document.getElementById('msdos-history');
    const msdosInputLine = document.querySelector('.msdos-input-line');
    const msdosInput = document.getElementById('msdos-input-field');
    const msdosWindow = document.getElementById('msdos-window');

    if (!msdosInput || !msdosHistory || !msdosConsole || !msdosWindow) return;

    window.MSDOS98 = {
        console: msdosConsole,
        history: msdosHistory,
        input: msdosInput,
        workingDir: 'C:\\WINDOWS',
    };

    function updatePrompt() {
        const promptEl = document.querySelector('.msdos-prompt');
        if (promptEl) {
            promptEl.textContent = `${window.MSDOS98.workingDir}>`;
        }
    }

    function appendHistory(text) {
        const div = document.createElement('div');
        div.textContent = text;
        msdosHistory.appendChild(div);
        msdosConsole.scrollTop = msdosConsole.scrollHeight;
    }

    function appendHTMLHistory(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        msdosHistory.appendChild(div);
        msdosConsole.scrollTop = msdosConsole.scrollHeight;
    }

    msdosConsole.addEventListener('click', () => {
        msdosInput.focus();
    });

    msdosInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = msdosInput.value;
            msdosInput.value = '';

            // Append the command to history
            appendHistory(`${window.MSDOS98.workingDir}>${val}`);

            const trimmed = val.trim();
            if (trimmed === '') return;

            const parts = trimmed.split(' ');
            const cmd = parts[0].toLowerCase();

            switch (cmd) {
                case 'cls':
                    msdosHistory.innerHTML = '';
                    break;
                case 'dir':
                    appendHistory(' Volume in drive C has no label');
                    appendHistory(' Volume Serial Number is 1337-0000');
                    appendHistory(' Directory of ' + window.MSDOS98.workingDir);
                    appendHistory('');
                    appendHistory('.              <DIR>        03-06-26  7:14p');
                    appendHistory('..             <DIR>        03-06-26  7:14p');
                    appendHistory('SYSTEM         <DIR>        03-06-26  7:14p');
                    appendHistory('COMMAND  COM        93,890  04-23-99 10:22p');
                    appendHistory('CONFIG   SYS            15  03-06-26  7:14p');
                    appendHistory('AUTOEXEC BAT            32  03-06-26  7:14p');
                    appendHistory('         3 file(s)         93,937 bytes');
                    appendHistory('         3 dir(s)     420,690,000 bytes free');
                    appendHistory('');
                    break;
                case 'echo':
                    appendHistory(parts.slice(1).join(' '));
                    break;
                case 'ver':
                    appendHistory('');
                    appendHistory('Windows 98 [Version 4.10.1998]');
                    appendHistory('');
                    break;
                case 'date':
                    const now = new Date();
                    appendHistory('Current date is ' + now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/,/g, ''));
                    break;
                case 'time':
                    const time = new Date();
                    appendHistory('Current time is ' + time.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(time.getMilliseconds() / 10));
                    break;
                case 'help':
                    appendHistory('Supported commands:');
                    appendHistory('  CLS    Clears the screen.');
                    appendHistory('  DATE   Displays the date.');
                    appendHistory('  DIR    Displays a list of files and subdirectories in a directory.');
                    appendHistory('  ECHO   Displays messages.');
                    appendHistory('  HELP   Provides Help information for Windows commands.');
                    appendHistory('  TIME   Displays the system time.');
                    appendHistory('  VER    Displays the Windows version.');
                    appendHistory('  EXIT   Quits the COMMAND.COM program (command interpreter).');
                    break;
                case 'cd':
                    if (parts.length > 1) {
                        if (parts[1] === '..') {
                            const pathParts = window.MSDOS98.workingDir.split('\\');
                            if (pathParts.length > 1) {
                                pathParts.pop();
                                window.MSDOS98.workingDir = pathParts.join('\\');
                                if (window.MSDOS98.workingDir === 'C:') {
                                    window.MSDOS98.workingDir = 'C:\\';
                                }
                            }
                        } else {
                            if (window.MSDOS98.workingDir.endsWith('\\')) {
                                window.MSDOS98.workingDir += parts[1];
                            } else {
                                window.MSDOS98.workingDir += '\\' + parts[1];
                            }
                        }
                        updatePrompt();
                    }
                    appendHistory('');
                    break;
                case 'exit':
                    if (window.Windows97) {
                        window.Windows97.hideApp('msdos');
                    }
                    break;
                default:
                    appendHistory(`Bad command or file name`);
                    break;
            }
            msdosConsole.scrollTop = msdosConsole.scrollHeight;
        }
    });
})();