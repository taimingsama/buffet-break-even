import type {DiningCatalog} from './restaurant-catalog'
/** Wire protocol v2. Amounts at the boundary use yuan; calculations use integer cents. */
export const ROOM_PROTOCOL_VERSION = 2
export interface RoomLine {name: string; count: number; price: number}
export interface RoomRound {time: string; value: number; lines: RoomLine[]}
export interface RoomReceipt {
    restaurantId?: string; typeId?: string; typeName?: string;
    participants?: string[];
    id: string; restaurant: string; date: string; price: number; value: number;
    lines: RoomLine[]; rounds: RoomRound[]
}
export interface RoomSnapshot {
    id: string; code: string; revision: number; hostId: string; status: 'active' | 'ended';
    ticketPrice: number; typeId: string; drafts: Record<string, {selected: Record<string, number>; rounds: RoomRound[]}>;
    members: {id: string; nickname: string; online: boolean}[];
    receipt: RoomReceipt | null;
}
export interface RoomRequest {
    protocolVersion: number; requestId: string; command: string; params: Record<string, unknown>
}
export interface RoomMessage {
    protocolVersion: number; type: 'response' | 'snapshot' | 'error'; requestId?: string;
    operation: string; actorId?: string; snapshot?: RoomSnapshot;
    identity?: {roomId: string; code: string; memberId: string; token: string};
    catalog?: DiningCatalog;
    entryKey?: string;
    available?: boolean;
    code?: string; message?: string; processed?: boolean; outcome?: RoomMessage;
}
