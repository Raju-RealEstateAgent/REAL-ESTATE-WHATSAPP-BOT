const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { MongoClient } = require('mongodb');
const useMongoDBAuthState = require('./mongoAuthState');
const express = require('express');
const qrcode = require('qrcode-terminal');

// --- RENDER PORT BINDING ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.status(200).send('⭐ Vijay Ratna Bot is Active!'));
app.get('/ping', (req, res) => res.status(200).json({ status: 'ok', time: new Date().toISOString() }));
app.get('/reset-session', async (req, res) => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) return res.status(500).send("No MONGODB_URI found");
        const client = new MongoClient(uri);
        await client.connect();
        await client.db("whatsapp_bot").collection("auth_info").drop();
        res.status(200).send("✅ Session reset! Please restart the bot on Render to get a new QR code.");
    } catch (err) {
        res.status(500).send("Session may already be clear: " + err.message);
    }
});
app.listen(port, '0.0.0.0', () => console.log(`[SERVER] Express server listening on port ${port}`));

// --- USER SESSION STATE ---
const userStates = {};
const adminNumber = "919822434060@s.whatsapp.net";

const BANNER_IMAGE = "https://i.ibb.co/KzcnVvgZ/Picsart-26-04-25-21-45-06-694.jpg";

// --- MESSAGE TEMPLATES ---
const getWelcomeText = (name) => `🏡 *𝐕𝐢𝐣𝐚𝐲 𝐑𝐚𝐭𝐧𝐚 𝐄𝐧𝐭𝐞𝐫𝐩𝐫𝐢𝐬𝐞𝐬* 🏡
✨ _Find Your Dream Home With Us_ ✨
━━━━━━━━━━━━━━━━━━━━━

Greetings *${name}*! Welcome, we're delighted to assist you. 😊

Please select your requirement below 👇`;

const getBuyForm = () => `📋 *𝐁𝐔𝐘 𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 - 𝐄𝐍𝐐𝐔𝐈𝐑𝐘 𝐅𝐎𝐑𝐌* 🏡
━━━━━━━━━━━━━━━━━━━━━
Please reply with your details in this format:

👤 *Name:* (Your full name)
💰 *Budget:* (e.g., 50 Lacs, 1 Cr)
🏗️ *Type:* (Flat / Villa / Plot)
📍 *Location:* (Preferred area in Pune)
🎯 *Purpose:* Buy
━━━━━━━━━━━━━━━━━━━━━
📌 _Simply reply with the above details filled in!_`;

const getRentForm = () => `📋 *𝐑𝐄𝐍𝐓 𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 - 𝐄𝐍𝐐𝐔𝐈𝐑𝐘 𝐅𝐎𝐑𝐌* 🔑
━━━━━━━━━━━━━━━━━━━━━
Please reply with your details in this format:

👤 *Name:* (Your full name)
💰 *Budget:* (Monthly rent e.g., 15k, 25k)
🏗️ *Type:* (Flat / Villa / Room)
📍 *Location:* (Preferred area in Pune)
🎯 *Purpose:* Rent
━━━━━━━━━━━━━━━━━━━━━
📌 _Simply reply with the above details filled in!_`;

const getConfirmMsg = (data) => `📋 *Please verify your details:*
━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${data.name}
💰 *Budget:* ${data.budget}
🏗️ *Type:* ${data.type}
📍 *Location:* ${data.location}
🎯 *Purpose:* ${data.purpose}
━━━━━━━━━━━━━━━━━━━━━
✅ Reply *Yes* to confirm
❌ Reply *No* to re-enter`;

const getThankYouMsg = () => `🎊 *𝐓𝐇𝐀𝐍𝐊 𝐘𝐎𝐔 𝐅𝐎𝐑 𝐘𝐎𝐔𝐑 𝐑𝐄𝐐𝐔𝐈𝐑𝐄𝐌𝐄𝐍𝐓𝐒!* 🎊

✅ *Details Successfully Registered!* 🙏

🚀 *WHAT HAPPENS NEXT?*
📞 Our executive will call you within *4 Hours*.
📂 Exclusive property *Brochures/PDFs* will be sent here.
🚗 We will arrange a *Free Site Visit* for you.

*Stay Connected:*
📸 Instagram: https://instagram.com/evijayratna__enterptises
📺 YouTube: https://youtube.com/@Vijay_ratna_enterprises
🌐 Website: https://vijayratnaenterprises.great-site.net/login

🤵 *Brokerage Applicable* 👍
━━━━━━━━━━━━━━━━━━━━━
🌟 _Trust. Transparency. Excellence._ 🌟`;

