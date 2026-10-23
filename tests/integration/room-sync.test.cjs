const test = require('node:test')
const assert = require('node:assert/strict')
const {loadModule, plain} = require('../helpers/runtime.cjs')
const {RoomService} = require('../../server/dist/service.cjs')

function fixture(service = new RoomService(), storage = new Map()) {
  const sockets = [], imports = []
  let view, dropNext = false, dropBefore = false
  const uni = {
    getStorageSync: key => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, plain(value)),
    connectSocket() {
      const handlers = {}
      const socket = {
        closed: false,
        onOpen(fn) {handlers.open = fn}, onClose(fn) {handlers.close = fn}, onError(fn) {handlers.error = fn}, onMessage(fn) {handlers.message = fn},
        send({data}) {
          const request = JSON.parse(data)
          this.commands.push(request.command)
          if (dropBefore && request.command === 'changeSelection') {dropBefore = false; this.close(); return}
          const dropping = dropNext && request.command === 'changeSelection'
          if (dropping) this.dropping = true
          service.handle(this.peer, request)
          if (dropping) {dropNext = false; this.close()}
        },
        close() {if (!this.closed) {this.closed = true; service.disconnect(this.peer); handlers.close?.()}},
        commands: [], dropping: false,
        receive(message) {if (!this.closed && !this.dropping) handlers.message?.({data: JSON.stringify(message)})},
        peer: null,
      }
      socket.peer = {send: message => socket.receive(message)}
      sockets.push(socket)
      queueMicrotask(() => handlers.open?.())
      return socket
    },
  }
  const {UniRoomGateway} = loadModule('contexts/dining/room/infrastructure/network/UniRoomGateway', uni)
  const gateway = new UniRoomGateway({present(...args) {view = {snapshot: args[0], memberId: args[1], status: args[2], message: args[3], busy: args[4], saved: args[5], resumable: args[6], catalog: args[7], restaurantId: args[8]}}}, receipt => imports.push(plain(receipt)))
  return {gateway, sockets, imports, storage, get view() {return view}, drop() {dropNext = true}, dropBefore() {dropBefore = true}, execute(command, params = {}) {return gateway.execute(command, {typeId: 'sukiyaki', restaurantId: 'niuniu', ...params})}}
}
test('两客户端共享、旧广播不回退、结束后本地缓存可独立导入', async t => {
  const service = new RoomService(), a = fixture(service), b = fixture(service)
  t.after(async () => {await a.execute('leave'); await b.execute('leave')})
  await a.execute('create', {url: 'ws://test/ws', nickname: '房主', ticketPrice: 200})
  await b.execute('join', {url: 'ws://test/ws', nickname: '成员', code: a.view.snapshot.code})
  const before = plain(a.view.snapshot)
  await Promise.all([a.execute('changeSelection', {productId: 'niuniu-p1-1', change: 1}), b.execute('changeSelection', {productId: 'niuniu-p1-1', change: 1})])
  assert.equal(a.view.snapshot.drafts.niuniu.selected['niuniu-p1-1'], 2)
  assert.equal(b.view.snapshot.drafts.niuniu.selected['niuniu-p1-1'], 2)
  a.sockets[0].receive({protocolVersion: 2, type: 'snapshot', operation: 'old', snapshot: before})
  assert.equal(a.view.snapshot.drafts.niuniu.selected['niuniu-p1-1'], 2)
  await a.execute('end', {expectedRevision: a.view.snapshot.revision})
  assert.equal(a.imports.at(-1).value, 20)
  assert.deepEqual(a.imports.at(-1), b.imports.at(-1))
  assert.equal(a.storage.get('buffet-room-v2').snapshot.receipt.value, 20)
})
test('已处理但确认丢失的请求，重连查询结果，不重复加菜', async t => {
  const a = fixture()
  t.after(() => a.execute('leave'))
  await a.execute('create', {url: 'ws://test/ws', nickname: '房主', ticketPrice: 200})
  a.drop()
  await assert.rejects(a.execute('changeSelection', {productId: 'niuniu-p1-1', change: 1}), /连接已断开/)
  assert.ok(a.storage.get('buffet-room-v2').pending)
  await a.execute('resume', {url: 'ws://test/ws'})
  assert.equal(a.view.snapshot.drafts.niuniu.selected['niuniu-p1-1'], 1)
  assert.deepEqual(a.sockets[1].commands, ['resume', 'requestStatus'])
  assert.equal(a.storage.get('buffet-room-v2').pending, undefined)
})
test('发送前写入凭证失败不发送操作，也不阻塞后续重试', async t => {
  const a = fixture()
  t.after(() => a.execute('leave'))
  await a.execute('create', {url: 'ws://test/ws', nickname: '房主', ticketPrice: 200})
  const savedSet = a.storage.set.bind(a.storage)
  a.storage.set = () => {throw new Error('full')}
  await assert.rejects(a.execute('changeSelection', {productId: 'niuniu-p1-1', change: 1}), /无法保存操作凭证/)
  a.storage.set = savedSet
  await a.execute('changeSelection', {productId: 'niuniu-p1-1', change: 1})
  assert.equal(a.view.snapshot.drafts.niuniu.selected['niuniu-p1-1'], 1)
})
test('加入不存在房间后可直接修改房间号重试', async t => {
  const service = new RoomService(), a = fixture(service), b = fixture(service)
  t.after(async () => {await a.execute('leave'); await b.execute('leave')})
  await a.execute('create', {url: 'ws://test/ws', nickname: '房主', ticketPrice: 200})
  await assert.rejects(b.execute('join', {url: 'ws://test/ws', nickname: '成员', code: '000000'}), /房间不存在/)
  assert.equal(b.storage.get('buffet-room-v2').pending, undefined)
  await b.execute('join', {url: 'ws://test/ws', nickname: '成员', code: a.view.snapshot.code})
  assert.equal(b.view.snapshot.id, a.view.snapshot.id)
})
test('未处理的请求只有在查询确认后才重发', async t => {
  const a = fixture()
  t.after(() => a.execute('leave'))
  await a.execute('create', {url: 'ws://test/ws', nickname: '房主', ticketPrice: 200})
  a.dropBefore()
  await assert.rejects(a.execute('changeSelection', {productId: 'niuniu-p1-1', change: 1}), /连接已断开/)
  await a.execute('resume', {url: 'ws://test/ws'})
  assert.deepEqual(a.sockets[1].commands, ['resume', 'requestStatus', 'changeSelection'])
  assert.equal(a.view.snapshot.drafts.niuniu.selected['niuniu-p1-1'], 1)
})
test('刷新后即使服务重启，已缓存最终结果仍可恢复并保存', async t => {
  const a = fixture()
  t.after(() => a.execute('leave'))
  await a.execute('create', {url: 'ws://test/ws', nickname: '房主', ticketPrice: 200})
  await a.execute('changeSelection', {productId: 'niuniu-p1-1', change: 1})
  await a.execute('end', {expectedRevision: a.view.snapshot.revision})
  const refreshed = fixture(new RoomService())
  t.after(() => refreshed.execute('leave'))
  refreshed.storage.set('buffet-room-v2', a.storage.get('buffet-room-v2'))
  await assert.rejects(refreshed.execute('resume', {url: 'ws://test/ws'}), /房间已失效/)
  assert.equal(refreshed.view.status, 'expired')
  assert.equal(refreshed.imports[0].value, 10)
  assert.equal(refreshed.view.snapshot.receipt.id, a.view.snapshot.receipt.id)
})
test('暂停房间保留编号和唯一ID，检查服务端匹配后才允许继续', async t => {
  const a = fixture()
  t.after(() => a.execute('leave'))
  await a.execute('create', {url: 'ws://test/ws', nickname: '房主', ticketPrice: 200})
  const identity = plain(a.storage.get('buffet-room-v2').identity)
  await a.execute('suspend')
  assert.equal(a.view.snapshot, null)
  assert.equal(a.view.resumable, false)
  assert.deepEqual(a.storage.get('buffet-room-v2').identity, identity)
  assert.equal(a.storage.get('buffet-room-v2').suspended, true)
  await a.execute('resume', {url: 'ws://test/ws', automatic: true})
  assert.equal(a.view.snapshot, null)
  assert.equal(a.sockets.length, 1)
  await a.execute('check', {url: 'ws://test/ws'})
  assert.equal(a.view.resumable, true)
  assert.equal(a.view.snapshot, null)
  assert.ok(a.sockets.at(-1).commands.includes('check'))
  await a.execute('resume', {url: 'ws://test/ws'})
  assert.equal(a.view.snapshot.id, identity.roomId)
})
test('缓存的房间号与唯一ID不匹配，不显示继续资格', async t => {
  const service = new RoomService(), a = fixture(service)
  t.after(() => a.execute('leave'))
  await a.execute('create', {url: 'ws://test/ws', nickname: '房主', ticketPrice: 200})
  const cached = plain(a.storage.get('buffet-room-v2'))
  cached.identity.code = '000000'
  const restored = fixture(service)
  t.after(() => restored.execute('leave'))
  restored.storage.set('buffet-room-v2', cached)
  await restored.execute('check', {url: 'ws://test/ws'})
  assert.equal(restored.view.resumable, false)
  assert.equal(restored.view.snapshot, null)
})

