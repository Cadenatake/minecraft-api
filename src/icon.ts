require('dotenv').config()

import axios from 'axios'
import fs from 'fs'

const mc_ping = require('mc-ping-updated')
const sharp = require('sharp')

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

export function playerIconAsync(minecraftid: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const getUUID = 'https://api.mojang.com/users/profiles/minecraft/' + minecraftid

        axios.get(getUUID).then((res) => {
            if (typeof res.data.id !== 'undefined') {
                const getUserData = 'https://sessionserver.mojang.com/session/minecraft/profile/' + res.data.id
                axios.get(getUserData).then((res) => {
                    const decode: string = Buffer.from(res.data.properties[0].value, 'base64').toString()
                    const getIconData = JSON.parse(decode)
                    const getIconUrl = getIconData.textures.SKIN.url

                    if (!fs.existsSync("./cache/" + minecraftid + ".png")) {
                        Promise.all([trimming(minecraftid, getIconUrl)]).then(function () {
                            const image = fs.readFileSync("./cache/" + minecraftid + ".png", "binary")
                            resolve(image)
                        })
                    } else {
                        const image = fs.readFileSync("./cache/" + minecraftid + ".png", "binary")
                        resolve(image)
                    }
                })
            } else {
                reject('minecraft id does not exist')
            }
        })
    })
}

async function trimming(minecraftid: string, getIconUrl: string) {
    const input = (await axios({ url: getIconUrl, responseType: "arraybuffer" })).data as Buffer

    await sharp(input)
        .extract({ width: 8, height: 8, left: 8, top: 8 })
        .toFile("./cache/" + minecraftid + ".png")
    return
}
