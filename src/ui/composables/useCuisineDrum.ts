import {computed, ref, watch, type Ref} from 'vue'

type GestureEvent = {type?: string; button?: number; clientX?: number; clientY?: number; touches?: {clientX: number; clientY: number}[]; changedTouches?: {clientX: number; clientY: number}[]}

/** Keep the rotation unbounded so the last and first faces join without a jump. */
export function useCuisineDrum(ids: readonly string[], selected: Ref<string>, viewportWidth: number) {
    const count = ids.length
    const activeIndex = computed(() => Math.max(0, ids.indexOf(selected.value)))
    const position = ref(activeIndex.value)
    const dragging = ref(false)
    let startX = 0, startY = 0, startPosition = 0, moved = false
    let ignoreMouseUntil = 0, suppressTapUntil = 0
    const wrap = (index: number) => ((index % count) + count) % count
    const point = (event: GestureEvent) => event.touches?.[0] || event.changedTouches?.[0] || {clientX: event.clientX || 0, clientY: event.clientY || 0}

    function choose(index: number) {
        if (!count || Date.now() < suppressTapUntil) return
        const current = Math.round(position.value)
        const distance = wrap(index - wrap(current) + Math.floor(count / 2)) - Math.floor(count / 2)
        position.value = current + distance
        selected.value = ids[wrap(position.value)]
    }

    function begin(event: GestureEvent) {
        if (event.type?.startsWith('touch')) ignoreMouseUntil = Date.now() + 800
        if (event.type?.startsWith('mouse') && (Date.now() < ignoreMouseUntil || (event.button !== undefined && event.button !== 0))) return
        if (!count) return
        const p = point(event)
        startX = p.clientX; startY = p.clientY; startPosition = position.value
        moved = false; dragging.value = true
    }

    function move(event: GestureEvent) {
        if (!dragging.value || (event.type?.startsWith('mouse') && Date.now() < ignoreMouseUntil)) return
        const p = point(event), dx = p.clientX - startX, dy = p.clientY - startY
        if (!moved && Math.abs(dy) > Math.abs(dx)) return
        if (Math.abs(dx) > 6) moved = true
        if (moved) position.value = startPosition - dx * 750 / Math.max(viewportWidth, 1) / 280
    }

    function end(event?: GestureEvent) {
        if (!dragging.value || (event?.type?.startsWith('mouse') && Date.now() < ignoreMouseUntil)) return
        if (event?.changedTouches?.length || event?.type === 'mouseup') move(event)
        dragging.value = false
        if (moved) {
            const delta = position.value - startPosition
            const steps = Math.abs(delta) >= .22 ? Math.sign(delta) * Math.max(1, Math.round(Math.abs(delta))) : 0
            position.value = Math.round(startPosition + steps)
            suppressTapUntil = Date.now() + 300
        } else position.value = Math.round(startPosition)
        selected.value = ids[wrap(position.value)]
    }

    watch(selected, () => {
        if (!dragging.value && ids[wrap(Math.round(position.value))] !== selected.value) choose(activeIndex.value)
    })

    return {activeIndex, position, dragging, choose, begin, move, end,
        rotation: computed(() => `translateZ(calc(-1 * var(--drum-radius))) rotateY(${-position.value * 360 / Math.max(count, 1)}deg)`)}
}
