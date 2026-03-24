import { shouldKeepMenuOpenOnDocumentClick } from './karposMenuDocumentClick';

describe('shouldKeepMenuOpenOnDocumentClick', () => {
  let menu: HTMLDivElement;
  let startBtn: HTMLButtonElement;
  let folderBtn: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    menu = document.createElement('div');
    menu.id = 'start-menu';
    folderBtn = document.createElement('button');
    folderBtn.type = 'button';
    folderBtn.textContent = 'Accessories';
    const label = document.createElement('span');
    label.appendChild(document.createTextNode('Label'));
    folderBtn.appendChild(label);
    menu.appendChild(folderBtn);
    document.body.appendChild(menu);

    startBtn = document.createElement('button');
    startBtn.id = 'start-button';
    document.body.appendChild(startBtn);
  });

  function makeClickEvent(target: EventTarget): MouseEvent {
    const e = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(e, 'target', { value: target, enumerable: true });
    return e;
  }

  it('returns true when target is a Text node inside the menu (no Element.closest)', () => {
    const textNode = folderBtn.querySelector('span')!.firstChild as Text;
    expect(textNode.nodeType).toBe(Node.TEXT_NODE);

    const e = makeClickEvent(textNode);
    expect(shouldKeepMenuOpenOnDocumentClick(e, menu, startBtn)).toBe(true);
  });

  it('returns true when target is a button inside the menu', () => {
    const e = makeClickEvent(folderBtn);
    expect(shouldKeepMenuOpenOnDocumentClick(e, menu, startBtn)).toBe(true);
  });

  it('returns true when target is inside start button', () => {
    const e = makeClickEvent(startBtn);
    expect(shouldKeepMenuOpenOnDocumentClick(e, menu, startBtn)).toBe(true);
  });

  it('returns false when target is outside menu and start button', () => {
    const desktop = document.createElement('div');
    desktop.id = 'desktop';
    document.body.appendChild(desktop);
    const e = makeClickEvent(desktop);
    expect(shouldKeepMenuOpenOnDocumentClick(e, menu, startBtn)).toBe(false);
  });

  it('uses composedPath when target is not enough', () => {
    const e = makeClickEvent(folderBtn);
    const orig = e.composedPath;
    e.composedPath = () => [folderBtn, menu, document.body, document, window];
    expect(shouldKeepMenuOpenOnDocumentClick(e, menu, startBtn)).toBe(true);
    e.composedPath = orig;
  });
});
