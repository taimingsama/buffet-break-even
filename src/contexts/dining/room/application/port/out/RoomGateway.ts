export interface RoomGateway {execute(command: string, params: Record<string, unknown>): Promise<void>}
