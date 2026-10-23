import type {RoundClock} from '../../application/port/out/RoundClock'
import type {ReceiptClock} from '../../application/port/out/ReceiptClock'

export class SystemDiningClock implements RoundClock, ReceiptClock {
    roundTime() {
        return new Date().toISOString()
    }

    receiptDate() {
        return new Date().toISOString()
    }
}
