/* eslint-disable max-len */
import dateformat from 'dateformat';

require('dotenv').config();

const { exec } = require('child_process');

const sqlite = require('sqlite3').verbose();

const db = new sqlite.Database('db/log.sqlite');

export function statusAsync(): Promise<any> {
  return new Promise((resolve, reject) => {
    exec(`pgrep -f ${process.env.GAME_SCREEN_NAME}`, (err: string, stdout: string) => {
      if (!stdout) resolve('OK');
      else reject(new Error('NG'));
    });
  });
}

function runLog(user: string, command: string, result: string) {
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS run (id INTEGER PRIMARY KEY AUTOINCREMENT, user VARCHAR(80), command VARCHAR(80), result VARCHAR(80), created_at DATETIME)');
    const stmt = db.prepare('INSERT INTO run (user, command, result, created_at) VALUES (?, ?, ?, ?)');
    const now = new Date();
    stmt.run([user, command, result, dateformat(now, 'yyyy-mm-dd HH:MM:ss')]);
    stmt.finalize();
  });
}

function runIntervalCheck(user: string) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all('SELECT COUNT(*) FROM sqlite_master WHERE TYPE="table" AND name="run"', (err: string, row: any) => {
        if (row === undefined) {
          resolve(false);
        } else if (row[0]['COUNT(*)']) {
          db.all('SELECT created_at FROM run WHERE command="reservation" ORDER BY created_at DESC LIMIT 1', (errSelect: string, date: any) => {
            if (errSelect) {
              reject(errSelect);
            } else {
              const nowInterval = new Date();
              nowInterval.setSeconds(nowInterval.getSeconds() - parseInt(process.env.WAIT_SECONDS_FROM_LAST_PROCESS as string, 10));
              resolve(date[0].created_at < dateformat(nowInterval, 'yyyy-mm-dd HH:MM:ss'));
            }
          });
        } else {
          resolve(true);
        }
      });

      db.run('CREATE TABLE IF NOT EXISTS run (id INTEGER PRIMARY KEY AUTOINCREMENT, user VARCHAR(80), command VARCHAR(80), result VARCHAR(80), created_at DATETIME)');
      const stmt = db.prepare('INSERT INTO run (user, command, created_at) VALUES (?, ?, ?)');
      const nowReservation = new Date();
      stmt.run([user, 'reservation', dateformat(nowReservation, 'yyyy-mm-dd HH:MM:ss')]);
      stmt.finalize();
    });
  });
}

export function startAsync(req: string): Promise<any> {
  return new Promise((resolve, reject) => {
    runIntervalCheck(req)
      .then((row) => {
        if (row) {
          exec(`cd ${process.env.GAME_DIR} && screen -UAmdS ${process.env.GAME_SCREEN_NAME} java -Xmx${process.env.GAME_MEM} -Xms${process.env.GAME_MEM} -jar ${process.env.GAME_JAR} nogui`, (err: string) => {
            if (err) {
              runLog(req, 'start', 'failed to start');
              reject(new Error('failed to start'));
            } else {
              runLog(req, 'start', 'success');
              resolve('success');
            }
          });
        } else {
          runLog(req, 'start', 'failed due to run interval');
          reject(new Error('failed due to run interval'));
        }
      });
  });
}

export function stopAsync(req: string): Promise<any> {
  return new Promise((resolve, reject) => {
    runIntervalCheck(req)
      .then((row) => {
        if (row) {
          exec(`screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "say '${process.env.WAIT_SECONDS_TO_STOP}'秒後にサーバーを停止します\n"' && sleep ${process.env.WAIT_SECONDS_TO_STOP} && screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "stop\n"'`, (err: string) => {
            if (err) {
              runLog(req, 'stop', 'failed to stop');
              reject(new Error('failed to stop'));
            } else {
              runLog(req, 'stop', 'success');
              resolve('success');
            }
          });
        } else {
          runLog(req, 'stop', 'failed due to run interval');
          reject(new Error('failed due to run interval'));
        }
      });
  });
}

export function restartAsync(req: string): Promise<any> {
  return new Promise((resolve, reject) => {
    runIntervalCheck(req)
      .then((row) => {
        if (row) {
          exec(`screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "say '${process.env.WAIT_SECONDS_TO_RESTART}'秒後にサーバーを再起動します\n"' && screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "say すぐに再接続可能になるので、しばらくお待ち下さい\n"' && sleep ${process.env.WAIT_SECONDS_TO_RESTART} && screen -p 0 -S ${process.env.GAME_SCREEN_NAME} -X eval 'stuff "stop\n"' && cd ${process.env.GAME_DIR} && screen -UAmdS ${process.env.GAME_SCREEN_NAME} java -Xmx${process.env.GAME_MEM} -Xms${process.env.GAME_MEM} -jar ${process.env.GAME_JAR} nogui`, (err: string) => {
            if (err) {
              runLog(req, 'restart', 'failed to restart');
              reject(new Error('failed to restart'));
            } else {
              runLog(req, 'restart', 'success');
              resolve('success');
            }
          });
        } else {
          runLog(req, 'restart', 'failed due to run interval');
          reject(new Error('failed due to run interval'));
        }
      });
  });
}
