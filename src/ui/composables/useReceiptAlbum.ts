import {getCurrentInstance, nextTick, ref} from 'vue'
import {drawReceiptImage, layoutReceiptImage, type ReceiptImageData} from '@/ui/receipt/ReceiptImage'
import {useAppDialog} from './useAppDialog'
import {runAction} from './runAction'
import {renderReceiptWeb} from '@/ui/receipt/renderReceiptWeb'
import {receiptImageBounds} from '@/ui/receipt/receiptImageBounds'

export function useReceiptAlbum(readReceipt: () => ReceiptImageData, renderWeb = renderReceiptWeb) {
    const owner = getCurrentInstance()?.proxy
    const busy = ref(false), previewPath = ref('')
    const canvasSize = ref({width:600,height:800})
    const canvasVersion = ref(0)
    const permissionDialog = useAppDialog()
    async function saveImage(filePath: string) {
        await new Promise<void>((resolve,reject)=>uni.saveImageToPhotosAlbum({filePath,success:()=>resolve(),fail:reject}))
        uni.showToast({title:'已保存到相册',icon:'success'})
    }
    function requestPermission(filePath: string) {
        permissionDialog.open({title:'允许保存到相册',content:'请在设置中允许保存图片到相册，然后重试。',confirmText:'去设置',success:result=>{
            if (result.confirm) void runAction(async()=>{
                const settings = await new Promise<UniApp.GetSettingSuccessResult>((resolve,reject)=>uni.openSetting({success:resolve,fail:reject}))
                if (settings.authSetting['scope.writePhotosAlbum']) {
                    try {await saveImage(filePath)} catch {throw Error('保存失败，请重试')}
                } else uni.showToast({title:'尚未允许保存到相册',icon:'none'})
            })
        }})
    }
    async function save() {
        if (busy.value) return
        busy.value = true
        try {
            const layout = layoutReceiptImage(readReceipt())
            const platform = uni.getSystemInfoSync().uniPlatform
            if (platform === 'web' || platform === 'h5') {
                previewPath.value = renderWeb(layout)
                return
            }
            canvasSize.value = {width:layout.pixelWidth,height:layout.pixelHeight}
            // Mount a fresh canvas with its final dimensions. Updating an existing H5
            // canvas triggers an asynchronous ResizeSensor that can otherwise crop
            // the first drawing before the bitmap has caught up with its CSS size.
            canvasVersion.value++
            await nextTick()
            const context = uni.createCanvasContext('receipt-album',owner)
            drawReceiptImage(context,layout)
            await new Promise<void>(resolve=>context.draw(false,()=>resolve()))
            const pixels = await new Promise<UniApp.CanvasGetImageDataRes>((resolve,reject)=>uni.canvasGetImageData({
                canvasId:'receipt-album',x:0,y:0,width:layout.pixelWidth,height:layout.pixelHeight,
                success:resolve,fail:reject
            },owner))
            const bounds = receiptImageBounds(pixels.data,pixels.width,pixels.height)
            const path = await new Promise<string>((resolve,reject)=>uni.canvasToTempFilePath({
                canvasId:'receipt-album',...bounds,
                destWidth:bounds.width,destHeight:bounds.height,fileType:'png',
                success:result=>resolve(result.tempFilePath),fail:reject
            },owner))
            try {await saveImage(path)} catch (error) {
                const message = (error as {errMsg?: string})?.errMsg || ''
                if (/auth|permission|authorize|scope/i.test(message)) requestPermission(path)
                else if (/cancel/i.test(message)) uni.showToast({title:'已取消保存',icon:'none'})
                else throw Error('保存失败，请重试')
            }
        } catch (error) {
            uni.showToast({title:error instanceof Error ? error.message : '生成小票图片失败，请重试',icon:'none'})
        } finally {busy.value = false}
    }
    return {busy,canvasSize,canvasVersion,previewPath,permissionDialog,save}
}
