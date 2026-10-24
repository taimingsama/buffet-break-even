const test = require('node:test')
const assert = require('node:assert/strict')
const {loadModule} = require('../helpers/runtime.cjs')

const key='buffet-profile-nickname-v1'
function profile(stored,failSave=()=>false) {
    let nickname='',writes=0
    const data=new Map(stored===undefined ? [] : [[key,stored]])
    const platform={getStorageSync:k=>data.get(k),setStorageSync:(k,value)=>{
        if(failSave()) throw Error('disk full')
        writes++;data.set(k,value)
    }}
    const make=()=>new (loadModule('ui/profile/UniProfileSettings',platform).UniProfileSettings)({present:value=>{nickname=value}})
    return {make,data,get nickname(){return nickname},get writes(){return writes}}
}

test('昵称使用词库中的三个不同名词，支持不同排列并符合长度限制',()=>{
    const {NICKNAME_NOUNS,generateNickname}=loadModule('ui/profile/generateNickname')
    const names=new Set()
    for(let seed=1;seed<=100;seed++) {
        let state=seed
        const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296}
        const name=generateNickname(random)
        const words=name.match(/.{2}/gu)
        assert.equal(words.length,3)
        assert.equal(new Set(words).size,3)
        assert.ok(words.every(word=>NICKNAME_NOUNS.includes(word)))
        assert.ok(name.length<=20)
        names.add(name)
    }
    assert.ok(names.size>90)
})

test('新用户昵称首次加载即保存，重复读取和重新启动不重新生成',()=>{
    const app=profile()
    const settings=app.make()
    const name=settings.load()
    assert.equal(name.length,6)
    assert.equal(app.data.get(key),name)
    assert.equal(app.nickname,name)
    assert.equal(settings.load(),name)
    assert.equal(app.make().load(),name)
    assert.equal(app.writes,1)
})

test('已有昵称及手动改名保留，不被自动昵称覆盖',()=>{
    for(const name of ['快乐食客','新手食客']) {
        const app=profile(name),settings=app.make()
        assert.equal(settings.load(),name)
        assert.equal(app.writes,0)
        settings.save('  我的小餐厅  ')
        assert.equal(app.make().load(),'我的小餐厅')
        assert.equal(app.writes,1)
    }
})

test('无效本地昵称重新初始化；保存失败不发布未持久化的昵称且可重试',()=>{
    for(const value of ['', '   ', 123, '名'.repeat(21)]) {
        const app=profile(value)
        assert.equal(app.make().load().length,6)
        assert.equal(app.writes,1)
    }
    let fail=true
    const app=profile(undefined,()=>fail),settings=app.make()
    assert.throws(()=>settings.load(),/昵称保存失败/)
    assert.equal(app.nickname,'')
    assert.equal(app.data.has(key),false)
    fail=false
    assert.equal(settings.load(),app.nickname)
    assert.equal(app.writes,1)
})
