#!/usr/bin/node

const chalk = require('chalk');
const diskusage = require('diskusage');
const nodeMailer = require('nodemailer');
const config = require('./config');

const GB = 1024 * 1024 * 1024;

diskusage.check('/')
    .then(on_check)
    .catch(err => console.log(chalk.red('Error happened'), err));

function on_check(info) {
    info.used = info.total - info.available;
    info.usedPercent = 100 / info.total * info.used;
    info.availablePercent = 100 / info.total * info.available;

    const isWarning = info.usedPercent > (Number(config.warningLevel) || 70);
    const isDanger = info.usedPercent > (Number(config.dangerLevel) || 80);
    const isFatal = info.usedPercent > (Number(config.fatalLevel) || 90);
    const barBgColor = isFatal ? '#8b0000' : isDanger ? '#dc143c' : isWarning ? '#ffd700' : '#3cb371';
    const barColor = isDanger ? '#fff' : '#000';
    const status = isFatal ? 'Fatal' : isDanger ? 'Danger' : isWarning ? 'Warning' : 'Normal';

    console.log(chalk.yellow('Used: '), (info.used / GB).toFixed(3), 'Gb,', info.usedPercent.toFixed(1) + '%');
    console.log(chalk.yellow('Avail:'), (info.available / GB).toFixed(3), 'Gb,', info.availablePercent.toFixed(1) + '%');
    console.log(chalk.yellow('Total:'), (info.total / GB).toFixed(3), 'Gb');
    console.log(chalk.yellow('Free: '), (info.free / GB).toFixed(3), 'Gb');
    const statusColor = isDanger ? chalk.red : isWarning ? chalk.yellow : chalk.green;
    console.log('Current status is', statusColor(status));

    // send email only when warning status
    if (!isWarning) return;

    const emoji = isFatal ? '🔴' : isDanger ? '🔶' : '👋';

    const transport = nodeMailer.createTransport(config.mailTransport);
    const mailOptions = {
	from: config.from,
	to: config.to,
	subject: `${emoji} [${status}] ${config.name} disk usage`,
	text: `${status} disk space usage on server ${config.name}.
Technical info:
${JSON.stringify(info, true, '\t')}
`,
	html: `<div style="font: 13pt Arial">
<div style="font-size: 16pt; font-weight: bold; margin-bottom: 15px;">${status} <u>${config.name}</u> disk space usage</div>
<div style="margin-bottom: 20px;">
    <p>
	Used <big><strong>${(info.used / GB).toFixed(1)} Gb</big></strong> from <big>${(info.total / GB).toFixed(1)} Gb</big>
    </p>
    <div style="background: silver; width: 100%; max-width: 400px; border: 1px solid black; border-radius: 4px;">
	<div style="background: ${barBgColor}; color: ${barColor}; width: ${(info.usedPercent).toFixed(1)}%; line-height: 15px; font-size: 10pt; text-align: center; padding: 2px 0; border-radius: 3px;">
	    ${(info.usedPercent).toFixed(3)}%
	</div>
    </div>
</div>
<div style="margin-bottom: 20px;">
    <p>
	Available <big><strong>${(info.available / GB).toFixed(1)} Gb</big></strong> from <big>${(info.total / GB).toFixed(1)} Gb</big>
    </p>
    <div style="background: silver; width: 100%; max-width: 400px; border: 1px solid black; border-radius: 4px;">
	<div style="background: ${barBgColor}; color: ${barColor}; width: ${(info.availablePercent).toFixed(1)}%; line-height: 15px; font-size: 10pt; text-align: center; padding: 2px 0; border-radius: 3px;">
	    ${(info.availablePercent).toFixed(3)}%
        </div>
    </div>
</div>
<div style="font-size: 14pt;">Technical information:</div>
<pre style="font: 12pt Courier New">${JSON.stringify(info, true, '  ')}</pre>
`,
    };

    transport.sendMail(mailOptions, (err, info) => {
	if(err) {
	    console.error(chalk.red('Error while send email:'), err);
	} else {
	    console.log(chalk.yellow('Mail sended with info:'), info);
	}
    });
}