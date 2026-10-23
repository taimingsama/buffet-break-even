const test = require('node:test')
const assert = require('node:assert/strict')
const {application, loadModule, plain} = require('../helpers/runtime.cjs')

test('四种预设共九家餐厅，每家60商品，ID、分类、份量和估值有效且查询隔离', () => {
  const {presetCatalog, restaurantTypes} = loadModule('data/restaurants')
  const {validateCatalog} = loadModule('utils/restaurant-catalog')
  let count = 0
  for (const type of restaurantTypes.filter(t => t.id !== 'custom')) {
    const snapshot = presetCatalog(type.id)
    validateCatalog(snapshot)
    for (const r of snapshot.restaurants) {
      count++
      assert.equal(r.products.length, 60)
      assert.equal(new Set(r.products.map(p => p.id)).size, 60)
      assert.ok(r.products.every(p => p.unit && p.price > 0 && r.categories.some(c => c.id === p.category)))
      assert.match(r.valuationNote, /不是品牌官方/)
      if (type.id !== 'sukiyaki') assert.match(r.name, /示例/)
    }
    snapshot.restaurants[0].products[0].price = 999
    assert.notEqual(presetCatalog(type.id).restaurants[0].products[0].price, 999)
  }
  assert.equal(count, 9)
})

test('单人跨店草稿、共享票价、刷新恢复和只结算当前店', () => {
  const storage = new Map()
  const platform = {getStorageSync: k => storage.get(k), setStorageSync: (k, v) => storage.set(k, plain(v))}
  let app = application(platform)
  app.bootstrap.initialize()
  app.execute('BeginSession', {ticketPrice: 100, diningMode: '单人', typeId: 'sukiyaki'})
  app.execute('ChangeSelection', {productId: 'niuniu-p1-1', change: 1})
  app.execute('CommitRound')
  app.execute('SelectRestaurant', {restaurantId: 'daniu'})
  assert.equal(app.dining.view.totalSelectedCount, 0)
  assert.equal(app.dining.view.session.rounds.length, 0)
  app.execute('ChangeSelection', {productId: 'daniu-p1-2', change: 1})
  app.execute('ChangeTicketPrice', {ticketPrice: 188})
  app = application(platform)
  app.bootstrap.initialize()
  assert.equal(app.dining.view.session.restaurantId, 'daniu')
  assert.equal(app.dining.view.selectedLines[0].product.id, 'daniu-p1-2')
  app.execute('SelectRestaurant', {restaurantId: 'niuniu'})
  assert.equal(app.dining.view.session.rounds.length, 1)
  assert.equal(app.dining.view.session.ticketPrice, 188)
  app.execute('SelectRestaurant', {restaurantId: 'daniu'})
  app.execute('CompleteDining', {collectReceipt: true})
  const receipt = app.collection.view.receipts[0]
  assert.equal(receipt.restaurantId, 'daniu')
  assert.equal(receipt.typeId, 'sukiyaki')
  assert.equal(receipt.restaurant, '大牛')
  assert.equal(receipt.value, 11)
  assert.equal(receipt.price, 188)
  assert.equal(receipt.lines.length, 1)
  assert.equal(app.dining.view.session.active, false)
  assert.equal(storage.get('buffet-state-v4').version, 4)
  assert.equal(storage.get('buffet-state-v4').session.drafts, undefined)
})

test('仅在其他餐厅有草稿时仍识别非空；清空当前店不被旧草稿副本误判', () => {
  const app = application(); app.bootstrap.initialize()
  app.execute('BeginSession', {ticketPrice: 100, diningMode: '单人', typeId: 'sukiyaki'})
  app.execute('ChangeSelection', {productId: 'niuniu-p1-1', change: 1})
  app.execute('SelectRestaurant', {restaurantId: 'daniu'})
  assert.equal(app.dining.view.session.hasAnyDraft, true)
  app.execute('SelectRestaurant', {restaurantId: 'niuniu'})
  app.execute('ChangeSelection', {productId: 'niuniu-p1-1', change: -1})
  assert.equal(app.dining.view.session.hasAnyDraft, false)
})

