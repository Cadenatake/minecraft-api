require('dotenv').config()

const exec = require('child_process').exec
const dateformat = require('dateformat')
const now = new Date()
const sqlite = require('sqlite3').verbose()
const db = new sqlite.Database('db/webhook.sqlite')

// ######   SETTINGS   #########################################################
const color_success = 6815520
const color_warning = 16768300
const color_error = 16724530
const color_notify = 12895428
const webhook_icon = process.env.WEBHOOK_ICON as string
const webhook_url_alert = process.env.WEBHOOK_URL_ALERT as string
const webhook_url_log = process.env.WEBHOOK_URL_LOG as string
// #############################################################################


export function post(title: string, description: string, status: number, notify: boolean) {

    // 1: Success (green)
    // 2: Warning (yellow)
    // 3: Error (red)
    // 4: Notify (gray)
    switch (status) {
        case 1:
            var color = color_success
            break
        case 2:
            var color = color_warning
            break
        case 3:
            var color = color_error
            break
        case 4:
        default:
            var color = color_notify
    }

    // true: Send to room with notification ON
    // false: Send to room with notification OFF
    if (notify)
        var webhook_url = webhook_url_alert
    else
        var webhook_url = webhook_url_log

    const json = `
        {
            "embeds": [ {
                "title": "${title}",
                "description": "${description}",
                "timestamp": "${dateformat(now, 'yyyy-mm-dd HH:MM:ss+09:00')}",
                "color": "${color}",
                "footer": {
                    "text": "© ${dateformat(now, 'yyyy')} 情クラ！プロジェクト",
                    "icon_url": "${webhook_icon}"
                }
            } ]
        }
    `;

    exec(`curl -H "Content-Type: application/json" -X POST -d '${json}' "${webhook_url}"`, (err: string, stdout: string, stderr: string) => {
        db.serialize(() => {
            db.run('CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(80), description VARCHAR(255), url VARCHAR(80), created_at DATETIME, err TEXT, stdout TEXT)');

            const stmt = db.prepare('INSERT INTO logs (title, description, url, created_at, err, stdout) VALUES (?, ?, ?, ?, ?, ?)');
            if (err) {
                stmt.run([title, description, webhook_url, dateformat(now, 'yyyy-mm-dd HH:MM:ss'), stderr, stdout]);
            } else {
                stmt.run([title, description, webhook_url, dateformat(now, 'yyyy-mm-dd HH:MM:ss'), '', stdout]);
            }

            stmt.finalize();
        });
        db.close();
    })
}
