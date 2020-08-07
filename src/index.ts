import express from 'express'
import { pingAsync, pingOnlineAsync } from "./ping"

const app: express.Express = express()

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const router: express.Router = express.Router()


// --- Get operational status --------------------------------------------------
router.get('/api/state', (req: express.Request, res: express.Response) => {
    pingAsync()
        .then((json) => {
            res.send(json)
        }).catch((err) => {
            res.send(err)
        });
})
// -----------------------------------------------------------------------------


// --- Get online member -------------------------------------------------------
router.get('/api/state/online', (req: express.Request, res: express.Response) => {
    pingOnlineAsync()
        .then((json) => {
            res.send(json)
        }).catch((err) => {
            res.send(err)
        });
})
// -----------------------------------------------------------------------------


app.use(router)

app.listen(3000, () => { console.log('Listening on port 3000...') })
