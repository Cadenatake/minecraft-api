require('dotenv').config()
const exec = require('child_process').exec

export function statusAsync(): Promise<any> {
    return new Promise((resolve, reject) => {
        exec(`pgrep -f ${process.env.GAME_SCREEN_NAME}`, (err: string, stdout: string, stderr: string) => {
            if (!stdout)
                resolve('OK')
            else
                reject('NG')
        })
    })
}

export function startAsync(): Promise<any> {
    return new Promise((resolve, reject) => {
        exec(`cd ${process.env.GAME_DIR} && screen -UAmdS ${process.env.GAME_SCREEN_NAME} java -Xmx1024M -Xms1024M -jar ${process.env.GAME_JAR} nogui`, (err: string, stdout: string, stderr: string) => {
            if (err)
                reject('failed')
            else
                resolve('success')
        })
    })
}

export function stopAsync(): Promise<any> {
    return new Promise((resolve, reject) => {
        exec(`screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "say '${process.env.WAITING_TIME_TO_STOP}'秒後にサーバーを停止します\n"' && sleep ${process.env.WAITING_TIME_TO_STOP} && screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "stop\n"'`, (err: string, stdout: string, stderr: string) => {
            if (err)
                reject('failed')
            else
                resolve('success')
        })
    })
}

export function restartAsync(): Promise<any> {
    return new Promise((resolve, reject) => {
        exec(`screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "say '${process.env.WAITING_TIME_TO_RESTART}'秒後にサーバーを再起動します\n"' && screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "say すぐに再接続可能になるので、しばらくお待ち下さい\n"' && sleep ${process.env.WAITING_TIME_TO_RESTART} && screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "stop\n"' && cd ${process.env.GAME_DIR} && screen -UAmdS ${process.env.GAME_SCREEN_NAME} java -Xmx1024M -Xms1024M -jar ${process.env.GAME_JAR} nogui`, (err: string, stdout: string, stderr: string) => {
            if (err)
                reject('failed')
            else
                resolve('success')
        })
    })
}

// TODO: DBへのログ
// TODO: リクエストの時間間隔
