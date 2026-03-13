/**
 * Unit tests for menu bar (menu IDs and structure).
 */
describe('Menus', () => {
  test('required menu dropdown IDs exist when DOM has them', () => {
    const menuIds = ['file', 'edit', 'view', 'insert', 'format', 'tools', 'table', 'window', 'help'];
    menuIds.forEach((name) => {
      const menu = document.getElementById('menu-' + name);
      if (menu) {
        expect(menu.id).toBe('menu-' + name);
      }
    });
  });

  test('menu-file exists in setup', () => {
    expect(document.getElementById('menu-file')).toBeTruthy();
  });

  test('about-dialog exists in setup', () => {
    expect(document.getElementById('about-dialog')).toBeTruthy();
  });
});
