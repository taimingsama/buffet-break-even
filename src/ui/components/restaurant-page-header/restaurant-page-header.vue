<template>
  <view class="page-heading" :style="{paddingTop: topInset + 'px'}">
    <view class="heading-content">
      <button class="heading-back" :hover-stay-time="0" aria-label="返回" @tap="$emit('back')">‹</button>
      <text class="heading-title">{{ title }}</text>
      <text class="heading-subtitle">{{ subtitle }}</text>
    </view>
  </view>
</template>
<script setup lang="ts">
defineProps<{title: string; subtitle?: string}>()
defineEmits<{(event: 'back'): void}>()
const topInset = uni.getSystemInfoSync().statusBarHeight || 0
</script>
<style scoped>
.page-heading {margin-bottom:28rpx}.heading-content {position:relative;min-height:124rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8rpx 100rpx}.heading-back {position:absolute;left:0;top:22rpx;width:76rpx;height:76rpx;border-radius:50%;margin:0;padding:0;line-height:68rpx;background:#fffdf5;color:#573712;font-size:56rpx}.heading-back::after {border:0}.heading-title {font-size:40rpx;line-height:1.3;font-weight:900;color:#ff4f0a;white-space:nowrap}.heading-subtitle {font-size:24rpx;color:#a18765;line-height:1.6;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
</style>