async function startBot() {
    console.log("[BOT] Fetching latest WhatsApp version...");
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[BOT] Using WA v${version.join('.')}, isLatest: ${isLatest}`);
    console.log("[BOT] Starting authentication...");
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI is missing.");
        process.exit(1);
    }
    const mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    const collection = mongoClient.db("whatsapp_bot").collection("auth_info");
    const { state, saveCreds } = await useMongoDBAuthState(collection);

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        markOnlineOnConnect: false,
        logger: pino({ level: 'silent' }),
        browser: ["Vijay Ratna", "Chrome", "1.0.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("[BOT] Scan QR code:");
            qrcode.generate(qr, { small: true });
            console.log("\n[BOT] ⚠️ If QR is too big, use this link:");
            console.log("https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" + encodeURIComponent(qr));
        }
        if (connection === 'open') {
            console.log('✅ [BOT] VIJAY RATNA BOT IS LIVE AND CONNECTED!');
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`[BOT] Connection closed. Code: ${statusCode}. Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) {
                setTimeout(startBot, 5000);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        try {
            if (m.type !== 'notify') return;
            const msg = m.messages[0];
            if (!msg.message) return;
            if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;

            const sender = msg.key.remoteJid;
            const pushName = msg.pushName || "Valued Client";

            // --- DETECT MESSAGE TYPE ---
            // Check for interactive list response (user clicked a list button)
            const listResponse = msg.message?.listResponseMessage;
            if (listResponse) {
                const selectedId = listResponse.singleSelectReply?.selectedRowId;
                if (selectedId === 'buy') {
                    userStates[sender] = { state: 'WAITING_FORM', purpose: 'Buy' };
                    await sock.sendMessage(sender, { text: getBuyForm() });
                    return;
                } else if (selectedId === 'rent') {
                    userStates[sender] = { state: 'WAITING_FORM', purpose: 'Rent' };
                    await sock.sendMessage(sender, { text: getRentForm() });
                    return;
                }
            }

            // Extract plain text
            let text = msg.message?.conversation ||
                       msg.message?.extendedTextMessage?.text ||
                       msg.message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
                       msg.message?.ephemeralMessage?.message?.conversation ||
                       "";

            text = text.toLowerCase().trim();
            if (!text) return;

            // --- GREETING → SHOW WELCOME + LIST MENU ---
            const greetings = ["hi", "hello", "hey", "start", "menu", "help", "info", "."];
            const isGreeting = greetings.some(g => text.startsWith(g));

            if (isGreeting) {
                // Send image first (banner)
                try {
                    await sock.sendMessage(sender, {
                        image: { url: BANNER_IMAGE },
                        caption: `🏡 *Vijay Ratna Enterprises* 🏡\n✨ _Your Dream Home Awaits!_ ✨`
                    });
                } catch (e) {
                    console.log("[BOT] Image failed:", e.message);
                }

                // Send welcome text + interactive list menu (real clickable buttons)
                await sock.sendMessage(sender, {
                    listMessage: {
                        title: getWelcomeText(pushName),
                        text: getWelcomeText(pushName),
                        footerText: '📞 +91 98224 34060 | Vijay Ratna Enterprises',
                        buttonText: '🏠 Select Your Requirement',
                        listType: 1,
                        sections: [{
                            title: '🔽 Choose an Option',
                            rows: [
                                {
                                    title: '🏡 Buy Property',
                                    rowId: 'buy',
                                    description: 'Looking to purchase a flat, villa or plot'
                                },
                                {
                                    title: '🔑 Rent Property',
                                    rowId: 'rent',
                                    description: 'Looking for a flat or room on rent'
                                }
                            ]
                        }]
                    }
                });
                return;
            }

            // --- HANDLE YES/NO CONFIRMATION ---
            if (userStates[sender] && userStates[sender].state === 'WAITING_CONFIRMATION') {
                const confirmWords = ['yes', 'y', 'haan', 'correct', 'yep', 'ok', 'okay', 'ha', 'han'];
                const rejectWords = ['no', 'n', 'wrong', 'incorrect', 'edit', 'change', 'nahi', 'nai'];

                const isConfirm = confirmWords.some(w => text === w || text.startsWith(w));
                const isReject = rejectWords.some(w => text === w || text.startsWith(w));

                if (isConfirm && !isReject) {
                    const data = userStates[sender].data;
                    
                    // Thank you message
                    await sock.sendMessage(sender, { text: getThankYouMsg() });
                    
                    // Send admin alert
                    const adminMsg = `🔥 *NEW LEAD ALERT* 🔥
━━━━━━━━━━━━━━━━━━
👤 *Client:* ${pushName}
📱 *Chat:* wa.me/${sender.split('@')[0]}
━━━━━━━━━━━━━━━━━━
📋 *DETAILS:*
👤 Name: ${data.name}
💰 Budget: ${data.budget}
🏗️ Type: ${data.type}
📍 Location: ${data.location}
🎯 Purpose: ${data.purpose}
━━━━━━━━━━━━━━━━━━
💬 _Raw:_ ${data.raw}`;

                    await sock.sendMessage(adminNumber, { text: adminMsg });
                    delete userStates[sender];
                    return;

                } else if (isReject) {
                    delete userStates[sender];
                    const purpose = userStates[sender]?.purpose || 'Buy';
                    await sock.sendMessage(sender, { text: "No problem! Please send your details again in the form format." });
                    return;
                }
            }

            // --- HANDLE FORM DATA ---
            const originalText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const lowerText = originalText.toLowerCase();

            const formKeywords = ['name:', 'budget:', 'type:', 'location:', 'purpose:', 'bhk', 'lacs', 'crore', 'cr', 'lakh', 'villa', 'plot', 'flat'];
            const hasDetails = formKeywords.some(k => lowerText.includes(k));

            if (hasDetails && (!userStates[sender] || userStates[sender].state === 'WAITING_FORM')) {
                const extract = (regex) => {
                    const match = originalText.match(regex);
                    return match ? match[1].trim() : "Not Specified";
                };

                const parsedData = {
                    name: extract(/name[:\-\s]+([^\n]*)/i) !== "Not Specified" ? extract(/name[:\-\s]+([^\n]*)/i) : pushName,
                    budget: extract(/budget[:\-\s]+([^\n]*)/i),
                    type: extract(/(?:property type|type)[:\-\s]+([^\n]*)/i),
                    location: extract(/location[:\-\s]+([^\n]*)/i),
                    purpose: extract(/purpose[:\-\s]+([^\n]*)/i) !== "Not Specified" ? extract(/purpose[:\-\s]+([^\n]*)/i) : (userStates[sender]?.purpose || "Not Specified"),
                    raw: originalText.replace(/\n/g, " ")
                };

                // Fallback extraction
                if (parsedData.budget === "Not Specified" && parsedData.type === "Not Specified") {
                    const lines = originalText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    if (lines.length >= 3) {
                        parsedData.name = lines[0] || pushName;
                        parsedData.budget = lines.find(l => /\d+\s*(k|lac|lakh|cr|crore)/i.test(l)) || lines[1] || "Not Specified";
                        parsedData.type = lines.filter(l => /flat|villa|plot|bhk|room/i.test(l)).join(', ') || lines[2] || "Not Specified";
                        parsedData.purpose = lines.find(l => /buy|rent|invest/i.test(l)) || parsedData.purpose;
                        parsedData.location = lines.find(l => l !== lines[0] && !/\d/.test(l) && !/buy|rent|invest|flat|villa|plot|bhk/i.test(l)) || "Not Specified";
                    }
                }

                userStates[sender] = { state: 'WAITING_CONFIRMATION', data: parsedData };
                await sock.sendMessage(sender, { text: getConfirmMsg(parsedData) });
            }

        } catch (error) {
            console.error("[BOT ERROR]", error.message);
        }
    });
}

startBot().catch(err => console.error("[FATAL ERROR]", err));
