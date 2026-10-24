<template>
  <view class="depth-button" :class="{'is-disabled': disabled}" :style="{'--press-depth': depth + 'rpx', '--depth-color': shadowColor, '--ambient-shadow': ambientShadow}"
        role="button" :aria-label="label" :aria-disabled="disabled"
        :hover-class="disabled ? 'none' : 'depth-button-pressed'" :hover-start-time="0" :hover-stay-time="0" :hover-stop-propagation="true"
        @tap="activate">
    <slot/>
  </view>
</template>

<script lang="ts">
export default {options:{virtualHost:true}}
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  depth?: number
  shadowColor?: string
  ambientShadow?: string
  disabled?: boolean
  label?: string
}>(), {
  depth:14,
  shadowColor:'#a53700',
  ambientShadow:'0 26rpx 32rpx rgba(158, 64, 8, .2)',
  disabled:false
})
const emit = defineEmits<{(event: 'click'): void}>()
function activate() {if (!props.disabled) emit('click')}
</script>

<style scoped>
.depth-button {
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 var(--press-depth) 0 var(--depth-color), var(--ambient-shadow);
  transition:transform 100ms ease-out, box-shadow 100ms ease-out;
  cursor:pointer;
}
.depth-button.depth-button-pressed:not(.is-disabled),
.depth-button:not(.is-disabled):active {
  transform:translateY(var(--press-depth));
  box-shadow:0 0 0 var(--depth-color), 0 0 0 rgba(0, 0, 0, 0);
}
.depth-button.is-disabled {filter:grayscale(50%);cursor:default}
</style>
