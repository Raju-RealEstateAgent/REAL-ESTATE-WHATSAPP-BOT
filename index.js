const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const qrcode = require('qrcode-terminal');

// --- RENDER PORT BINDING (Fixes Port Scan Timeout) ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.status(200).send('⭐ Vijay Ratna Bot is Active!'));
app.get('/ping', (req, res) => res.status(200).json({ status: 'ok' }));
app.listen(port, '0.0.0.0', () => console.log(`Server listening on port ${port}`));

// --- USER SESSION STATE ---
const userStates = {};

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

🤵 *Brokerage Applicable* 👍

📞 *Contact:* +91 98224 34060
━━━━━━━━━━━━━━━━━━━━━
📌 _Our team will contact you shortly!_`;

            await sock.sendMessage(sender, { text: welcomeForm });
            return;
        }

        // --- HANDLE WAITING CONFIRMATION ---
        if (userStates[sender] && userStates[sender].state === 'WAITING_CONFIRMATION') {
            if (text === 'yes' || text === 'y' || text === 'haan' || text === 'yes correct' || text === 'yep' || text === 'ok' || text === 'ok correct') {
                const data = userStates[sender].data;
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

🤵 *Brokerage Applicable* 👍
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
👤 Name: ${data.name}
💰 Budget: ${data.budget}
🏗️ Type: ${data.type}
📍 Location: ${data.location}
🎯 Purpose: ${data.purpose}
(Raw Msg: ${data.raw})`;

                await sock.sendMessage("919822434060@s.whatsapp.net", { text: adminMsg });
                delete userStates[sender]; // clear state
                return;
            } else if (text === 'no' || text === 'n' || text === 'wrong') {
                delete userStates[sender];
                await sock.sendMessage(sender, { text: "No worries! Please fill out the form again with your correct details." });
                return;
            }
        }

        // --- DETAILS DETECTION & CONFIRMATION ---
        // If the user sends a message that looks like the form, or contains details
        const hasDetails = text.includes('name:') || text.includes('budget:') || (text.includes('bhk') && text.includes('k'));
        const originalText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (hasDetails && (!userStates[sender] || userStates[sender].state !== 'WAITING_CONFIRMATION')) {
            
            // Basic parsing logic
            const extract = (regex) => {
                const match = originalText.match(regex);
                return match ? match[1].trim() : "Not Specified";
            };

            const parsedData = {
                name: extract(/name[:\-\s]+([^\n]*)/i) !== "Not Specified" ? extract(/name[:\-\s]+([^\n]*)/i) : pushName,
                budget: extract(/budget[:\-\s]+([^\n]*)/i),
                type: extract(/(?:property type|type)[:\-\s]+([^\n]*)/i),
                location: extract(/location[:\-\s]+([^\n]*)/i),
                purpose: extract(/purpose[:\-\s]+([^\n]*)/i),
                raw: originalText.replace(/\n/g, " ")
            };

            // If some fields couldn't be extracted via standard format, maybe it's just raw text
            if (parsedData.budget === "Not Specified" && originalText.toLowerCase().includes('k')) {
                // If it's totally unstructured text, just capture the whole text
                parsedData.budget = "See raw message";
            }

            const confirmMsg = `📋 *Please verify your details:*
━━━━━━━━━━━━━━━━━━━━━
👤 *Full Name:* ${parsedData.name}
💰 *Budget Range:* ${parsedData.budget}
🏗️ *Property Type:* ${parsedData.type}
📍 *Location:* ${parsedData.location}
🎯 *Purpose:* ${parsedData.purpose}
━━━━━━━━━━━━━━━━━━━━━
*Is this correct?*
(Reply with *Yes* to confirm, or *No* to fill again)`;

            userStates[sender] = { state: 'WAITING_CONFIRMATION', data: parsedData };
            await sock.sendMessage(sender, { text: confirmMsg });
            return;
        }
    });
}

startBot().catch(err => console.log("Error: " + err));
