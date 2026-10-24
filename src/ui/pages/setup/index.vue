<template>
  <view class="setup-page">
    <initialization-gate>
    <view class="hero-copy">
      <text class="hero-title">自助餐回本神器</text>
      <text class="hero-subtitle">准备吃垮老板！</text>
    </view>

    <view class="mode-stage flex-center" :class="{'is-dragging': drum.dragging.value}"
          @touchstart="drum.begin" @touchmove.stop.prevent="drum.move" @touchend="drum.end" @touchcancel="drum.end"
          @mousedown="drum.begin" @mousemove="drum.move" @mouseup="drum.end" @mouseleave="drum.end">
      <view class="dots flex-center" @touchstart.stop @mousedown.stop>
        <view v-for="(kind, index) in cuisineTypes" :key="kind.id" class="dot" :class="{active: drum.highlightedIndex.value === index}" @tap.stop="drum.choose(index)"/>
      </view>
      <view class="mode-drum" :style="{transform: drum.rotation.value}">
        <view v-for="(kind, index) in cuisineTypes" :key="kind.id" class="mode-card flex-center" :class="'tone-' + kind.id"
              :style="{transform: 'rotateY(' + index * 360 / cuisineTypes.length + 'deg) translateZ(var(--drum-radius)) rotateY(' + (drum.position.value - index) * 360 / cuisineTypes.length + 'deg)'}"
              @tap="drum.choose(index)">
          <text class="mode-emoji" :class="{'is-floating': drum.highlightedIndex.value === index}">{{ kind.emoji }}</text>
          <text class="mode-name">{{ kind.name }}</text>
        </view>
      </view>
    </view>
    <text class="drum-hint">‹　左右滑动，选择餐厅种类　›</text>

    <view v-if="panelTypeId === 'creator'" class="setup-panel entry-panel">
      <text class="entry-title">创建自己的自助餐厅</text>
      <text class="entry-copy">添加菜品、填写参考价值，保存后会出现在「我的餐厅」。</text>
      <depth-button class="mode-button deep entry-button" @click="editMenus">开始创建餐厅</depth-button>
    </view>
    <view v-else class="setup-panel">
      <view class="price-label">
        <text>💰</text>
        <text>门票价格</text>
      </view>
      <view class="price-input-wrap">
        <text class="currency">¥</text>
        <input v-model="ticketInput" type="digit" placeholder="输入总价" placeholder-style="color: #8f8d8a;"/>
      </view>
      <view class="mode-actions">
        <depth-button class="mode-button deep" @click="start('单人')">🚀 单人模式</depth-button>
        <depth-button class="mode-button" @click="openRoom">👥 多人模式</depth-button>
      </view>
    </view>
    <app-dialog v-if="showRoomModal" :title="pendingEntry ? '切换用餐' : joining ? '加入房间' : '一起吃回本'" @close="closeRoomModal">
      <template v-if="pendingEntry">
        <text class="room-dialog-note">切换会清空当前单人待选和轮次；原多人房间仍可由其他成员继续。</text>
        <view class="switch-actions">
          <button :hover-stay-time="0" class="room-dialog-secondary" :disabled="starting" @tap="pendingEntry = null">取消</button>
          <button :hover-stay-time="0" class="room-dialog-primary" :disabled="starting" @tap="enterRoom(pendingEntry, true)">确定</button>
        </view>
      </template>
      <template v-else-if="!joining">
        <text class="room-dialog-note">创建房间将使用首页门票 ¥{{ ticketInput }}，昵称可在「我的」中设置。</text>
        <text v-if="checkingRoom" class="room-dialog-note">正在核对上次房间号和唯一 ID…</text>
        <text v-else-if="roomStore.view.message" class="room-dialog-note">{{ roomStore.view.message }}</text>
        <button :hover-stay-time="0" class="room-dialog-primary" :disabled="starting || checkingRoom" @tap="enterRoom('create')">创建房间</button>
        <button :hover-stay-time="0" class="room-dialog-secondary" :disabled="starting || checkingRoom" @tap="joining = true">加入房间</button>
        <button :hover-stay-time="0" v-if="roomStore.view.resumable && !checkingRoom" class="room-dialog-secondary" :disabled="starting" @tap="continueRoom">继续上次用餐</button>
      </template>
      <template v-else>
        <text class="room-dialog-note">输入房主分享的六位房间号</text>
        <input v-model="roomCode" class="room-code-input" type="number" maxlength="6" placeholder="六位房间号" />
        <button :hover-stay-time="0" class="room-dialog-primary" :disabled="starting" @tap="enterRoom('join')">进入房间</button>
        <button :hover-stay-time="0" class="room-dialog-secondary" :disabled="starting" @tap="joining = false">返回</button>
      </template>
    </app-dialog>
    <app-confirm-dialog :controller="confirmation"/>
  </initialization-gate>
  </view>
