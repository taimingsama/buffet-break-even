import {validateCatalog} from '@/utils/restaurant-catalog'
import {products as legacyProducts} from '@/data/catalog'
import type {SnapshotDocument} from '../schema/SnapshotDocument'
import type {StoredSession} from '../schema/StoredSession'
import type {StoredReceipt} from '../schema/StoredReceipt'
import type {StoredLine} from '../schema/StoredLine'
import type {StoredRound} from '../schema/StoredRound'

const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('存储数据格式错误')
    return value as Record<string, unknown>
}
const string = (value: unknown): string => {
    if (typeof value !== 'string') throw new Error('存储文本无效');
    return value
}
const amount = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !Number.isSafeInteger(Math.round(value * 100))) throw new Error('存储金额无效')
    return value
}
const count = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) throw new Error('存储数量无效')
    return value
}

function list<T>(value: unknown, map: (item: unknown) => T): T[] {
    if (!Array.isArray(value)) throw new Error('存储列表无效')
    return value.map(map)
}

function line(value: unknown): StoredLine {
    const data = object(value)
    return {name: string(data.name), price: amount(data.price), count: count(data.count)}
}

function round(value: unknown): StoredRound {
    const data = object(value)
    return {time: string(data.time), value: amount(data.value), lines: list(data.lines, line)}
}

export function decodeReceipt(value: unknown): StoredReceipt {
    const data = object(value)
    return {
        ...(data.restaurantId === undefined ? {} : {restaurantId: string(data.restaurantId)}),
        ...(data.typeId === undefined ? {} : {typeId: string(data.typeId)}),
        ...(data.typeName === undefined ? {} : {typeName: string(data.typeName)}),
        id: string(data.id), restaurant: string(data.restaurant), date: string(data.date), price: amount(data.price),
        ...(data.participants === undefined ? {} : {participants: list(data.participants, string)}),
        value: amount(data.value), lines: list(data.lines, line), rounds: list(data.rounds, round)
    }
}

export function decodeSession(value: unknown): StoredSession {
    const data = object(value)
    if (typeof data.active !== 'boolean') throw new Error('存储会话无效')
    const selected = Object.fromEntries(Object.entries(object(data.selected)).map(([id, value]) => [id, count(value)]))
    const rounds = list(data.rounds, round)
    if (!data.catalog && data.active && data.diningMode === '单人' && !Object.keys(selected).length && !rounds.length) {
        return {active: false, id: '', ticketPrice: 200, diningMode: '单人', restaurant: '牛牛', selected: {}, rounds: []}
    }
    const catalog = data.catalog ? validateCatalog(data.catalog) : data.active ? {
        typeId: 'legacy', typeName: '旧版菜单', restaurants: [{id: 'legacy', name: string(data.restaurant),
            categories: [...new Set(legacyProducts.map(p => p.category))].map((name, i) => ({id: 'legacy-c'+i, name})),
            products: legacyProducts.map(p => ({id:p.id, name:p.name, category:'legacy-c'+[...new Set(legacyProducts.map(p=>p.category))].indexOf(p.category), price:p.price, unit:'份', emoji:p.emoji})),
            valuationNote:'旧版菜单参考估值，仅用于继续旧会话', sources:['迁移自本地版本3菜单']}]
    } : undefined
    const restaurantId = data.catalog ? string(data.restaurantId) : catalog ? 'legacy' : undefined
    if (catalog && !catalog.restaurants.some(r => r.id === restaurantId)) throw new Error('存储餐厅无效')
    const drafts = data.drafts ? Object.fromEntries(Object.entries(object(data.drafts)).map(([id, value]) => {
        if (!catalog?.restaurants.some(r => r.id === id)) throw new Error('存储餐厅无效')
        const d = object(value)
        return [id, {selected: Object.fromEntries(Object.entries(object(d.selected)).map(([pid, qty]) => [pid, count(qty)])), rounds:list(d.rounds, round)}]
    })) : {}
    return {
        ...(catalog ? {catalog, restaurantId, drafts} : {}),
        active: data.active,
        id: string(data.id),
        ticketPrice: amount(data.ticketPrice),
        diningMode: string(data.diningMode),
        restaurant: string(data.restaurant),
        selected,
        rounds: list(data.rounds, round)
    }
}


export const isMissing = (value: unknown) => value === undefined || value === null || value === ''

export function decodeSnapshot(value: unknown): SnapshotDocument {
    const data = object(value)
    if (data.version !== 3 && data.version !== 4) throw new Error('未知存储版本')
    return {session: decodeSession(data.session), records: list(data.records, decodeReceipt), receipts: list(data.receipts, decodeReceipt)}
}

export function encodeSnapshot(snapshot: SnapshotDocument) {
    return {version: 4, session: decodeSession(snapshot.session), records: snapshot.records.map(decodeReceipt), receipts: snapshot.receipts.map(decodeReceipt)}
}

export function decodeReceipts(value: unknown): StoredReceipt[] {
    return list(value, decodeReceipt)
}
