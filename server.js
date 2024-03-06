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

const serviceAccount = JSON.parse(decode('eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6ImRhdGFiYXNlMDg4IiwicHJpdmF0ZV9rZXlfaWQiOiI4MjIwMTQxMjA3NWJhZmJjNTQ4NDM0MTM1YzQwYjliNzU5ZTY5NGIyIiwicHJpdmF0ZV9rZXkiOiItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRQ2RHRk4vdnZhMS9xSFNcbkJxRk0xMnM4UnRJTm1UZHU2YmNkTkhGcGd6K2gza2cySWQ4T1l4bExnYjQyWU5oNVlqelhsOGZSSzJnUnJIMTBcbjRTMzZEOXNuUFBqMHU2U042Uy9XL2ZhRnpWSjlWTU8yMC8rMjdVbG1lUUkwMVhMRWFiUnNJdDdRckhVM3cydVpcbk9FOU9Qd1RqZndRS3lyZVVTdkgzanlyNG9zaktrazBZQkk0bVFBTTlqL2ptYVd6YjVCT3NTVnlOdVJocC9IOFBcbm95OExGb0xwTVhpRG5Xam05ektiK0xiSzVwV1dlZ0dVc3doTytIckU4RzM3WFpzZDdsTitPOEhPV3ZnQ1ZOZlFcbm1CNlgxYWQ5L2FhWWpqQ2RvQnpxUVd2dy9UK3lPM3JIb2JhZnJqMGQzZFlIV2k0Qkl6OXFKS3plY2tsK2NhVkhcbktFSFF3NGVwQWdNQkFBRUNnZ0VBQUk3bThnM2l5TW9GTjI2MldVUnRNVDlEclJCeHI5dFUveDJ4OXZqa1M1NFRcbmRkeklNd0FEWlo4cUJyMndtenJRQWtpYjZVaDlFODMvK3ArM3R2c2lNVmtnUGRkaVdlNDlrU2NoSG4vWXBwRWJcbjZtMEZyRGZhNGtvMUNhekYvZ0J0cDVJMnBqbHNwN1J5TUE3UkNsTkRRRTh4MjV0MWpFbDVZMkt1K1lmempITzNcbjgzeWM2clZ4Z1pqTWF4aVVZR0d3S0gxeDVOeXZNWEZHMnNGdGNCTGdZS0Jsb3NvSUxaY05DR2d1RnhFNXB0WVZcbkhTQmRKSjFHaGNnSnBqR2VtZFozQ3JUV3RkOHdtbHdrUGc4eCtWWG9nVFkzZUs5azN2bE0xb01hYXByMWJ5TUxcbmtyM3hNQVNXZSt3c1ZqTHl5b0J6Skd1OHYwZ1RoZ2tWczFyaS8vVkVVUUtCZ1FEZG45WnFkMXZGVXpMZWVRbjNcbkVxT3U4clB3VFZ4VnRBdTUxSXoxbTZtRlE1aGszdHkra0hHU2VpVThuMWRIWFVneml2YXJPQU9HMDR1U1NaNkNcbjFlUk44bEt1ZzA2QTVXK20xNC90YXlRaldoTmczaWtsYmN5bmY5dTBpZEdqUDRpMHpJQk9vMFh5M3dGazFBd0xcbnErclZXTHdoQnI1YUpEdlVZR2xZV29qRkVRS0JnUUMxZGkrZWxya2grZmZ6WVd1VktLNnhOSmVjanVCWFk2blFcblUxK3FQL0tjRkpuQUI0RmFwRklaR2dqTDd3YkFXSXJFRFZWSVhVT3RZejR2SDhzalVrWEtpNkVwbU84V0xxQ2xcbnNLOGNxbzQ5UGFTS1JJRkovZ2dvUWpNNklOQ1p1Mm1UZ25jWGdZaE9GT29zWEJRRSt6bWhVQkJIcWthaGwyQ1JcbkVoSjdKdys1R1FLQmdDMmxVQW9aajBNekFaVWtwTkxJZWdIOFp1Y2xaOUVYQmhzK0ZkSTRQMC85UGhQNGVzcWRcbkFXZEQxUXVKWGZhSzFlWVh4dm80elRFbHZPZGlWazFvTkYrQmUxb0tIVThhOGtZUXU4b1FlUjcyM0dybEZ1Qm9cbm52QVl1MjJSdlNXOFhqR3V0UFo5VmxqUmFYNFUxbTVJK0ZMOHRiS3ZxdUR4K1lpaVd0QWh4VzJoQW9HQVVXMFhcbk1US3hJRzNxdFd1aHV1em1kdDRDcWwzeWpVUkxqdy9hZmFyMFV0VnJxSisxaTlid2dCTU9uM1JDczAwSDk3R0RcbjgxVG1hWWQrLytaa1lSVXAvQmxyMkI2b0ttd0I2bGUrUEQ3TVZPNjBSdGMyck4weEM5K28zUXljamw5cW9LYUtcbmlpRzE2Rk82UU8yUWppdXRVSlY4dUt2UHhmTUhnaEY1K1lrdHBRRUNnWUIzeE9KaHpUR2U3blpEbTYvZWE4ZWlcbnZqOHpyTzdZV2xDVWF4UERUTmdPZUFWZ29NeTh3WjhGRWJ5aXFFWjJLTFNDazFHbGxvSUZaWHh4c1hwMXZ3blhcbldzaDQ0U1VIdm9FNTIvdTZmMlNlR0ptdXJLT216eGptNEFXb1VVUGpHYWVtU2RSeE5JVGVhTDFTdDQyZ0lLR2NcbkdmR2hoZ3dFZGxqWGZrelE1bDkwREE9PVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwiY2xpZW50X2VtYWlsIjoiZmlyZWJhc2UtYWRtaW5zZGstaG81bG5AZGF0YWJhc2UwODguaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJjbGllbnRfaWQiOiIxMDYwMTI1NTI3NzU5MjQ2Njg2MDEiLCJhdXRoX3VyaSI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwidG9rZW5fdXJpIjoiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLCJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLCJjbGllbnRfeDUwOV9jZXJ0X3VybCI6Imh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstaG81bG4lNDBkYXRhYmFzZTA4OC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVuaXZlcnNlX2RvbWFpbiI6Imdvb2dsZWFwaXMuY29tIn0='))

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
            let response = await axios.get('https://'+mUrl)
            console.log(response.data)
        } catch (error) {
            console.log(mUrl)
        }
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
