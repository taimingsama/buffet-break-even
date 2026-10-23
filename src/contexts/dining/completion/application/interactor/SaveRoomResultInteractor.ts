import type {SaveRoomResultInput} from '../port/in/SaveRoomResultInput'
import type {CompletionTransaction} from '../port/out/CompletionTransaction'
import {SaveRecordInput} from '@/contexts/dining/history/public'
import {CollectReceiptInput} from '@/contexts/dining/collection/public'

export class SaveRoomResultInteractor implements SaveRoomResultInput {
    constructor(private readonly save: SaveRecordInput, private readonly collect: CollectReceiptInput,
                private readonly transaction: CompletionTransaction) {}
    execute(request: SaveRoomResultInput.Request): void {
        this.transaction.run(() => {
            this.save.execute(new SaveRecordInput.Request(request.receipt))
            if (request.collectReceipt) this.collect.execute(new CollectReceiptInput.Request(request.receipt))
        })
    }
}
