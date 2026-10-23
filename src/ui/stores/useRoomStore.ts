import {defineStore} from 'pinia'
import {readonly, shallowRef} from 'vue'
import type {RoomView} from '@/presentation/dining/RoomView'

export const useRoomStore = defineStore('room-view', () => {
    const snapshot = shallowRef<RoomView.Model>({snapshot: null, memberId: '', status: 'idle', message: '', busy: false, receipt: null, historySaved: false, dining: null, resumable: false})
    return {view: readonly(snapshot), present(view: RoomView.Model) {snapshot.value = view}} satisfies RoomView & {view: unknown}
})
