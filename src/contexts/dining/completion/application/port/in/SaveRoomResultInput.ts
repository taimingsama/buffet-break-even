export interface SaveRoomResultInput {execute(request: SaveRoomResultInput.Request): void}
export namespace SaveRoomResultInput {
    export const Token = Symbol('SaveRoomResultInput')
    export class Request {
        constructor(public receipt: {
            participants?: string[];
            restaurantId?: string; typeId?: string; typeName?: string; id: string; restaurant: string; date: string; price: number; value: number;
            lines: {name: string; count: number; price: number}[];
            rounds: {time: string; value: number; lines: {name: string; count: number; price: number}[]}[]
        }, public collectReceipt: boolean) {}
    }
}
