const test = require('node:test')
const assert = require('node:assert/strict')
const {ref} = require('vue')
const {loadModule} = require('../helpers/runtime.cjs')
const ids = ['custom','sukiyaki','barbecue','hotpot','pizza']
function create() {
  const selected = ref('sukiyaki')
  const drum = loadModule('ui/composables/useCuisineDrum').useCuisineDrum(ids, selected, 375)
  const swipe = (dx, dy=0) => {
    drum.begin({type:'touchstart',touches:[{clientX:200,clientY:200}]})
    drum.move({type:'touchmove',touches:[{clientX:200+dx,clientY:200+dy}]})
    drum.end({type:'touchend',changedTouches:[{clientX:200+dx,clientY:200+dy}]})
  }
  return {selected,drum,swipe}
}
test('拖动连续旋转，松手吸附后才变更餐厅种类，支持反向滑动', () => {
  const {selected,drum,swipe}=create()
  drum.begin({type:'touchstart',touches:[{clientX:200,clientY:200}]})
  drum.move({type:'touchmove',touches:[{clientX:100,clientY:200}]})
  assert.equal(selected.value,'sukiyaki')
  assert.ok(drum.position.value>1 && drum.position.value<2)
  drum.end({type:'touchend',changedTouches:[{clientX:100,clientY:200}]})
  assert.equal(selected.value,'barbecue')
  assert.equal(drum.position.value,2)
  swipe(140)
  assert.equal(selected.value,'sukiyaki')
})
test('循环滑动无首尾跳转，纵向滑动与轻微抖动不切换', () => {
  const {selected,drum,swipe}=create()
  swipe(3)
  swipe(10,120)
  assert.equal(selected.value,'sukiyaki')
  for(let i=0;i<5;i++) swipe(-140)
  assert.equal(selected.value,'sukiyaki')
  assert.equal(drum.position.value,6)
  assert.match(drum.rotation.value,/-432deg/)
})
test('点击相邻卡片沿最短路径转动，自定义和披萨可以直接相邻切换', () => {
  const {selected,drum}=create()
  drum.choose(0)
  assert.equal(selected.value,'custom')
  drum.choose(4)
  assert.equal(selected.value,'pizza')
  assert.equal(drum.position.value,-1)
})
