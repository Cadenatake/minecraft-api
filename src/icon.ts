require('dotenv').config()
const mc_ping = require('mc-ping-updated')

export function serverIconAsync(): Promise<any> {
    return new Promise((resolve, reject) => {
        mc_ping(process.env.SERVER_URL, process.env.SERVER_PORT, function (err: any, res: any) {
            if (err)
                reject(err)
            else
                resolve(Buffer.from(res.favicon.replace(/^data:image\/png;base64,/, ''), 'base64'))
        })
    })
}
