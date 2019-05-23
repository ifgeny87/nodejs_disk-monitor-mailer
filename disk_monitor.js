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

    const isWarning = info.usedPercent > (Number(config.warningLevel) || 50);
    const isDanger = info.usedPercent > (Number(config.dangerLevel) || 80);
    const isFatal = info.usedPercent > (Number(config.fatalLevel) || 95);
    const barColor = isFatal ? '#8b0000' : isDanger ? '#dc143c' : isWarning ? '#ffd700' : '#3cb371';
    const status = isFatal ? 'Fatal' : isDanger ? 'Danger' : isWarning ? 'Warning' : 'Normal';

    console.log(chalk.yellow('Used: '), (info.used / GB).toFixed(3), 'Gb,', info.usedPercent.toFixed(1) + '%');
    console.log(chalk.yellow('Avail:'), (info.available / GB).toFixed(3), 'Gb,', info.availablePercent.toFixed(1) + '%');
    console.log(chalk.yellow('Total:'), (info.total / GB).toFixed(3), 'Gb');
    console.log(chalk.yellow('Free: '), (info.free / GB).toFixed(3), 'Gb');
    const statusColor = isDanger ? chalk.red : isWarning ? chalk.yellow : chalk.green;
    console.log('Current status is', statusColor(status));

    // send email only when warning status
    if (!isWarning) return;

    const transport = nodeMailer.createTransport(config.mailTransport);
    const mailOptions = {
	from: config.from,
	to: config.to,
	subject: `${status} - ${config.name} disk usage`,
	text: `${status} disk space usage on server ${config.name}.
Technical info:
${JSON.stringify(info, true, '\t')}
`,
	html: `<div style="font: 15pt Arial">
<h1>${status} <u>${config.name}</u> disk space usage</h1>
<p>
    Used <big><strong>${info.usedPercent.toFixed(1)}%</big></strong>,
    <big><strong>${(info.used / GB).toFixed(3)} Gb</big></strong> from <big>${(info.total / GB).toFixed(3)} Gb</big>
</p>
<div style="background: silver; width: 100%; padding: 1px;">
    <div style="background: ${barColor}; width: ${(info.usedPercent).toFixed(1)}%; min-height: 20px; text-align: center; padding: 10px 0;">
	${(info.usedPercent).toFixed(3)}%
    </div>
</div>
<p>
    Available <big><strong>${info.availablePercent.toFixed(1)}%</big></strong>,
    <big><strong>${(info.available / GB).toFixed(3)} Gb</big></strong> from <big>${(info.total / GB).toFixed(3)} Gb</big>
</p>
<div style="background: silver; width: 100%; padding: 1px;">
    <div style="background: ${barColor}; width: ${(info.availablePercent).toFixed(1)}%; min-height: 20px; text-align: center; padding: 10px 0;">
	${(info.availablePercent).toFixed(3)}%
    </div>
</div>
<br/>
<h3>Technical information:</h3>
<pre>${JSON.stringify(info, true, '\t')}</pre>
`,
    };
    transport.sendMail(mailOptions, (err, info) => {
	if(err) {
	    console.error(chalk.red('Error while send email:'), err);
	} else {
	    console.log(chalk.yellow('Good info:'), info);
	}
    });
}