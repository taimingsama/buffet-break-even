const test=require('node:test')
const assert=require('node:assert/strict')
const {loadModule}=require('../helpers/runtime.cjs')

test('长按立即打开，原手势松开不关闭，之后在遮罩重新按下松开才关闭',()=>{
    const cache=new Map()
    const {useLongPressAction}=loadModule('ui/composables/useLongPressAction',{},cache)
    const {useBackdropDismiss}=loadModule('ui/composables/useBackdropDismiss',{},cache)
    let time=1000,opened=0,closed=0,mask
    const press=useLongPressAction(()=>{opened++;mask=useBackdropDismiss(()=>closed++,()=>time)},()=>time)
    press.start();time+=350;press.longPress()
    assert.equal(opened,1)
    time+=5000
    mask.end({type:'touchend'});press.end()
    mask.start({type:'mousedown'});mask.end({type:'mouseup'})
    assert.equal(closed,0)
    mask.start({type:'touchstart'});mask.end({type:'touchend'})
    assert.equal(closed,1)
})

test('普通点击和取消不打开，重复长按事件及松手不重复打开弹窗',()=>{
    const {useLongPressAction}=loadModule('ui/composables/useLongPressAction')
    let opened=0
    const press=useLongPressAction(()=>opened++)
    press.start();press.end()
    press.start();press.cancel();press.longPress();press.end()
    assert.equal(opened,0)
    press.start();press.longPress();press.longPress()
    assert.equal(opened,1)
    press.end();press.end()
    assert.equal(opened,1)
})
