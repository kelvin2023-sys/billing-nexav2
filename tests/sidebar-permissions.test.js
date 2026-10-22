const test = require('node:test');
const assert = require('node:assert/strict');
const sidebar = require('../services/sidebarMenuService');

test('activation-locked menu states are normalized to visible', () => {
  const states = sidebar.sanitizeMenuStates({ payroll: 'locked', inventory: 'hidden' });
  assert.equal(states.payroll, 'visible');
  assert.equal(states.inventory, 'hidden');
});

test('NexaID default menu configuration has no activation locks', () => {
  const states = sidebar.getStoredMenuStates();
  assert.equal(Object.values(states).includes('locked'), false);
  assert.equal(sidebar.getConfigMenus().some((menu) => menu.state === 'locked'), false);
});

test('clean database does not create legacy sidebar activation keys', () => {
  const db = require('../config/database');
  assert.equal(db.getAppSetting('sidebar_activation_keys', null), null);
});

