<template>
  <view class="dialog-backdrop" @tap="$emit('close')">
    <view class="dialog-panel" role="dialog" :aria-label="title" @tap.stop>
      <view class="dialog-heading"><text>{{ title }}</text><button :hover-stay-time="0" class="dialog-close" aria-label="关闭" @tap="$emit('close')">×</button></view>
      <slot />
    </view>
  </view>
</template>
<script setup lang="ts">
defineProps<{title: string}>()
defineEmits<{(event: 'close'): void}>()
</script>
<style scoped>
.dialog-backdrop {position:fixed;inset:0;z-index:1000;background:rgba(58,37,20,.4);display:flex;align-items:center;justify-content:center;padding:40rpx;box-sizing:border-box}
.dialog-panel {width:100%;max-width:600rpx;max-height:85vh;overflow:auto;background:#fffaf2;border:3rpx solid #ffdfbd;border-radius:36rpx;padding:36rpx;box-sizing:border-box;box-shadow:0 24rpx 80rpx #54331533}
.dialog-heading {display:flex;align-items:center;justify-content:space-between;margin-bottom:24rpx;font-size:36rpx;font-weight:900;color:#493728}
.dialog-close {padding:0;margin:0;width:56rpx;height:56rpx;line-height:50rpx;background:#fff0df;color:#a18064;border-radius:50%;font-size:40rpx}.dialog-close::after {border:0}
</style>
