'use strict';
// Envoi d'e-mails via SMTP (sans dépendance). SMTP_URL = smtps://utilisateur:motdepasse@hote:465
// ou smtp://utilisateur:motdepasse@hote:587 (STARTTLS). Sans SMTP_URL, les e-mails sont seulement journalisés.

const net = require('net');
const tls = require('tls');
const os = require('os');
const { config, db } = require('./core');

function smtpSend({ url, from, to, subject, text }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const secure = u.protocol === 'smtps:';
    const port = parseInt(u.port || (secure ? '465' : '587'), 10);
    const user = decodeURIComponent(u.username);
    const pass = decodeURIComponent(u.password);
    let sock = secure ? tls.connect({ host: u.hostname, port, servername: u.hostname }) : net.connect({ host: u.hostname, port });
    let buf = '';
    let step = 'greet';
    let upgraded = secure;
    const timer = setTimeout(() => { fail(new Error('Délai SMTP dépassé')); }, 20000);
    const fail = (e) => { clearTimeout(timer); try { sock.destroy(); } catch (_) { /* ignore */ } reject(e); };
    const write = (l) => sock.write(l + '\r\n');
    const fromAddr = (from.match(/<([^>]+)>/) || [null, from])[1];
    const enc = (s) => '=?UTF-8?B?' + Buffer.from(s, 'utf8').toString('base64') + '?=';
    const fromHeader = from.includes('<') ? enc(from.split('<')[0].trim()) + ' <' + fromAddr + '>' : from;
    const body = Buffer.from(text, 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n');
    const message = [
      `From: ${fromHeader}`, `To: <${to}>`, `Subject: ${enc(subject)}`, `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@${os.hostname()}>`,
      'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', body,
    ].join('\r\n');

    const onLine = (code, line, last) => {
      if (!last) return;
      const ok = code >= 200 && code < 400;
      if (!ok) return fail(new Error('SMTP : ' + line));
      switch (step) {
        case 'greet': step = 'ehlo'; write('EHLO ' + os.hostname()); break;
        case 'ehlo':
          if (!upgraded && /STARTTLS/i.test(buf + line)) { step = 'starttls'; write('STARTTLS'); break; }
          if (user) { step = 'auth'; write('AUTH PLAIN ' + Buffer.from('\0' + user + '\0' + pass).toString('base64')); break; }
          step = 'from'; write(`MAIL FROM:<${fromAddr}>`); break;
        case 'starttls': {
          step = 'ehlo'; upgraded = true;
          sock.removeAllListeners('data');
          sock = tls.connect({ socket: sock, servername: u.hostname });
          sock.on('data', onData); sock.on('error', fail);
          sock.once('secureConnect', () => write('EHLO ' + os.hostname()));
          break;
        }
        case 'auth': step = 'from'; write(`MAIL FROM:<${fromAddr}>`); break;
        case 'from': step = 'rcpt'; write(`RCPT TO:<${to}>`); break;
        case 'rcpt': step = 'data'; write('DATA'); break;
        case 'data': step = 'sent'; sock.write(message.replace(/^\./gm, '..') + '\r\n.\r\n'); break;
        case 'sent': step = 'quit'; write('QUIT'); clearTimeout(timer); resolve(); break;
        default: break;
      }
    };
    let ehloLines = '';
    function onData(d) {
      buf += d.toString('utf8');
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 2);
        const code = parseInt(line.slice(0, 3), 10);
        const last = line[3] !== '-';
        if (step === 'ehlo') ehloLines += line + '\n';
        if (step === 'ehlo' && last) { const all = ehloLines; ehloLines = ''; const saved = buf; buf = all; onLine(code, line, last); buf = saved; continue; }
        onLine(code, line, last);
      }
    }
    sock.on('data', onData);
    sock.on('error', fail);
  });
}

async function sendMail(to, subject, text) {
  if (!to) return;
  const footer = '\n\n— Vélona · Nutrition & hygiène de vie\nConseils en nutrition et hygiène de vie, ne remplace pas un avis médical.';
  if (!config.smtpUrl) {
    await db.query('INSERT INTO email_log (to_addr, subject, status) VALUES ($1, $2, $3)', [to, subject, 'non_configure']);
    return;
  }
  try {
    await smtpSend({ url: config.smtpUrl, from: config.mailFrom, to, subject, text: text + footer });
    await db.query('INSERT INTO email_log (to_addr, subject, status) VALUES ($1, $2, $3)', [to, subject, 'envoye']);
  } catch (e) {
    await db.query('INSERT INTO email_log (to_addr, subject, status, error) VALUES ($1, $2, $3, $4)', [to, subject, 'erreur', String(e.message).slice(0, 500)]);
  }
}

// N'attend pas l'envoi (ne bloque pas la réponse HTTP)
function notify(to, subject, text) { sendMail(to, subject, text).catch((e) => console.error('[mail]', e.message)); }

module.exports = { sendMail, notify, smtpSend };
