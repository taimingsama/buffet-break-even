import {ROOM_PROTOCOL_VERSION} from '../../src/utils/room-protocol'
import {createServer} from 'node:http'
import {WebSocketServer, WebSocket} from 'ws'
import {RoomService} from './service'
import type {RoomMessage} from '../../src/utils/room-protocol'
const {version} = require('../package.json') as {version: string}

const service = new RoomService()
const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    if (req.url === '/health') res.end(JSON.stringify({status: 'ok', version, protocolVersion: ROOM_PROTOCOL_VERSION}))
    else {res.statusCode = 404; res.end(JSON.stringify({error: 'NOT_FOUND'}))}
})
// Reserve room for request metadata around a catalog of up to 1 MiB.
const wss = new WebSocketServer({noServer: true, maxPayload: 1024 * 1024 + 4096})
const limits = new Map<string, {count: number; until: number}>()
server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws') {socket.destroy(); return}
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request))
})
wss.on('connection', (ws, request) => {
    let alive = true, messages = 0, windowStart = Date.now()
    const peer = {send(message: RoomMessage) {
        if (ws.readyState === WebSocket.OPEN) {
            if (ws.bufferedAmount > 1048576) {ws.terminate(); return}
            ws.send(JSON.stringify(message))
            if (message.type !== 'snapshot') console.info(JSON.stringify({event: 'response', requestId: message.requestId,
                operation: typeof message.operation === 'string' ? message.operation : 'invalid',
                roomId: message.snapshot?.id, revision: message.snapshot?.revision, code: message.code}))
        }
    }}
    ws.on('pong', () => {alive = true})
    const heartbeat = setInterval(() => {if (!alive) ws.terminate(); else {alive = false; ws.ping()}}, 15000)
    ws.on('message', data => {
        try {
            if (Date.now() - windowStart > 10000) {messages = 0; windowStart = Date.now()}
            if (++messages > 150) {ws.close(1008, 'Rate limit'); return}
            const raw = JSON.parse(data.toString())
            if (raw.command === 'create' || raw.command === 'join') {
                const ip = request.socket.remoteAddress || 'unknown'
                let limit = limits.get(ip)
                if (!limit || limit.until < Date.now()) {limit = {count: 0, until: Date.now() + 60000}; limits.set(ip, limit)}
                if (++limit.count > 30) {peer.send({protocolVersion: ROOM_PROTOCOL_VERSION, type: 'error', operation: raw.command, requestId: raw.requestId, code: 'RATE_LIMIT', message: '进入房间过于频繁，请稍后再试'}); return}
            }
            service.handle(peer, raw)
        } catch {peer.send({protocolVersion: ROOM_PROTOCOL_VERSION, type: 'error', operation: 'invalid', code: 'INVALID_REQUEST', message: '消息格式无效'})}
    })
    ws.on('error', () => ws.terminate())
    ws.on('close', () => {clearInterval(heartbeat); service.disconnect(peer)})
})
const timer = setInterval(() => {service.sweep(); for (const [ip, limit] of limits) if (limit.until < Date.now()) limits.delete(ip)}, 1000)
const port = Number(process.env.PORT || 3001)
server.listen(port, process.env.HOST || '0.0.0.0', () => console.info(`Buffet room server listening on ${(server.address() as {port: number}).port}`))
function shutdown() {clearInterval(timer); for (const ws of wss.clients) ws.terminate(); wss.close(); server.close()}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
