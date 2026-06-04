const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const qrcode = require('qrcode-terminal');

// --- RENDER PORT BINDING (Fixes Port Scan Timeout) ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('⭐ Vijay Ratna Bot is Active!'));
app.listen(port, '0.0.0.0', () => console.log(`Server listening on port ${port}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_data');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, 
        logger: pino({ level: 'silent' }),
        browser: ["Vijay Ratna Enterprises", "Chrome", "1.0.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'open') {
            console.log('✅ VIJAY RATNA BOT IS LIVE ON RENDER!');
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;

        const sender = msg.key.remoteJid;
        const pushName = msg.pushName || "Guest";
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase().trim();

        // --- TRIGGER DETECTION (Detects Hi, Hello, Hey, etc. multiple times) ---
        const hiTrigger = /^(h+i+|h+e+l+l+o+|h+e+y+|s+t+a+r+t+|m+e+n+u+|\.)/i.test(text);

        if (hiTrigger) {
            const welcomeForm = `🏡 *𝐕𝐢𝐣𝐚𝐲 𝐑𝐚𝐭𝐧𝐚 𝐄𝐧𝐭𝐞𝐫𝐩𝐫𝐢𝐬𝐞𝐬* 🏡
✨ _Find Your Dream Home_ ✨
━━━━━━━━━━━━━━━━━━━━━

Greetings *${pushName}*! Thank you for contacting us. 😊 🗝️

📋 *𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 𝐄𝐍𝐐𝐔𝐈𝐑𝐘 𝐅𝐎𝐑𝐌*
━━━━━━━━━━━━━━━━━━━━━
👤 *Full Name:*
💰 *Budget Range:*
🏗️ *Property Type:* (Flat / Villa / Plot)
📍 *Location:*
🎯 *Purpose:* (Buy / Rent / Invest)
━━━━━━━━━━━━━━━━━━━━━

📸 *Instagram:* https://instagram.com/evijayratna__enterptises

📺 *YouTube:* https://youtube.com/@Vijay_ratna_enterprises

🌐 *Website:* https://vijayratnaenterprises.great-site.net/login

🤵 *Brokerage Applicabel* 👍

📞 *Contact:* +91 98224 34060
━━━━━━━━━━━━━━━━━━━━━
📌 _Our team will contact you shortly!_`;

            await sock.sendMessage(sender, { text: welcomeForm });
            return;
        }

        // --- DETAILS DETECTION & THANK YOU ---
        const isDetails = (text.includes('name') || text.includes('👤')) && 
                          (text.includes('budget') || text.includes('💰'));

        if (isDetails) {
            const thankYouMessage = `🎊 *𝐓𝐇𝐀𝐍𝐊 𝐘𝐎𝐔 𝐅𝐎𝐑 𝐓𝐇𝐄 𝐃𝐄𝐓𝐀𝐈𝐋𝐒!* 🎊

✅ *Details Received Successfully!* 🙏
*Vijay Ratna Enterprises* has saved your requirements.

🚀 *WHAT HAPPENS NEXT?*
📞 You will receive a call within *4 Hours*.
📂 Exclusive property *PDFs* will be sent here.
🚗 We will arrange a *Free Site Visit*.

📸 *Instagram:* https://instagram.com/evijayratna__enterptises

📺 *YouTube:* https://youtube.com/@Vijay_ratna_enterprises

🌐 *Website:* https://vijayratnaenterprises.great-site.net/login 
*Wesite is live ✔*

🤵 *Brokerage Applicabel* 👍

━━━━━━━━━━━━━━━━━━━━━
🌟 _Trust. Transparency. Excellence._ 🌟`;

    await sock.sendMessage(sender, { text: thankYouMessage });

   await sock.sendMessage(sender, {
    image: { url: "https://i.ibb.co/KzcnVvgZ/Picsart-26-04-25-21-45-06-694.jpg" },
    caption: "🏡 Vijay Ratna Enterprises"
});

    const adminMsg = `🔥 *NEW LEAD ALERT* 🔥
👤 *Client:* ${pushName}
📱 *Chat:* wa.me/${sender.split('@')[0]}
📝 *Details:*
${text}`;

    await sock.sendMessage("919822434060@s.whatsapp.net", { text: adminMsg });
}
    });
}

startBot().catch(err => console.log("Error: " + err));
