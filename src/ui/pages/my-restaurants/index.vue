<template>
  <view class="restaurant-page">
    <initialization-gate>
      <result-navbar class="restaurant-navbar" inset title-color="#ff4f0a" subtitle-color="#a18765" title="我的餐厅" :subtitle="library.restaurants.value.length + ' 个已保存餐厅'" @back="goBack"/>
      <view v-for="restaurant in library.restaurants.value" :key="restaurant.id" class="restaurant-card">
        <view class="restaurant-main">
          <view class="restaurant-badge">{{ restaurant.name.slice(0,1) }}</view>
          <view class="restaurant-copy"><text class="restaurant-name">{{ restaurant.name }}</text><text class="restaurant-meta">{{ restaurant.products.length }} 道菜 · {{ restaurant.categories.length }} 个分类</text></view>
        </view>
        <view class="restaurant-actions">
          <button :hover-stay-time="0" @tap="previewRestaurant(restaurant)">查看菜单</button>
          <button :hover-stay-time="0" class="primary" :disabled="!restaurant.products.length" @tap="dine(restaurant.id)">去用餐</button>
        </view>
      </view>
      <view v-if="!library.restaurants.value.length" class="restaurant-empty"><text>还没有保存的餐厅</text><text>去创造者模式创建自己的专属菜单</text></view>
      <button :hover-stay-time="0" class="restaurant-add" @tap="openCreator">去创造者模式</button>
      <text class="restaurant-note">选择餐厅后设置门票，可单人用餐或创建多人房间。</text>
    </initialization-gate>
  </view>
</template>
<script setup lang="ts">
import {onShow} from '@dcloudio/uni-app'
import {useCustomRestaurants} from '@/ui/composables/useCustomRestaurants'
import {useRestaurantPreview} from '@/ui/composables/useRestaurantPreview'
import {useRequired} from '@/ui/composables/useRequired'
import {runAction} from '@/ui/composables/runAction'
import {BuffetNavigation} from '@/ui/navigation/BuffetNavigation'
import InitializationGate from '@/ui/components/initialization-gate/initialization-gate.vue'
import ResultNavbar from '@/ui/components/result-navbar/result-navbar.vue'
const navigation = useRequired<BuffetNavigation>(BuffetNavigation)
const library = useCustomRestaurants()
const previewRestaurant = useRestaurantPreview()
onShow(() => {void runAction(library.reload)})
const goBack = () => runAction(() => navigation.back('setup'))
const openCreator = () => runAction(() => navigation.open('creator'))
const dine = (id: string) => runAction(() => navigation.toCustomDining(id))
</script>
<style scoped src="@/ui/styles/restaurants.css"></style>
