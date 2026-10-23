<template><view /></template>
<script setup lang="ts">
// Keep old room links working while all dining uses the shared menu UI.
import {onLoad} from '@dcloudio/uni-app'
import {useRoomStore} from '@/ui/stores/useRoomStore'
import {useRoomConnection} from '@/ui/composables/useActiveDining'
import {useRequired} from '@/ui/composables/useRequired'
import {runAction} from '@/ui/composables/runAction'
import {BuffetNavigation} from '@/ui/navigation/BuffetNavigation'
const room = useRoomStore(), restore = useRoomConnection()
const navigation = useRequired<BuffetNavigation>(BuffetNavigation)
onLoad(() => {void runAction(async () => {
  try {await restore()} finally {await navigation.open(room.view.snapshot ? 'menu' : 'setup', 'replace')}
})})
</script>
