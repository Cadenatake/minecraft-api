import express from 'express'
import fs from "fs";
if (!fs.existsSync('db')) fs.mkdirSync('db')

import { post } from "./webhook"
import { pingAsync, pingOnlineAsync } from "./ping"
import { statusAsync, startAsync, stopAsync } from "./run"

const app: express.Express = express()
const Joi = require('joi')
const router: express.Router = express.Router()

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// --- Get Operational Status --------------------------------------------------
router.get('/api/status', (req: express.Request, res: express.Response) => {
    pingAsync()
        .then((json) => {
            res.send(json)
        }).catch((err) => {
            res.send(err)
        })
})
// -----------------------------------------------------------------------------


// --- Get Online Member -------------------------------------------------------
router.get('/api/status/online', (req: express.Request, res: express.Response) => {
    pingOnlineAsync()
        .then((json) => {
            res.send(json)
        }).catch((err) => {
            res.send(err)
        })
})
// -----------------------------------------------------------------------------


// --- Start Server ------------------------------------------------------------
router.post('/api/run/start', (req: express.Request, res: express.Response) => {
    const schema = Joi.object({
        user: Joi.string().required(),
    })

    const validation = schema.validate(req.body);
    if (validation.error) {
        post("不正なリクエストを拒否しました！", "公式サイト・アプリ以外からリクエストチャレンジされた可能性があります。", 3, true)
        res.status(400).send('Bad request')
        return
    }

    statusAsync()
        .then(() => {
            startAsync()
                .then(() => {
                    res.send('GREAT')
                })
                .catch(() => {
                    post("起動コマンドを拒否しました", "サーバが既に起動しているため、起動コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: StartAsync()]", 2, true)
                    res.status(400).send('Bad request')
                    return
                })
        })
        .catch(() => {
            post("起動コマンドを拒否しました", "既に起動しているため、起動コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: StatusAsync()]", 2, true)
            res.status(400).send('Bad request')
            return
        })
})
// -----------------------------------------------------------------------------


// --- Stop Server -------------------------------------------------------------
router.post('/api/run/stop', (req: express.Request, res: express.Response) => {
    const schema = Joi.object({
        user: Joi.string().required(),
    })

    const validation = schema.validate(req.body);
    if (validation.error) {
        post("不正なリクエストを拒否しました！", "公式サイト・アプリ以外からリクエストチャレンジされた可能性があります。", 3, true)
        res.status(400).send('Bad request')
        return
    }

    statusAsync()
        .then(() => {
            post("停止コマンドを拒否しました", "サーバが起動されていないため、停止コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: StatusAsync()]", 2, true)
            res.status(400).send('Bad request')
        })
        .catch(() => {
            stopAsync()
                .then(() => {
                    res.send('GREAT')
                })
                .catch(() => {
                    post("停止コマンドを拒否しました", "サーバが起動されていないため、停止コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: StopAsync()]", 2, true)
                    res.status(400).send('Bad request')
                    return
                })
            return
        })
})
// -----------------------------------------------------------------------------


app.use(router)

app.listen(3000, () => { console.log('Listening on port 3000...') })
