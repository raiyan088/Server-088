const express = require('express')
const WebSocket = require('ws')
const axios = require('axios')
const http = require('http')

let mID = null

let mStart = new Date().toString()

let BASE_URL = decode('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vJUMyJUEzdWNrJUUzJTgwJTg1eW91Lw==')

let clients = new Map()
let app = express()

app.use(express.json())

let server = http.createServer(app)

let wss = new WebSocket.Server({ server })

wss.on('connection', (ws) => {
    let clientId = null
    ws.isAlive = true

    ws.on('pong', () => {
        ws.isAlive = true;
    })

    ws.on('message', (msg, isBinary) => {
        ws.isAlive = true
        try {
            if (isBinary) {
                let buffer = Buffer.from(msg)
                
                let type = buffer.readUInt8(0)
                if (type != 0) {
                    let targetId = buffer.slice(1, 9).toString('hex')
                    let payload = buffer.slice(9)


                    if (type == 1 && targetId) {
                        clientId = targetId
                        clients.set(clientId, ws)
                    } else if (type == 2 && targetId) {
                        let reply = Buffer.alloc(1 + 8 + 1);
                        reply.writeUInt8(2, 0)
                        Buffer.from(targetId, "hex").copy(reply, 1)
                        reply.writeUInt8(isClientAlive(targetId) ? 1 : 0, 9)
                        ws.send(reply, { binary: true });
                    } else if ((type == 3 || type == 4) && targetId && payload) {
                        let targetWs = clients.get(targetId)

                        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                            let idBuffer = clientId ? Buffer.from(clientId, "hex") : Buffer.alloc(8)
                            let reply = Buffer.alloc(1 + 8 + payload.length)
                            reply.writeUInt8(type, 0)
                            idBuffer.copy(reply, 1)
                            payload.copy(reply, 9)
                            targetWs.send(reply, { binary: true })
                        } else {
                            let reply = Buffer.alloc(1 + 8 + 1)
                            reply.writeUInt8(2, 0)
                            Buffer.from(targetId, "hex").copy(reply, 1)
                            reply.writeUInt8(0, 9)
                            ws.send(reply, { binary: true })
                        }
                    }
                }
            } else {
                let data = JSON.parse(msg)

                if (data.type === 'connect' && data.clientId) {
                    clientId = data.clientId
                    clients.set(clientId, ws)
                } else if (data.type === 'check' && data.targetId) {
                    ws.send(JSON.stringify({ type: 'alive', id: data.targetId, alive: isClientAlive(data.targetId) }))
                } else if ((data.type === 'message' || data.type === 'message_save') && data.targetId && data.message) {
                    let targetWs = clients.get(data.targetId)

                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                        targetWs.send(JSON.stringify({ type: data.type, id: clientId ? clientId : '', message: data.message }))
                    } else {
                        ws.send(JSON.stringify({ type: 'alive', id: data.targetId, alive: false }))
                    }
                }
            }
        } catch (e) {}
    })

    ws.on('close', () => {
        try {
            if (clientId && clients.has(clientId)) {
                let currentWs = clients.get(clientId)
                if (currentWs === ws) {
                    clients.delete(clientId)
                }
            }
        } catch (e) {}
    })
})


app.get('/', async (req, res) => {
    if (mID == null) {
        try {
            let url = req.query.url
            if (!url) {
                let host = req.hostname
                if (host.endsWith('onrender.com')) {
                    url = host.replace('.onrender.com', '')
                }
            }
    
            if (url && url != 'localhost') {
                mID = url
            }
        } catch (error) {}
    }
    
    res.end(''+mStart)
})

app.get('/id', async (req, res) => {
    res.end(''+mID)
})

server.listen(process.env.PORT || 3000, ()=>{
    console.log('Listening on port 3000...')
})

liveAllServer()

setInterval(async () => {
    try {
        wss.clients.forEach((ws) => {
            try {
                if (!ws.isAlive) {
                    return ws.terminate()
                }
            } catch (error) {}
            ws.isAlive = false
        })
    } catch (error) {}

    await updateMyStatus()
}, 60000)

setInterval(async () => {
    await liveAllServer()
}, 300000)

async function liveAllServer() {
    try {
        let response = await axios.get(BASE_URL+'live/server.json')
        let urls = Object.values(response.data);

        let results = await Promise.all(urls.map(async (url) => {
            try {
                let res = await axios.get(url);
                return { url, result: res.data }
            } catch (err) {
                return { url, result: err.toString() }
            }
        }))

        results.forEach(r => console.log(`Url: ${r.url} -- Result: ${r.result}`))
    } catch (error) {}
}

async function updateMyStatus() {
    try {
        if (mID) {
            await axios.get('https://'+mID+'.onrender.com')
        }
    } catch (error) {}
}

function isClientAlive(clientId) {
    try {
        return clients.has(clientId) && clients.get(clientId).readyState === WebSocket.OPEN
    } catch (error) {
        return false
    }
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
