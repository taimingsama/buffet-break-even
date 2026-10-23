export interface ChangeTicketPriceInput {execute(request: ChangeTicketPriceInput.Request): void}
export namespace ChangeTicketPriceInput {
    export const Token = Symbol('ChangeTicketPriceInput')
    export class Request {constructor(public ticketPrice: number) {}}
}
