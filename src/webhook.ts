require('dotenv').config();

const { exec } = require('child_process');
const dateformat = require('dateformat');
const sqlite = require('sqlite3').verbose();

const now = new Date();
const db = new sqlite.Database('db/log.sqlite');

// ######   SETTINGS   #########################################################
const colorSuccess = 6815520;
const colorWarning = 16768300;
const colorError = 16724530;
const colorNotify = 12895428;
const webhookIcon = process.env.WEBHOOK_ICON as string;
const webhookCopyright = process.env.WEBHOOK_COPYRIGHT as string;
const webhookUrl = process.env.WEBHOOK_URL as string;
// #############################################################################

// eslint-disable-next-line import/prefer-default-export
export function post(title: string, description: string, status: number) {
  function color(num: number) {
    // 1: Success (green)
    // 2: Warning (yellow)
    // 3: Error (red)
    // 4: Notify (gray)
    switch (num) {
      case 1:
        return colorSuccess;
      case 2:
        return colorWarning;
      case 3:
        return colorError;
      case 4:
      default:
        return colorNotify;
    }
  }

  const json = `
        {
            "embeds": [ {
                "title": "${title}",
                "description": "${description}",
                "timestamp": "${dateformat(now, 'yyyy-mm-dd HH:MM:ss+09:00')}",
                "color": "${color(status)}",
                "footer": {
                    "text": "© ${dateformat(now, 'yyyy')} ${webhookCopyright}",
                    "icon_url": "${webhookIcon}"
                }
            } ]
        }
    `;

  exec(`curl -H "Content-Type: application/json" -X POST -d '${json}' "${webhookUrl}"`, (err: string, stdout: string, stderr: string) => {
    db.serialize(() => {
      db.run('CREATE TABLE IF NOT EXISTS webhook (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(80), description VARCHAR(255), url VARCHAR(80), created_at DATETIME, err TEXT, stdout TEXT)');

      const stmt = db.prepare('INSERT INTO webhook (title, description, url, created_at, err, stdout) VALUES (?, ?, ?, ?, ?, ?)');
      if (err) {
        stmt.run([title, description, webhookUrl, dateformat(now, 'yyyy-mm-dd HH:MM:ss'), stderr, stdout]);
      } else {
        stmt.run([title, description, webhookUrl, dateformat(now, 'yyyy-mm-dd HH:MM:ss'), '', stdout]);
      }

      stmt.finalize();
    });
  });
}
