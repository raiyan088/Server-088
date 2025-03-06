const express = require('express')
const axios = require('axios')

let mID = null

let mStart = new Date().toString()

let BASE_URL = decode('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vJUMyJUEzdWNrJUUzJTgwJTg1eW91Lw==')

let app = express()

app.use(express.json())

app.listen(process.env.PORT || 3000, ()=>{
    console.log('Listening on port 3000...')
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

setInterval(async () => {
    await updateMyStatus()
}, 60000)

setInterval(async () => {
    await liveAllServer()
}, 300000)

async function liveAllServer() {
    try {
        let response = await axios.get(BASE_URL+'live/server.json')

        for(let url of Object.values(response.data)) {
            try {
                axios.get(url)
            } catch (error) {}
            await delay(500)
        }
    } catch (error) {}
}

async function updateMyStatus() {
    try {
        if (mID) {
            await axios.get('https://'+mID+'.onrender.com')
        }
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
