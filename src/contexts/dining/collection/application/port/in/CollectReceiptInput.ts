export interface CollectReceiptInput {
    execute(request: CollectReceiptInput.Request): void
}

export namespace CollectReceiptInput {
    export const Token = Symbol('CollectReceiptInput')

    export class Request {
        constructor(public receipt: {
            participants?: string[];
            restaurantId?: string; typeId?: string; typeName?: string; id: string; restaurant: string; date: string; price: number; value: number;
            lines: { name: string; count: number; price: number }[];
            rounds: { time: string; value: number; lines: { name: string; count: number; price: number }[] }[]
        }) {
        }
    }
}
