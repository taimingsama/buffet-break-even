import type {RoomInput} from '../port/in/RoomInput'
import type {RoomGateway} from '../port/out/RoomGateway'

export class RoomInteractor implements RoomInput {
    constructor(private readonly gateway: RoomGateway) {}
    execute(request: RoomInput.Request) {return this.gateway.execute(request.command, request.params)}
}