</template>

<script setup lang="ts">
import DepthButton from '@/ui/components/depth-button/depth-button.vue'
import AppConfirmDialog from '@/ui/components/app-confirm-dialog/app-confirm-dialog.vue'
import {useAppDialog} from '@/ui/composables/useAppDialog'
const confirmation = useAppDialog()
import InitializationGate from '@/ui/components/initialization-gate/initialization-gate.vue'
import {computed, ref} from 'vue'
import {onLoad} from '@dcloudio/uni-app'
import {useCuisineDrum} from '@/ui/composables/useCuisineDrum'
import {GetCatalogInput} from '@/contexts/catalog/public'
import {BeginSessionInput} from '@/contexts/dining/public'
import {RoomInput, DiscardSessionInput} from '@/contexts/dining/public'
import {useRoomStore} from '@/ui/stores/useRoomStore'
import {ProfileSettings} from '@/ui/profile/ProfileSettings'
import {roomServerUrl} from '@/ui/composables/useActiveDining'
import AppDialog from '@/ui/components/app-dialog/app-dialog.vue'
import {useRequired} from '@/ui/composables/useRequired'
import {runAction} from '@/ui/composables/runAction'
import {BuffetNavigation} from '@/ui/navigation/BuffetNavigation'

const navigation = useRequired<BuffetNavigation>(BuffetNavigation)
import {useDiningStore} from '@/ui/stores/useDiningStore'

const diningStore = useDiningStore()
const begin = useRequired<BeginSessionInput>(BeginSessionInput.Token)
const ticketInput = ref('200')
const getCatalog = useRequired<GetCatalogInput>(GetCatalogInput.Token)
const cuisineTypes = (getCatalog.execute({typeId: 'sukiyaki'}).types || []).map(t => t.id === 'custom' ? {id:'creator',name:'创造者模式',emoji:'✏️'} : t)
cuisineTypes.push({id:'my-restaurants',name:'我的餐厅',emoji:'👨‍🍳'})
const typeId = ref('sukiyaki')
const drum = useCuisineDrum(cuisineTypes.map(t => t.id), typeId, () => uni.getSystemInfoSync().windowWidth || 375)
const panelTypeId = computed(() => cuisineTypes[drum.highlightedIndex.value]?.id || typeId.value)
const selectedRestaurantId = ref(''), selectedRestaurantName = ref('')
const editMenus = () => runAction(() => navigation.open('creator'))
const openMyRestaurants = () => {typeId.value = 'my-restaurants'}
const catalogTypeId = computed(() => typeId.value === 'my-restaurants' ? 'custom' : typeId.value)
onLoad(query => {
  if (query?.typeId === 'custom') typeId.value = 'my-restaurants'
  if (query?.restaurantId) void runAction(() => {
  const restaurant = getCatalog.execute({typeId:'custom'}).catalog?.restaurants.find(r => r.id === query.restaurantId)
  if (!restaurant?.products.length) throw new Error('餐厅不存在或尚未添加菜品')
  selectedRestaurantId.value = restaurant.id; selectedRestaurantName.value = restaurant.name
  typeId.value = 'my-restaurants'
})})
function catalogForStart() {
  let catalog = getCatalog.execute({typeId: catalogTypeId.value}).catalog
  if (catalog?.typeId === 'custom') catalog = {...catalog, restaurants: catalog.restaurants.filter(r => r.products.length)}
  if (!catalog?.restaurants.length || catalog.restaurants.some(r => !r.products.length)) {
    void navigation.open('creator')
    throw new Error('请先创建餐厅、分类和商品后再开始用餐')
  }
  return catalog
}
const starting = ref(false)

