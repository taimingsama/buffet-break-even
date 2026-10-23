export interface DiscardSessionInput {execute(request: DiscardSessionInput.Request): void}
export namespace DiscardSessionInput {
    export const Token = Symbol('DiscardSessionInput')
    export class Request {constructor(public sessionId: string) {}}
}
