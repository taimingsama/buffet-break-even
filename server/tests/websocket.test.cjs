const test = require('node:test')
const assert = require('node:assert/strict')
const {spawn} = require('node:child_process')
const path = require('node:path')
const {WebSocket} = require('ws')

test('真实 HTTP/WebSocket：双端广播、成员权限、恢复、限流与协议版本', {timeout: 15000}, async t => {
  const child = spawn(process.execPath, [path.resolve(__dirname, '../dist/index.cjs')], {
    env: {...process.env, PORT: '0', HOST: '127.0.0.1'}, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  })
  t.after(() => child.kill())
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server startup timeout')), 5000)
    child.once('error', reject)
    child.stdout.on('data', data => {const match = data.toString().match(/listening on (\d+)/); if (match) {clearTimeout(timer); resolve(Number(match[1]))}})
    child.once('exit', code => {clearTimeout(timer); reject(new Error(`server exited ${code}`))})
  })
  const health = await (await fetch(`http://127.0.0.1:${port}/health`)).json()
  assert.deepEqual(health, {status: 'ok', version: require('../package.json').version, protocolVersion: 2})
  let sequence = 0
  async function connect() {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    const inbox = [], waiting = new Map()
    t.after(() => ws.terminate())
    ws.on('message', data => {const message = JSON.parse(data); inbox.push(message); const callback = waiting.get(message.requestId); if (callback) {waiting.delete(message.requestId); callback(message)}})
    await new Promise((resolve, reject) => {ws.once('open', resolve); ws.once('error', reject)})
    return {ws, inbox, send(command, params = {}, protocolVersion = 2) {
      const requestId = `transport-${++sequence}`
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`request timeout ${command}`)), 3000)
        waiting.set(requestId, message => {clearTimeout(timer); resolve(message)})
        ws.send(JSON.stringify({protocolVersion, requestId, command, params: {typeId: 'sukiyaki', restaurantId: 'niuniu', ...params}}))
      })
    }}
  }
  const a = await connect(), b = await connect()
  const created = await a.send('create', {nickname: '房主', ticketPrice: 300, entryKey: 'a'.repeat(40)})
  const joined = await b.send('join', {nickname: '朋友', code: created.snapshot.code, entryKey: 'b'.repeat(40)})
  await Promise.all([a.send('changeSelection', {productId: 'niuniu-p1-1', change: 1}), b.send('changeSelection', {productId: 'niuniu-p1-1', change: 1})])
  const latest = await b.send('sync')
  assert.equal(latest.snapshot.drafts.niuniu.selected['niuniu-p1-1'], 2)
  assert.equal((await b.send('commitRound', {expectedRevision: latest.snapshot.revision})).code, 'FORBIDDEN')
  assert.equal((await b.send('end', {expectedRevision: latest.snapshot.revision})).code, 'FORBIDDEN')
  const ended = await a.send('end', {expectedRevision: latest.snapshot.revision})
  assert.equal(ended.snapshot.receipt.value, 20)
  assert.equal(ended.snapshot.receipt.price, 300)
  const final = await b.send('sync')
  assert.deepEqual(final.snapshot.receipt, ended.snapshot.receipt)
  assert.ok(b.inbox.some(m => m.type === 'snapshot' && m.operation === 'end'))
  b.ws.close()
  await new Promise(resolve => b.ws.once('close', resolve))
  const restored = await connect()
  assert.equal((await restored.send('resume', joined.identity)).snapshot.receipt.id, ended.snapshot.id)
  assert.equal((await restored.send('sync', {}, 1)).code, 'PROTOCOL_MISMATCH')
  const custom = await connect()
  const catalog = {typeId: 'custom', typeName: '自定义', restaurants: ['niuniu', 'daniu', 'yixu'].map(id => require(`../../src/data/restaurants/${id}.json`))}
  assert.ok(Buffer.byteLength(JSON.stringify(catalog)) > 16384)
  const customRoom = await custom.send('create', {typeId: 'custom', catalog, nickname: '自定义房主', ticketPrice: 150, entryKey: 'custom'.repeat(8)})
  assert.equal(customRoom.type, 'response')
  assert.equal(customRoom.catalog.restaurants.length, 3)
  assert.equal(customRoom.snapshot.typeId, 'custom')
  const visitor = await connect()
  for (let i = 0; i < 31; i++) await visitor.send('join', {nickname: '朋友', code: '000000', entryKey: 'c'.repeat(40)})
  assert.equal(visitor.inbox.at(-1).code, 'RATE_LIMIT')
})
