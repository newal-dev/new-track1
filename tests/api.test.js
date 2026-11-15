import test from 'node:test';
import assert from 'node:assert';
const U = 'http://localhost:3000/v1';
const post = (path, body) => fetch(U + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('health works', async () => { assert.equal((await fetch(U + '/health')).status, 200); });
test('jobs list has accommodations', async () => {
  const j = await (await fetch(U + '/jobs')).json();
  assert.ok(j.length > 0 && Array.isArray(j[0].offers));
});
test('empty registration is rejected', async () => { assert.equal((await post('/learners', {})).status, 422); });
test('valid registration returns only an id', async () => {
  const r = await post('/learners', { fullName: 'Test Person', contact: '0911000000', support: ['large'] });
  assert.equal(r.status, 201);
  assert.deepEqual(Object.keys(await r.json()), ['id']);
});