const custom = () => ({typeId: 'custom', typeName: '自定义', restaurants: [{id: 'local', name: '我的店', categories: [{id:'meat', name:'肉类'}], products: [{id:'beef', name:'牛肉', category:'meat', unit:'80克', price:8}], valuationNote:'个人估算', sources:['个人经验']}]})
test('自定义目录持久化、活动菜单冻结、空目录及非法引用无法开始', () => {
  const storage = new Map(), app = application({getStorageSync:k=>storage.get(k), setStorageSync:(k,v)=>storage.set(k,plain(v))})
  app.bootstrap.initialize()
  assert.throws(() => app.execute('BeginSession', {ticketPrice:100,diningMode:'单人',typeId:'custom'}), /菜单/)
  const catalog = custom()
  app.execute('EditCatalog', {catalog})
  app.execute('BeginSession', {ticketPrice:100,diningMode:'单人',typeId:'custom'})
  catalog.restaurants[0].products[0].price = 99
  app.execute('EditCatalog', {catalog})
  app.execute('ChangeSelection', {productId:'beef', change:1})
  assert.equal(app.dining.view.displayValue, 8)
  assert.equal(app.execute('GetCatalog', {typeId:'custom'}).products[0].price,99)
  catalog.restaurants[0].products[0].category = 'missing'
  assert.throws(() => app.execute('EditCatalog', {catalog}), /菜单格式/)
  assert.equal(app.execute('GetCatalog', {typeId:'custom'}).products[0].price,99)
  app.execute('CompleteDining', {collectReceipt:false})
  app.execute('BeginSession', {ticketPrice:100,diningMode:'单人',typeId:'custom'})
  app.execute('ChangeSelection', {productId:'beef',change:1})
  assert.equal(app.dining.view.displayValue,99)
})

test('自定义校验拒绝重复ID、保留ID、超限、错误分类和非法估值', () => {
  const {validateCatalog} = loadModule('utils/restaurant-catalog')
  for (const change of [
    c=>c.restaurants.push(plain(c.restaurants[0])),
    c=>c.restaurants[0].id='__proto__',
    c=>c.restaurants[0].products[0].price=Infinity,
    c=>c.restaurants[0].products[0].price=0,
    c=>c.restaurants[0].products[0].unit='',
    c=>c.restaurants[0].products[0].category='missing',
    c=>c.restaurants[0].products=Array.from({length:201},(_,i)=>({...c.restaurants[0].products[0],id:'p'+i})),
  ]) {const c=custom();change(c);assert.throws(()=>validateCatalog(c), /菜单格式/)}
})

test('版本3迁移完整保留历史昵称时间，旧非空会话固定旧菜单，旧空会话清理', () => {
  const app = application()
  const {decodeSnapshot} = app.load('infrastructure/persistence/serialization/SnapshotCodec')
  const date = '2026-10-23T08:17:13.654Z'
  const receipt = {id:'old',restaurant:'老餐厅',date,price:20,value:8,participants:['甲','乙'],lines:[{name:'牛排肉',count:1,price:8}],rounds:[{time:date,value:8,lines:[{name:'牛排肉',count:1,price:8}]}]}
  const original = {version:3,session:{active:true,id:'s1',ticketPrice:20,diningMode:'单人',restaurant:'牛牛',selected:{beef:1},rounds:[]},records:[receipt],receipts:[receipt]}
  const migrated=decodeSnapshot(original)
  assert.deepEqual(plain(migrated.records),[receipt])
  assert.deepEqual(plain(migrated.receipts),[receipt])
  assert.equal(migrated.session.catalog.typeId,'legacy')
  assert.equal(migrated.session.catalog.restaurants[0].products.find(p=>p.id==='beef').price,8)
  assert.equal(decodeSnapshot({...original,session:{...original.session,selected:{}}}).session.active,false)
  assert.equal(original.session.catalog,undefined)
})
