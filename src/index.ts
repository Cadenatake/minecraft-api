/* eslint-disable import/first */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import express from 'express';
import fs from 'fs';

if (!fs.existsSync('cache')) fs.mkdirSync('cache');
if (!fs.existsSync('db')) fs.mkdirSync('db');

import { post } from './webhook';
import { pingAsync, pingOnlineAsync } from './ping';
import { serverIconAsync, playerIconAsync } from './icon';
import {
  statusAsync, startAsync, stopAsync, restartAsync,
} from './run';

const app: express.Express = express();
const Joi = require('joi');

const router: express.Router = express.Router();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Get Operational Status --------------------------------------------------
router.get('/api/status', (req: express.Request, res: express.Response) => {
  pingAsync()
    .then((json) => {
      res.send(json);
    }).catch((err) => {
      res.send(err);
    });
});
// -----------------------------------------------------------------------------

// --- Get Online Member -------------------------------------------------------
router.get('/api/status/online', (req: express.Request, res: express.Response) => {
  pingOnlineAsync()
    .then((json) => {
      res.send(json);
    }).catch((err) => {
      res.send(err);
    });
});
// -----------------------------------------------------------------------------

// --- Get Server Icon ---------------------------------------------------------
router.get('/api/icon', (req: express.Request, res: express.Response) => {
  serverIconAsync()
    .then((img) => {
      res.writeHead(200, {
        'Content-Type': 'image/png; charset=utf-8',
        'Content-Length': img.length,
      });
      res.end(img, 'binary');
    }).catch((err) => {
      res.send(err);
    });
});
// -----------------------------------------------------------------------------

// --- Get Player Icon ---------------------------------------------------------
router.get('/api/icon/:minecraftid', (req: express.Request, res: express.Response) => {
  playerIconAsync(req.params.minecraftid)
    .then((img) => {
      res.writeHead(200, {
        'Content-Type': 'image/png; charset=utf-8',
        'Content-Length': img.length,
      });
      res.end(img, 'binary');
    }).catch((err) => {
      res.send(err);
    });
});
// -----------------------------------------------------------------------------

// --- Start Server ------------------------------------------------------------
router.post('/api/run/start', (req: express.Request, res: express.Response) => {
  const schema = Joi.object({
    user: Joi.string().required(),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    post('不正なリクエストを拒否しました！', '公式サイト・アプリ以外からチャレンジされた可能性があります。', 3);
    res.status(400).send('Bad request');
    return;
  }

  statusAsync()
    .then(() => {
      startAsync(req.body.user)
        .then(() => {
          res.send('GREAT');
        })
        .catch((err) => {
          if (err === 'failed due to run interval') post('起動コマンドを拒否しました', `前回の処理の実行から${process.env.WAIT_SECONDS_FROM_LAST_PROCESS}秒経過していないため、コマンドを拒否しました。`, 2);
          else post('起動コマンドを拒否しました', 'サーバが既に起動しているため、起動コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: startAsync()]', 2);
          res.status(400).send('Bad request');
        });
    })
    .catch(() => {
      post('起動コマンドを拒否しました', '既に起動しているため、起動コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: statusAsync()]', 2);
      res.status(400).send('Bad request');
    });
});
// -----------------------------------------------------------------------------

// --- Stop Server -------------------------------------------------------------
router.post('/api/run/stop', (req: express.Request, res: express.Response) => {
  const schema = Joi.object({
    user: Joi.string().required(),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    post('不正なリクエストを拒否しました！', '公式サイト・アプリ以外からチャレンジされた可能性があります。', 3);
    res.status(400).send('Bad request');
    return;
  }

  statusAsync()
    .then(() => {
      post('停止コマンドを拒否しました', 'サーバが起動されていないため、停止コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: statusAsync()]', 2);
      res.status(400).send('Bad request');
    })
    .catch(() => {
      stopAsync(req.body.user)
        .then(() => {
          res.send('GREAT');
        })
        .catch((err) => {
          if (err === 'failed due to run interval') post('停止コマンドを拒否しました', `前回の処理の実行から${process.env.WAIT_SECONDS_FROM_LAST_PROCESS}秒経過していないため、コマンドを拒否しました。`, 2);
          else post('停止コマンドを拒否しました', 'サーバが起動されていないため、停止コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: stopAsync()]', 2);
          res.status(400).send('Bad request');
        });
    });
});
// -----------------------------------------------------------------------------

// --- Restart Server ----------------------------------------------------------
router.post('/api/run/restart', (req: express.Request, res: express.Response) => {
  const schema = Joi.object({
    user: Joi.string().required(),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    post('不正なリクエストを拒否しました！', '公式サイト・アプリ以外からチャレンジされた可能性があります。', 3);
    res.status(400).send('Bad request');
    return;
  }

  statusAsync()
    .then(() => {
      post('再起動コマンドを拒否しました', 'サーバが起動されていないため、再起動コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: statusAsync()]', 2);
      res.status(400).send('Bad request');
    })
    .catch(() => {
      restartAsync(req.body.user)
        .then(() => {
          res.send('GREAT');
        })
        .catch((err) => {
          if (err === 'failed due to run interval') post('再起動コマンドを拒否しました', `前回の処理の実行から${process.env.WAIT_SECONDS_FROM_LAST_PROCESS}秒経過していないため、コマンドを拒否しました。`, 2);
          else post('再起動コマンドを拒否しました', 'サーバが起動されていないため、再起動コマンドを拒否しました。サーバとの同期ができていない恐れがあります。[Err: restartAsync()]', 2);
          res.status(400).send('Bad request');
        });
    });
});
// -----------------------------------------------------------------------------

app.use(router);

// eslint-disable-next-line no-console
app.listen(3000, () => { console.log('Listening on port 3000...'); });
