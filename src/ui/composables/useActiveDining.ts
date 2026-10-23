import {computed, reactive} from 'vue'
import {useDiningStore} from '@/ui/stores/useDiningStore'
import {useRoomStore} from '@/ui/stores/useRoomStore'
import {useRequired} from './useRequired'
import {RoomInput} from '@/contexts/dining/public'

export function roomServerUrl() {
    return typeof __ROOM_SERVER_URL__ === 'string' ? __ROOM_SERVER_URL__ : 'ws://localhost:3001/ws'
}

/** Select a presentation source, leaving both single and shared state independent. */
export function useActiveDining() {
    const single = useDiningStore(), room = useRoomStore()
    return reactive({view: computed(() => room.view.dining || single.view)})
}

export function useRoomConnection() {
    const input = useRequired<RoomInput>(RoomInput.Token)
    const single = useDiningStore(), room = useRoomStore()
    return () => single.view.session.active && !room.view.snapshot ? Promise.resolve()
        : input.execute({command: 'resume', params: {url: roomServerUrl(), automatic: true}})
}
