require('dotenv').config();
const mcPing = require('mc-ping-updated');

export function pingAsync(): Promise<any> {
  return new Promise((resolve, reject) => {
    mcPing(process.env.SERVER_URL, process.env.SERVER_PORT, (err: any, res: any) => {
      if (err) {
        reject(new Error('stop'));
      } else {
        resolve(res);
      }
    });
  });
}

export function pingOnlineAsync(): Promise<any> {
  return new Promise((resolve, reject) => {
    mcPing(process.env.SERVER_URL, process.env.SERVER_PORT, (err: any, res: any) => {
      if (err) {
        reject(new Error('stop'));
      } else if (res.players.sample) {
        resolve(res.players.sample);
      } else {
        resolve('nobody');
      }
    });
  });
}