const roomStore = useRoomStore()
const roomInput = useRequired<RoomInput>(RoomInput.Token)
const discard = useRequired<DiscardSessionInput>(DiscardSessionInput.Token)
const profile = useRequired<ProfileSettings>(ProfileSettings)
const showRoomModal = ref(false), joining = ref(false), roomCode = ref('')
const checkingRoom = ref(false), pendingEntry = ref<'create' | 'join' | 'resume' | null>(null)
function openRoom() {
  if (starting.value) return
  joining.value = false; pendingEntry.value = null; showRoomModal.value = true; checkingRoom.value = true
  void runAction(async () => {
    try {await roomInput.execute({command: 'check', params: {url: roomServerUrl()}})}
    finally {checkingRoom.value = false}
  })
}
function closeRoomModal() {if (!starting.value) {showRoomModal.value = false; pendingEntry.value = null}}
const continueRoom = () => enterRoom('resume')
function enterRoom(command: 'create' | 'join' | 'resume', confirmed = false) {
  if (starting.value || checkingRoom.value) return
  void runAction(async () => {
    if (command === 'create') catalogForStart()
    if (command === 'create' && (!Number.isFinite(Number(ticketInput.value)) || Number(ticketInput.value) <= 0)) throw new Error('请输入大于零的门票价格')
    if (command === 'join' && !/^\d{6}$/.test(roomCode.value)) throw new Error('请输入六位房间号')
    if (!confirmed && (diningStore.view.session.hasAnyDraft || diningStore.view.totalSelectedCount > 0 || diningStore.view.session.rounds.length || (command !== 'resume' && roomStore.view.resumable))) {
      pendingEntry.value = command; return
    }
    starting.value = true
    try {
      const nickname = profile.load()
      const localId = diningStore.view.session.active ? diningStore.view.session.id : ''
      // Clear failed/expired credentials too, so a corrected room number can be entered.
      if (command !== 'resume') await roomInput.execute({command: 'leave', params: {}})
      await roomInput.execute({command, params: {url: roomServerUrl(), nickname, ticketPrice: Number(ticketInput.value), code: roomCode.value, typeId: catalogTypeId.value, ...(command === 'create' && catalogTypeId.value === 'custom' ? {catalog: catalogForStart()} : {})}})
      if (command === 'create' && catalogTypeId.value === 'custom' && selectedRestaurantId.value) await roomInput.execute({command:'selectRestaurant',params:{restaurantId:selectedRestaurantId.value}})
      if (localId) discard.execute({sessionId: localId})
      showRoomModal.value = false
      pendingEntry.value = null
      await navigation.open('menu')
    } finally {starting.value = false}
  })
}

function start(mode: string) {
  if (starting.value) return
  const submit = (replaceActive = false) => runAction(async () => {
    starting.value = true
    try {
      if (!Number.isFinite(Number(ticketInput.value)) || Math.round(Number(ticketInput.value) * 100) <= 0) throw new Error('请输入大于零的门票价格')
      catalogForStart()
      await roomInput.execute({command: 'suspend', params: {}})
      begin.execute({ticketPrice: Number(ticketInput.value), diningMode: mode, replaceActive, typeId: catalogTypeId.value, ...(catalogTypeId.value === 'custom' ? {restaurantId:selectedRestaurantId.value} : {})})
      await navigation.open('menu')
    } finally {
      starting.value = false
    }
  })
  if (roomStore.view.snapshot) {
    confirmation.open({title: '离开多人用餐', content: '开始单人用餐会离开当前房间，其他成员可以继续用餐。', success: result => {
      if (result.confirm) void submit(true)
      else if (result.cancel) void runAction(() => navigation.open('menu'))
    }})
  } else if (diningStore.view.session.active) {
    if (diningStore.view.session.diningMode === '单人' && !diningStore.view.session.hasAnyDraft && !diningStore.view.totalSelectedCount && !diningStore.view.session.rounds.length) {
      void submit(true)
      return
    }
    confirmation.open({
      title: '已有进行中的用餐', content: '重新开始会清空当前待选和轮次。取消可继续当前用餐。',
      confirmText: '重新开始', cancelText: '继续用餐',
      success: result => {
        if (result.confirm) void submit(true); else if (result.cancel) void runAction(() => navigation.open('menu'))
      }
    })
  } else void submit()
}
</script>