test('成员餐厅选择只在本机切换，按房间缓存，刷新后恢复；共享草稿独立', async t => {
  const service=new RoomService(), a=fixture(service), b=fixture(service)
  let refreshed
  t.after(async()=>{await a.execute('leave');await b.execute('leave');await refreshed?.execute('leave')})
  await a.execute('create',{url:'ws://test/ws',nickname:'甲',ticketPrice:100})
  await b.execute('join',{url:'ws://test/ws',nickname:'乙',code:a.view.snapshot.code})
  const before=b.sockets[0].commands.length
  await b.execute('selectRestaurant',{restaurantId:'daniu'})
  assert.equal(b.sockets[0].commands.length,before)
  assert.equal(a.view.restaurantId,'niuniu')
  assert.equal(b.view.restaurantId,'daniu')
  await Promise.all([a.execute('changeSelection',{productId:'niuniu-p1-1',change:1}),b.execute('changeSelection',{restaurantId:'daniu',productId:'daniu-p1-2',change:1})])
  assert.equal(a.view.snapshot.drafts.niuniu.selected['niuniu-p1-1'],1)
  assert.equal(a.view.snapshot.drafts.daniu.selected['daniu-p1-2'],1)
  await b.execute('suspend')
  refreshed=fixture(service,b.storage)
  await refreshed.execute('resume',{url:'ws://test/ws'})
  assert.equal(refreshed.view.restaurantId,'daniu')
  assert.equal(refreshed.view.catalog.typeId,'sukiyaki')
  assert.equal(refreshed.view.snapshot.drafts.daniu.selected['daniu-p1-2'],1)
})

