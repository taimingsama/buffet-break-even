const test = require('node:test')
const assert = require('node:assert/strict')
const {loadModule} = require('../helpers/runtime.cjs')

const receipt = () => ({restaurant:'我的餐厅',typeName:'火锅',participants:['团长','朋友'],receiptId:'DINING-1',dateTime:'2026-10-24 12:30',
  price:100,value:120,lines:[{name:'鲜切牛肉',price:30,count:4}],result:{verdict:'break-even',isBreakEven:true,difference:20}})

function setup(extra = {}, readReceipt = receipt) {
  const calls=[],toasts=[]
  const context=Object.fromEntries(['scale','setFillStyle','beginPath','moveTo','lineTo','closePath','fill','setStrokeStyle','setLineWidth','setLineDash','stroke','setTextBaseline','setFontSize','setTextAlign','fillText'].map(name=>[name,(...args)=>calls.push([name,...args])]))
  context.draw=(_,callback)=>callback()
  const platform={
    createCanvasContext:()=>context,
    canvasToTempFilePath:options=>{calls.push(['export',options]);options.success({tempFilePath:'/tmp/receipt.png'})},
    canvasGetImageData:options=>{
      const data=new Uint8ClampedArray(options.width*options.height*4)
      data[3]=255;data[data.length-1]=255
      options.success({data,width:options.width,height:options.height})
    },
    saveImageToPhotosAlbum:options=>{calls.push(['album',options.filePath]);options.success()},
    getSystemInfoSync:()=>({uniPlatform:'mp-weixin'}),
    showToast:options=>toasts.push(options.title),
    ...extra
  }
  const album=loadModule('ui/composables/useReceiptAlbum',platform).useReceiptAlbum(readReceipt,layout=>{
    calls.push(['web-render',layout])
    return 'data:image/png;base64,receipt'
  })
  return {album,calls,toasts}
}

test('完整长小票按内容排版，长餐厅名和多人昵称不截断，位图尺寸有界', () => {
  const data=receipt()
  data.restaurant='很长的餐厅名称'.repeat(10)
  data.participants=Array.from({length:30},(_,i)=>'用餐人'+i)
  data.lines=Array.from({length:200},(_,i)=>({name:'第'+i+'份鲜切牛肉套餐'.repeat(3),price:20,count:2}))
  const layout=loadModule('ui/receipt/ReceiptImage').layoutReceiptImage(data)
  assert.ok(layout.height>8000)
  assert.ok(layout.pixelHeight<=4096)
  assert.ok(layout.pixelWidth<=1200)
  const text=layout.texts.map(item=>item.text).join('')
  assert.ok(text.includes(data.restaurant))
  assert.ok(text.includes('用餐人29'))
  assert.ok(text.includes(data.lines.at(-1).name))
  assert.ok(text.includes('2026-10-24 12:30'))
  assert.ok(text.includes('¥120.00'))
  assert.ok(layout.texts.every(item=>item.y<layout.height-12))
})

test('生成真实小票绘制指令后保存相册，重复点击只保存一次', async () => {
  const {album,calls,toasts}=setup()
  const first=album.save()
  const second=album.save()
  assert.equal(album.busy.value,true)
  await Promise.all([first,second])
  assert.equal(calls.filter(call=>call[0]==='album').length,1)
  assert.ok(calls.some(call=>call[0]==='fillText'&&call[1]==='鲜切牛肉'))
  assert.ok(calls.some(call=>call[0]==='fillText'&&call[1].includes('团长、朋友')))
  assert.ok(toasts.includes('已保存到相册'))
  assert.equal(album.busy.value,false)
})

test('H5 提供生成后的图片预览，不调用系统相册接口', async () => {
  const {album,calls}=setup({getSystemInfoSync:()=>({uniPlatform:'web'})})
  await album.save()
  assert.equal(album.previewPath.value,'data:image/png;base64,receipt')
  assert.equal(calls.filter(call=>call[0]==='album').length,0)
  assert.equal(calls.filter(call=>call[0]==='export').length,0)
  assert.equal(calls.filter(call=>call[0]==='web-render').length,1)
})

test('首次生成及小票长度变化时，用最终尺寸重新挂载画布后才绘制', async () => {
  let data=receipt(), generation=0
  const sizes=[]
  const {album}=setup({createCanvasContext:()=>{
    assert.ok(album.canvasVersion.value>generation)
    generation=album.canvasVersion.value
    sizes.push({...album.canvasSize.value})
    const context=Object.fromEntries(['scale','setFillStyle','beginPath','moveTo','lineTo','closePath','fill','setStrokeStyle','setLineWidth','setLineDash','stroke','setTextBaseline','setFontSize','setTextAlign','fillText'].map(name=>[name,()=>{}]))
    context.draw=(_,done)=>done()
    return context
  }},()=>data)
  assert.equal(album.canvasVersion.value,0)
  await album.save()
  data={...data,lines:Array.from({length:40},(_,i)=>({name:'菜品'+i,price:10,count:1}))}
  await album.save()
  assert.equal(generation,2)
  assert.ok(sizes[1].height>sizes[0].height)
})

test('权限拒绝先确认，设置授权后重试同一张图片，不重复生成', async () => {
  let attempts=0,settings=0
  const {album,calls,toasts}=setup({
    saveImageToPhotosAlbum:options=>{if(++attempts===1) options.fail({errMsg:'saveImageToPhotosAlbum:fail auth deny'});else options.success()},
    openSetting:options=>{settings++;options.success({authSetting:{'scope.writePhotosAlbum':true}})}
  })
  await album.save()
  assert.equal(settings,0)
  assert.equal(album.permissionDialog.dialog.value.title,'允许保存到相册')
  album.permissionDialog.confirm()
  for(let i=0;i<6;i++) await Promise.resolve()
  assert.equal(attempts,2)
  assert.equal(settings,1)
  assert.equal(calls.filter(call=>call[0]==='export').length,1)
  assert.ok(toasts.includes('已保存到相册'))
})

test('生成失败后释放忙碌状态，允许重试', async () => {
  let attempts=0
  const {album,toasts}=setup({canvasToTempFilePath:options=>{
    if(++attempts===1) options.fail({errMsg:'canvas error'});else options.success({tempFilePath:'/tmp/retry.png'})
  }})
  await album.save()
  assert.equal(album.busy.value,false)
  assert.ok(toasts.includes('生成小票图片失败，请重试'))
  await album.save()
  assert.ok(toasts.includes('已保存到相册'))
})

test('相册导出裁掉大块透明区域，只导出实际小票范围',async()=>{
  const {album,calls}=setup({canvasGetImageData:options=>{
    const data=new Uint8ClampedArray(options.width*options.height*4)
    for(let y=0;y<482;y++)for(let x=0;x<400;x++)data[(y*options.width+x)*4+3]=255
    options.success({data,width:options.width,height:options.height})
  }})
  await album.save()
  const options=calls.find(call=>call[0]==='export')[1]
  assert.equal(options.x,0);assert.equal(options.y,0)
  assert.equal(options.width,400);assert.equal(options.height,482)
  assert.equal(options.destWidth,400);assert.equal(options.destHeight,482)
})
