const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../config/database');
const customerSvc = require('../services/customerService');
const mikrotikService = require('../services/mikrotikService');
const router = require('../routes/adminPortal');

const updateLayer = router.stack.find(layer =>
  layer.route?.path === '/customers/:id/update' && layer.route.methods.post,
);
const updateHandler = updateLayer?.route.stack.at(-1)?.handle;

test('saves a local PPPoE customer edit when RouterOS has no matching secret', async t => {
  assert.equal(typeof updateHandler, 'function', 'customer update route should be registered');

  const originals = {
    prepare: db.prepare,
    getEffectiveRouterId: customerSvc.getEffectiveRouterId,
    getCustomerById: customerSvc.getCustomerById,
    getPackageById: customerSvc.getPackageById,
    updateCustomer: customerSvc.updateCustomer,
    getPppoeSecretByName: mikrotikService.getPppoeSecretByName,
    getConnection: mikrotikService.getConnection,
    setPppoeProfile: mikrotikService.setPppoeProfile,
    createPppoeSecret: mikrotikService.createPppoeSecret,
  };

  t.after(() => {
    db.prepare = originals.prepare;
    customerSvc.getEffectiveRouterId = originals.getEffectiveRouterId;
    customerSvc.getCustomerById = originals.getCustomerById;
    customerSvc.getPackageById = originals.getPackageById;
    customerSvc.updateCustomer = originals.updateCustomer;
    mikrotikService.getPppoeSecretByName = originals.getPppoeSecretByName;
    mikrotikService.getConnection = originals.getConnection;
    mikrotikService.setPppoeProfile = originals.setPppoeProfile;
    mikrotikService.createPppoeSecret = originals.createPppoeSecret;
  });

  let updateCalled = false;
  db.prepare = sql => {
    if (String(sql).includes('SELECT id, name FROM customers WHERE router_id IS ?')) {
      return { get: () => undefined };
    }
    return originals.prepare(sql);
  };
  customerSvc.getEffectiveRouterId = () => 7;
  customerSvc.getCustomerById = () => ({
    id: 101,
    connection_type: 'pppoe',
    pppoe_username: 'regression-test-user',
    router_id: 7,
  });
  customerSvc.getPackageById = () => ({ name: 'test-profile' });
  customerSvc.updateCustomer = () => { updateCalled = true; };
  mikrotikService.getPppoeSecretByName = async () => null;
  mikrotikService.getConnection = async () => {
    throw new Error('Tried to process unknown reply: !empty');
  };
  mikrotikService.setPppoeProfile = async () => {
    throw new Error('Must not modify RouterOS in this test');
  };
  mikrotikService.createPppoeSecret = async () => {
    throw new Error('Must not modify RouterOS in this test');
  };

  const req = {
    params: { id: '101' },
    body: {
      connection_type: 'pppoe',
      router_id: '7',
      pppoe_username: 'regression-test-user',
      pppoe_password: '',
      package_id: '1',
      status: 'active',
    },
    session: {},
  };
  const res = { redirect: path => { assert.equal(path, '/admin/customers'); } };

  await updateHandler(req, res);

  assert.equal(updateCalled, true, 'local customer update should execute');
  assert.equal(req.session._msg.type, 'warning');
  assert.match(req.session._msg.text, /berhasil diperbarui/i);
  assert.doesNotMatch(req.session._msg.text, /Gagal memperbarui/i);
});
