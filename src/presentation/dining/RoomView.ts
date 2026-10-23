import type {RoomSnapshot} from '@/utils/room-protocol'
import type {ReceiptViewModel} from '@/presentation/receipt/ReceiptViewModel'
import type {DiningView} from './DiningView'

export interface RoomView {present(view: RoomView.Model): void}
export namespace RoomView {
    export interface Model {
        snapshot: RoomSnapshot | null; memberId: string; status: 'idle' | 'connecting' | 'online' | 'offline' | 'expired';
        message: string; busy: boolean; receipt: ReceiptViewModel | null; historySaved: boolean; dining: DiningView.ViewModel | null; resumable: boolean
    }
}
