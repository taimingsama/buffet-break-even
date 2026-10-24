import {recordTouch} from './compatibilityMouse'

/** Open immediately on long press; releasing that same touch must not activate the overlay. */
export function useLongPressAction(action: () => void, now = () => Date.now()) {
    let active = false, triggered = false
    function cancel() {active = false;triggered = false;recordTouch(now())}
    function start() {active = true;triggered = false;recordTouch(now())}
    function longPress() {
        if (!active || triggered) return
        triggered = true
        recordTouch(now())
        action()
    }
    function end() {cancel()}
    return {start,longPress,end,cancel}
}
