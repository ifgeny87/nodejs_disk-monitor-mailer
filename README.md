# disk-monitor-mailer

## Install

Goto your site folder and clone from git

`cd /var/www/your-site/bin && git clonhttps://github.com/ifgeny87/disk-monitor-mailer.git`

Install modules

`npm install`

## Configure

Copy and setup configuration

`cp config.json.example config.json && vim config.json`

## Setup new cron task

Add command to your cron

`crontab -e`

Then add to last line

`0 * * * * cd /var/www/your-site/bin/dist-monitor-mailer && ./disk_monitor.js`