test('旧协议凭证不重连，旧缓存最终小票仍可导入；目录到达前不发布活动展示', async t => {
  const a=fixture()
  t.after(()=>a.execute('leave'))
  const receipt={id:'old-final',restaurant:'旧牛牛',date:'2026-10-23T08:17:13Z',price:100,value:10,participants:['甲'],lines:[],rounds:[]}
  a.storage.set('buffet-room-v1',{identity:{roomId:'old',code:'123456',memberId:'member',token:'old-token'},entryKey:'old',snapshot:{id:'old',code:'123456',revision:1,status:'ended',hostId:'member',selected:{},rounds:[],ticketPrice:100,members:[],receipt}})
  await a.execute('resume',{url:'ws://test/ws'})
  assert.equal(a.sockets.length,0)
  assert.equal(a.imports[0].id,receipt.id)
  assert.equal(a.view.snapshot.receipt.date,receipt.date)
  const {RoomPresenter}=loadModule('contexts/dining/room/infrastructure/presentation/RoomPresenter')
  let view
  const presenter=new RoomPresenter({present(v){view=v}},[])
  const snapshot={id:'new',code:'654321',revision:1,hostId:'host',status:'active',typeId:'sukiyaki',ticketPrice:100,drafts:{},members:[],receipt:null}
  presenter.present(snapshot,'host','online','',false,false)
  assert.equal(view.snapshot,null)
  assert.equal(view.dining,null)
})
