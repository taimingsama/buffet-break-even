import type {ChangeTicketPriceInput} from '../port/in/ChangeTicketPriceInput'
import type {DiningReader} from '../port/out/DiningReader'
import type {DiningWriter} from '../port/out/DiningWriter'
import type {DiningOutput} from '../port/out/DiningOutput'
export class ChangeTicketPriceInteractor implements ChangeTicketPriceInput {
    constructor(private readonly reader: DiningReader, private readonly writer: DiningWriter, private readonly output: DiningOutput) {}
    execute(request: ChangeTicketPriceInput.Request) {
        const next = this.reader.load().changeTicketPrice(request.ticketPrice)
        this.writer.save(next)
        this.output.present(next)
    }
}
