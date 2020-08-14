require('dotenv').config()
const exec = require('child_process').exec

export function statusAsync(): Promise<any> {
    return new Promise((resolve, reject) => {
        exec(`pgrep -f minecraft`, (err: string, stdout: string, stderr: string) => {
            if (!stdout)
                resolve('OK')
            else
                reject('NG')
        })
    })
}

export function startAsync(): Promise<any> {
    return new Promise((resolve, reject) => {
        exec(`cd ${process.env.GAME_DIR} && screen -UAmdS minecraft java -Xmx1024M -Xms1024M -jar ${process.env.GAME_JAR} nogui`, (err: string, stdout: string, stderr: string) => {
            if (err)
                reject('failed')
            else
                resolve('success')
        })
    })
}

export function stopAsync(): Promise<any> {
    return new Promise((resolve, reject) => {
        exec(`screen -p 0 -S minecraft -X eval 'stuff "say '${process.env.WAITING_TIME_TO_STOP}'秒後にサーバーを停止します\n"' && sleep ${process.env.WAITING_TIME_TO_STOP} && screen -p 0 -S minecraft -X eval 'stuff "stop\n"'`, (err: string, stdout: string, stderr: string) => {
            if (err)
                reject('failed')
            else
                resolve('success')
        })
    })
}
