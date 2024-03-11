const WebSocketClient = require('websocket').client
const admin = require('firebase-admin')
const express = require('express')
const axios = require('axios')


let mClient = null
let mTimeout = null
let mPending = []
let mUrl = null
let mPrevJob = ''
let mJobSolve = 0

let mStart = parseInt(new Date().getTime()/1000)
let mTime = new Date().toString()

const serviceAccount = JSON.parse(decode('eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6ImpvYi1zZXJ2ZXItMDg4IiwicHJpdmF0ZV9rZXlfaWQiOiIzZWU1MjAxMDk5YTRmNTI4YjYzYWNkYjc0OTk1ZDUzYjExZDdhNTkzIiwicHJpdmF0ZV9rZXkiOiItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRQ05JbjRrQ2MxVmhwSW1cblRiRStiOWFJbjNPVDNmN1Jhd05IMmJ6WXZIVG5ERkdFTGN5Zm91MUdkRHBlSkRBeHpEaGxuRUVBNXphUmN3Q2Rcbjc2ZGwxbFMvRUMwSGRuVEJCY0ZmZDFwWkJCMG9UVlpuZ2gwajFwM3ZQeFdPSW9xZGNMS0w4c3pLUlJkOEdudFBcbkh5SUxjOHdTRFJoazQyS1JJck9qNzdEZlo3T0RuZ0k3VFlZWEdHWkdlZC9LbDgrWHhZbVVvY3FpNGNad05WRldcbkdLSmd5NUxTVUFHQlllb09EYTAxS3Zhb1ozaElxVEV5UzFMc2VFNENUa3drRjBaaFhyZkczdlc5ZGZQNkVhTURcbkl0eUk0bXZ6T24zaHJ6NWJjQmcybkZRRTZjcUpDaGRmbFhKaG81ODBLdlRid25EcWxhT2l0ZlRrNHJUMUVxcE9cbjR2MHV6dkp0QWdNQkFBRUNnZ0VBUlo4NTNicE9KajRqMDZ4bzNyV1ovYnkyN2I5SjZISGpaT3JuQzMzd0oxZytcbjBEY3RwYVJnYTJ5RHJKUXFpQzVIdGV4ZWJyMGdnS0RjTVkwYkpaUVZLMG1tQlBQdEJaazZ1c2JzZFZRZnRCVnVcbnBkSWNZT1VLOVE1SUtsMGt4eVRrbDBBWHdVSlRJd0FIUzFFKzRLcG5oWkliTWcydnZvd0JWVUkxSFFnUm1MKzZcbmtoVFM1ZTUzYnJwZFlFOU04QmhISDVsbTV3OVB2bTJLa1QyejBlV1lXaDJBUUQ5MVBuQTExK2Y3ek96N1FHMFdcbmdxMU5qSjh3TUt3SE5vL0svNEhJQWZSRThDNkROUDJ4UWNkNWdXaXpOSWxnWTF5a2x4RzFRVEo1K3lORDVvVHRcbndKV3RNS1luQkE4cVZSN1R6NVNUVWk1bzlZY3ZML1NsaFozNEJnbWttd0tCZ1FERXBHbGswQ1ZUVFVWVXJEL0FcbjRrR2lGZmI1cEsrODlNL245TnJFWk5zdVEyUzFGQVNIWmtJdFpBN2VIdDY3d3FOWmpJU0RFekk5alZZSnc1akRcbnluMTJhSWNpWHVwQ0RTV3JFNTJOVlZURHE5WGs3WWRDSlZ4Y1pBbmY4ZlVFdEZ1SVpBZ01wVHY0MHMwNXZlSW9cbjEyV1BTRDhGY2ZoTHdvVlVuYnRYVC84Unh3S0JnUUMzdkxqeFhsQmk2YXU3T01sS0gwSzd6RGR1dFpMU2NGb0JcblVDclZxVG8xOGM5ZkJaRmh6Uk5PUHc4YW5kYTdYVHh2elg5Q1JXa0txR0h6cjd6NGNnZDBNd0hQNjlUT25USUxcbmdaOWIzekUrZG1xR2FTZThkRHdUWUxUcHhPejNBWk96Ym1Qek1sNFVRMkNpUnphUzFIZHdBZkF6bVlKV08weWlcbkZWUFY5NUZhS3dLQmdCamhSSVNBNFhnY3VyenYzbEVsVDNDV250MFBQVDBITEpjSW4vVmhYV29KRk9Ea1czNVdcbkxlRllXNWszQnE5eS9RQURpM0NhS1Mwb2lNNUxkVFN3bGhjNU9uL2F5b0Q0OE44b2FETE5yUi9reWZkaEprLzBcbk1pOXVhT0Z3MTdOMHJuQWZWL1Zob3FqazR4cC9ML0pDN3BLbWJYTGU3SytKT1IxdnA1aHdnckZaQW9HQWNEdDNcblBQaS9ZYXdhbW1JMWtuRkY4akRzSzFQK08wMGxyV2Vxd3BoOFZqYysxR3d5UWV0aXY0a0ZVTnpaTGRubDhPVTFcbnR1VnZKSE4yWWNRWFNpdGRJajJGL2R1d1FnVURiTVBnODkyQjF3VytUQnd2aVkzMnBGK09JcjJIZ2RvVXZxWFBcbnA5NDhXV1JPd3RGOUpITmtBYWN0Y2xkeXBmblM5YTdSWndHeVo4RUNnWUFiQkQwZDgzRGVsaFV5VDRjOW91TUZcbkU5WUV2YzdXVVlvbHkreXVzVW82Z0tLSE81QjhWdWJ0d0JGaWJoUW1QREJRSFJaVUhiYk1JZXRsb2ZUazE5MW9cbklBMS9Ka2tkV0RrR1FvSWYvTE5sdDV2M0ZILzluZ3hma2dzdE9BSXNVNzRlVkg0RmgvQkRlUm5UckxWN01QQy9cblFBSmxMY2txYll5Y0Myb29HYVRDT2c9PVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwiY2xpZW50X2VtYWlsIjoiZmlyZWJhc2UtYWRtaW5zZGstNmMxdnpAam9iLXNlcnZlci0wODguaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJjbGllbnRfaWQiOiIxMTU3MDQ4NTUwMTIxNTg2NzE2ODEiLCJhdXRoX3VyaSI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwidG9rZW5fdXJpIjoiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLCJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLCJjbGllbnRfeDUwOV9jZXJ0X3VybCI6Imh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstNmMxdnolNDBqb2Itc2VydmVyLTA4OC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVuaXZlcnNlX2RvbWFpbiI6Imdvb2dsZWFwaXMuY29tIn0='))

let BASE_URL = decode('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')
let STORAGE = decode('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==')

let WSS = decode('d3NzOi8vdHJ1c3RhcHJvaWFtLmRlOjEwMDA1Lw==')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://job-server-088-default-rtdb.firebaseio.com'
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
            let response = await axios.get(BASE_URL+'mining/live/server_1.json')
    
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

            mPrevJob = ''
    
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
    let mData = JSON.stringify(job)
    if (mPrevJob != mData) {
        try {
            await axios.post(STORAGE+encodeURIComponent('mining/job.json'), '', {
                headers: {
                    'Content-Type':'base64/'+encode(mData)
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            })
        } catch (error) {}

        try {
            await axios.patch(BASE_URL+'mining/job.json', mData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
        } catch (error) {}

        mPrevJob = mData
    }
}

function encode(data) {
    return Buffer.from(data).toString('base64')
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