<style scoped>
.switch-actions {display:flex;gap:20rpx;margin-top:32rpx}
.switch-actions button {flex:1;min-width:0;margin:0;padding:0 12rpx}
.entry-title {display:block;font-size:34rpx;font-weight:900;color:#56340e}.entry-copy {display:block;margin-top:var(--entry-content-gap);font-size:26rpx;line-height:1.8;color:#946511}.entry-panel {--entry-content-gap:36rpx;display:flex;flex-direction:column}.entry-panel .entry-button {margin-top:var(--entry-content-gap);width:100%;flex:0 0 104rpx}
.custom-edit {margin:24rpx 0 0;padding:0 24rpx;line-height:64rpx;background:#ffffffdd;color:#78597a;border-radius:28rpx;font-size:24rpx}
.room-dialog-note {display:block;font-size:27rpx;line-height:1.8;color:#9a7d65;margin-bottom:24rpx}
.room-dialog-primary,.room-dialog-secondary,.room-dialog-secondary[disabled] {margin-top:20rpx;--button-radius:26rpx;font-size:30rpx;font-weight:800}
.room-dialog-primary,.room-dialog-primary[disabled] {background:#ff6331;color:white}.room-dialog-secondary {background:#fff0dd;color:#b66d34}
.room-code-input {height:100rpx;box-sizing:border-box;background:white;border:3rpx solid #eadabd;border-radius:24rpx;text-align:center;font-size:42rpx;letter-spacing:10rpx}
.setup-page {
  --setup-panel-height: 530rpx;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffe4b8 0 76%, #ffdcb2 100%);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

@supports (height: 100svh) {
  .setup-page {
    height: 100svh;
  }
}

.hero-copy {
  flex: 0 0 auto;
  text-align: center;
  padding-top: 24rpx;
  position: relative;
  z-index: 2;
}

.hero-title {
  display: block;
  font-size: 58rpx;
  line-height: 1.2;
  font-weight: 1000;
  color: #ff4f16;
  text-shadow: 4rpx 5rpx 0 #fff, 8rpx 10rpx 0 rgba(108, 63, 21, .2);
}

.hero-subtitle {
  display: block;
  margin-top: 24rpx;
  color: #fff;
  font-size: 34rpx;
  font-weight: 900;
  text-shadow: 3rpx 3rpx 0 #ff9a00;
}

.dots {
  gap: 18rpx;
  position: relative;
  flex: 0 0 auto;
  z-index: 3;
}

.dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 20rpx;
  background: rgba(161, 113, 54, .25);
}

.dot.active {
  width: 68rpx;
  background: linear-gradient(90deg, #ff9300, #ff501a);
}

.mode-stage {
  --drum-radius: 380rpx;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  justify-content: center;
  gap: 24rpx;
  position: relative;
  overflow: hidden;
  perspective: 1200rpx;
  touch-action: pan-y;
  user-select: none;
  cursor: grab;
}

.mode-stage.is-dragging {cursor: grabbing}
.mode-drum {
  width: 430rpx;
  height: 600rpx;
  max-height: calc(100% - 30rpx);
  flex: 0 1 600rpx;
  min-height: 0;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 420ms cubic-bezier(.22,.75,.24,1);
}
.is-dragging .mode-drum,
.is-dragging .mode-card {transition: none}
.drum-hint {
  display: block;
  flex: 0 0 auto;
  margin-bottom: 24rpx;
  width: 100%;
  line-height: 32rpx;
  text-align: center;
  font-size: 23rpx;
  color: #ac7546;
  pointer-events: none;
}

.mode-card {
  width: 100%;
  height: 600rpx;
  max-height: 100%;
  border-radius: 64rpx;
  background: linear-gradient(145deg, #a9e9d5, #6fc5ad);
  border: 8rpx solid rgba(255, 255, 255, .25);
  box-shadow: 0 38rpx 38rpx rgba(133, 93, 54, .18);
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* Counter-rotate each face: its center follows the drum while it faces the screen. */
  transition: transform 420ms cubic-bezier(.22,.75,.24,1);
  color: white;
  box-sizing: border-box;
}
.tone-creator {background:linear-gradient(145deg,#d8c2f2,#aa8adf)}
.tone-my-restaurants {background:linear-gradient(145deg,#e7c5bd,#cb9397)}
.tone-barbecue {background:linear-gradient(145deg,#f3c976,#d7994d)}
.tone-hotpot {background:linear-gradient(145deg,#f3ae8d,#d7745e)}
.tone-pizza {background:linear-gradient(145deg,#edce80,#d4a03d)}

.mode-emoji {
  display: inline-block;
  font-size: 96rpx;
}

.mode-emoji.is-floating {animation: emoji-float 2.4s ease-in-out infinite}
@keyframes emoji-float {
  0%, 100% {transform: translateY(0)}
  50% {transform: translateY(-12rpx)}
}
@media (prefers-reduced-motion: reduce) {
  .mode-emoji.is-floating {animation: none}
}

.mode-name {
  font-size: 52rpx;
  font-weight: 900;
  margin-top: 24rpx;
}

.setup-panel {
  height: calc(var(--setup-panel-height) + env(safe-area-inset-bottom));
  box-sizing: border-box;
  flex: 0 0 auto;
  padding: 36rpx 48rpx calc(48rpx + env(safe-area-inset-bottom));
  border-radius: 64rpx 64rpx 0 0;
  background: #fffefa;
}

.price-label {
  display: flex;
  gap: 16rpx;
  align-items: center;
  font-size: 34rpx;
  font-weight: 800;
}

.price-input-wrap {
  margin-top: 36rpx;
  height: 116rpx;
  border: 6rpx solid #eadabd;
  border-radius: 34rpx;
  background: #fffaf0;
  display: flex;
  align-items: center;
  padding: 0 34rpx;
  box-sizing: border-box;
}

.price-input-wrap input {
  flex: 1;
  height: 100%;
  font-size: 42rpx;
  font-weight: 700;
  color: #3a342f;
}

.currency {
  font-size: 50rpx;
  color: #8d6500;
  font-weight: 800;
  margin-right: 28rpx;
}

.mode-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.mode-button {
  flex: 1;
  height: 104rpx;
  border-radius: 44rpx;
  color: white;
  background: linear-gradient(145deg, #ff8b00, #ff5c16);
  font-size: 32rpx;
  font-weight: 900;
  text-decoration: none;
}

.mode-button.deep {
  background: linear-gradient(145deg, #ff5b1c, #ff3a10);
}

@media (max-height: 650px) {
  .setup-page {--setup-panel-height:436rpx}
  .entry-panel .entry-button {flex-basis:88rpx}
  .hero-title {font-size:48rpx}
  .hero-subtitle {font-size:28rpx;margin-top:16rpx}
  .mode-emoji {font-size:64rpx}
  .mode-name {font-size:42rpx;margin-top:12rpx}
  .custom-edit {margin-top:12rpx;line-height:48rpx;font-size:22rpx}
  .setup-panel {padding:28rpx 40rpx calc(40rpx + env(safe-area-inset-bottom))}
  .price-input-wrap {height:90rpx;margin-top:20rpx}
  .mode-actions {margin-top:24rpx}
  .mode-button {height:88rpx;font-size:28rpx}
}
</style>
