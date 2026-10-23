export interface RoomInput {execute(request: RoomInput.Request): Promise<void>}
export namespace RoomInput {
    export const Token = Symbol('RoomInput')
    export class Request {
        constructor(public command: 'create' | 'join' | 'check' | 'suspend' | 'resume' | 'rename' | 'selectRestaurant' | 'transferHost' | 'changeSelection' | 'commitRound' | 'setPrice' | 'end' | 'sync' | 'leave',
                    public params: Record<string, unknown> = {}) {}
    }
}
