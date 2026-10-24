<template>
  <view class="result-navbar" :class="{'is-inset': inset}" :style="navbarStyle">
    <view class="navbar-content" :style="contentStyle">
      <button class="back-button flex-center" :hover-stay-time="0" aria-label="返回" @tap="emit('back')">
        <text class="iconfont icon-fanhui"/>
      </button>
      <view class="title-copy">
        <text class="navbar-title" :style="{color: titleColor}">{{ title }}</text>
        <text v-if="subtitle" class="navbar-subtitle" :style="{color: subtitleColor}">{{ subtitle }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  titleColor?: string
  subtitleColor?: string
  /** The parent page already provides horizontal gutters. */
  inset?: boolean
}>(), {
  title: '今日战果',
  subtitle: '今日用餐记录',
  titleColor: '#342a23',
  subtitleColor: '#b9a89a',
  inset: false
})

const systemInfo = uni.getSystemInfoSync()
const statusBarHeight = systemInfo.statusBarHeight || 0
const menuButton = typeof uni.getMenuButtonBoundingClientRect === 'function'
    ? uni.getMenuButtonBoundingClientRect()
    : null
const rightGuard = menuButton && menuButton.left
    ? Math.max((systemInfo.windowWidth || systemInfo.screenWidth) - menuButton.left + 8, 24)
    : 24
const navbarStyle = {paddingTop: `${statusBarHeight}px`}
const contentStyle = {paddingRight: `${rightGuard}px`}

const emit = defineEmits<{ (event: 'back'): void }>()
</script>

<style scoped>
.result-navbar {
  flex: 0 0 auto;
  box-sizing: border-box;
}

.navbar-content {
  min-height: 120rpx;
  padding-left: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-sizing: border-box;
}

.back-button {
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  line-height: 1;
  border: 0;
  width: 76rpx;
  height: 76rpx;
  --button-radius: 50%;
  background: rgba(255, 255, 255, .95);
  color: #3e352e;
  box-shadow: 0 12rpx 28rpx rgba(101, 70, 40, .1);
  font-size: 50rpx;
}

.back-button::after {border: 0}
.is-inset .navbar-content {padding-left: 0}

.title-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.navbar-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.15;
}

.navbar-subtitle {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 22rpx;
  font-weight: 700;
}
</style>
