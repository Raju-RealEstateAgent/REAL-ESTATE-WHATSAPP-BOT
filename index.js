const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { MongoClient } = require('mongodb');
const useMongoDBAuthState = require('./mongoAuthState');
const express = require('express');
const qrcode = require('qrcode-terminal');

// --- RENDER PORT BINDING (Fixes Port Scan Timeout) ---
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
        res.status(200).send("✅ Session reset successfully! Please restart the bot in Render to get a new QR code.");
    } catch (err) {
        res.status(500).send("Session may already be clear or an error occurred: " + err.message);
    }
});
app.listen(port, '0.0.0.0', () => console.log(`[SERVER] Express server listening on port ${port}`));

// --- USER SESSION STATE ---
const userStates = {};
const adminNumber = "919822434060@s.whatsapp.net"; // Format with @s.whatsapp.net

async function startBot() {
    console.log("[BOT] Fetching latest WhatsApp version...");
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[BOT] Using WA v${version.join('.')}, isLatest: ${isLatest}`);
    
    console.log("[BOT] Starting authentication...");
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI is missing. Please set it in environment variables.");
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
            console.log("[BOT] Please scan the QR code above to link your WhatsApp.");
            qrcode.generate(qr, { small: true });
            console.log("\n[BOT] ⚠️ If the QR code above is broken or too big to scan, click this link to view it:");
            console.log("https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" + encodeURIComponent(qr));
        }
        
        if (connection === 'open') {
            console.log('✅ [BOT] VIJAY RATNA BOT IS LIVE AND CONNECTED!');
        }
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`[BOT] Connection closed. Reason code: ${statusCode}. Reconnecting: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                setTimeout(startBot, 5000); // Reconnect with a delay to prevent spam
            } else {
                console.log("[BOT] Logged out. Please delete the 'session_data' folder and scan QR again.");
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        try {
            if (m.type !== 'notify') return; // Only process new incoming messages
            const msg = m.messages[0];
            if (!msg.message) return;

            const sender = msg.key.remoteJid;
            const pushName = msg.pushName || "Valued Client";
            
            let text = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || 
                       msg.message?.ephemeralMessage?.message?.extendedTextMessage?.text || 
                       msg.message?.ephemeralMessage?.message?.conversation || 
                       "";
            
            text = text.toLowerCase().trim();
            
            if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;
            if (!text) return; // Ignore non-text messages

            // --- TRIGGER DETECTION ---
            const greetings = ["hi", "hello", "hey", "start", "menu", "help", "info", "."];
            const isGreeting = greetings.some(g => text.startsWith(g));

            if (isGreeting) {
                const welcomeForm = `🏡 *𝐕𝐢𝐣𝐚𝐲 𝐑𝐚𝐭𝐧𝐚 𝐄𝐧𝐭𝐞𝐫𝐩𝐫𝐢𝐬𝐞𝐬* 🏡
✨ _Find Your Dream Home With Us_ ✨
━━━━━━━━━━━━━━━━━━━━━

Greetings *${pushName}*! Thank you for choosing us. 😊 🗝️

To serve you better, please reply with your requirements in the following format:

📋 *𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 𝐄𝐍𝐐𝐔𝐈𝐑𝐘 𝐅𝐎𝐑𝐌*
━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* (Your full name)
💰 *Budget:* (e.g., 50 Lacs, 1 Cr)
🏗️ *Type:* (Flat / Villa / Plot)
📍 *Location:* (Preferred area)
🎯 *Purpose:* (Buy / Rent / Invest)
━━━━━━━━━━━━━━━━━━━━━

*Connect with us:*
📸 *Instagram:* https://instagram.com/evijayratna__enterptises
📺 *YouTube:* https://youtube.com/@Vijay_ratna_enterprises
🌐 *Website:* https://vijayratnaenterprises.great-site.net/login

🤵 *Brokerage Applicable* 👍
📞 *Contact:* +91 98224 34060
━━━━━━━━━━━━━━━━━━━━━
📌 _Simply reply to this message with your details, and our team will contact you shortly!_`;

                try {
                    // 1. Send the premium image with the welcome form as a caption
                    await sock.sendMessage(sender, { 
                        image: { url: "https://i.ibb.co/KzcnVvgZ/Picsart-26-04-25-21-45-06-694.jpg" },
                        caption: welcomeForm 
                    });
                } catch (imgErr) {
                    console.log("[BOT] Image send failed, sending text instead:", imgErr.message);
                    await sock.sendMessage(sender, { text: welcomeForm });
                }

                try {
                    // 2. Send a poll message which acts as interactive buttons
                    await sock.sendMessage(sender, {
                        poll: {
                            name: '🎯 Quick Select (Optional):',
                            values: ['Buy Property 🏡', 'Rent Property 🔑', 'List a Property 🤝', 'Investments 📈'],
                            selectableCount: 1
                        }
                    });
                } catch (pollErr) {
                    console.log("[BOT] Poll send failed:", pollErr.message);
                }
                
                return;
            }

            // --- HANDLE WAITING CONFIRMATION ---
            if (userStates[sender] && userStates[sender].state === 'WAITING_CONFIRMATION') {
                const confirmWords = ['yes', 'y', 'haan', 'correct', 'yep', 'ok', 'okay', 'perfect', 'done'];
                const rejectWords = ['no', 'n', 'wrong', 'incorrect', 'edit', 'change'];
                
                const isConfirm = confirmWords.some(w => text === w || text.includes(w));
                const isReject = rejectWords.some(w => text === w || text.includes(w));

                if (isConfirm && !isReject) {
                    const data = userStates[sender].data;
                    const thankYouMessage = `🎊 *𝐓𝐇𝐀𝐍𝐊 𝐘𝐎𝐔 𝐅𝐎𝐑 𝐘𝐎𝐔𝐑 𝐑𝐄𝐐𝐔𝐈𝐑𝐄𝐌𝐄𝐍𝐓𝐒!* 🎊

✅ *Details Successfully Registered!* 🙏
*Vijay Ratna Enterprises* has saved your profile.

🚀 *WHAT HAPPENS NEXT?*
📞 Our executive will call you within *4 Hours*.
📂 Exclusive property *Brochures/PDFs* will be sent here.
🚗 We will arrange a *Free Site Visit* for you.

*Stay Connected:*
📸 *Instagram:* https://instagram.com/evijayratna__enterptises
📺 *YouTube:* https://youtube.com/@Vijay_ratna_enterprises
🌐 *Website:* https://vijayratnaenterprises.great-site.net/login 

🤵 *Brokerage Applicable* 👍
━━━━━━━━━━━━━━━━━━━━━
🌟 _Trust. Transparency. Excellence._ 🌟`;

                    await sock.sendMessage(sender, { text: thankYouMessage });
                    await sock.sendMessage(sender, {
                        image: { url: "https://i.ibb.co/KzcnVvgZ/Picsart-26-04-25-21-45-06-694.jpg" },
                        caption: "🏡 *Vijay Ratna Enterprises* - Your Trusted Real Estate Partner"
                    });

                    const adminMsg = `🔥 *NEW LEAD ALERT* 🔥
━━━━━━━━━━━━━━━━━━
👤 *Client Name:* ${pushName}
📱 *Chat Link:* wa.me/${sender.split('@')[0]}
━━━━━━━━━━━━━━━━━━
📋 *REQUIREMENTS:*
👤 Name: ${data.name}
💰 Budget: ${data.budget}
🏗️ Type: ${data.type}
📍 Location: ${data.location}
🎯 Purpose: ${data.purpose}

💬 *Raw Message:* 
_${data.raw}_
━━━━━━━━━━━━━━━━━━`;

                    await sock.sendMessage(adminNumber, { text: adminMsg });
                    delete userStates[sender];
                    return;
                } else if (isReject) {
                    delete userStates[sender];
                    await sock.sendMessage(sender, { text: "No worries! Please reply with your correct details in the form format again." });
                    return;
                }
            }

            // --- DETAILS DETECTION & CONFIRMATION ---
            const originalText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const lowerOriginalText = originalText.toLowerCase();
            
            // Check if message has form keywords or looks like a requirement
            const formKeywords = ['name:', 'budget:', 'type:', 'location:', 'purpose:', 'bhk', 'lacs', 'crore', 'cr', 'lakh', 'villa', 'plot', 'flat'];
            const hasDetails = formKeywords.some(keyword => lowerOriginalText.includes(keyword));

            if (hasDetails && (!userStates[sender] || userStates[sender].state !== 'WAITING_CONFIRMATION')) {
                
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

                // Fallback smart extraction
                if (parsedData.budget === "Not Specified" && parsedData.type === "Not Specified") {
                    let lines = originalText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    
                    if (lines.length >= 3) {
                        parsedData.name = lines[0] || pushName;
                        parsedData.budget = lines.find(l => /\d+\s*(k|lac|lakh|cr|crore)/i.test(l)) || lines[1] || "Not Specified";
                        parsedData.type = lines.filter(l => /flat|falt|villa|plot|bhk|parking|apt/i.test(l)).join(', ') || lines[2] || "Not Specified";
                        parsedData.purpose = lines.find(l => /buy|rent|invest/i.test(l)) || "Not Specified";
                        parsedData.location = lines.find(l => 
                            l !== lines[0] && !/\d/.test(l) && !/buy|rent|invest|flat|falt|villa|plot|bhk/i.test(l)
                        ) || "Not Specified";
                    }
                }

                // If we still didn't parse anything meaningful, just use the raw text and mark as "Detected from message"
                if (parsedData.budget === "Not Specified" && parsedData.type === "Not Specified" && parsedData.location === "Not Specified") {
                    parsedData.budget = "Please verify with client";
                    parsedData.type = "Please verify with client";
                    parsedData.location = "Please verify with client";
                    parsedData.purpose = "Please verify with client";
                }

                const confirmMsg = `📋 *Please verify your details:*
━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${parsedData.name}
💰 *Budget:* ${parsedData.budget}
🏗️ *Type:* ${parsedData.type}
📍 *Location:* ${parsedData.location}
🎯 *Purpose:* ${parsedData.purpose}
━━━━━━━━━━━━━━━━━━━━━
*Are these details correct?*
👉 Reply with *Yes* to confirm.
👉 Reply with *No* to fill again.`;

                userStates[sender] = { state: 'WAITING_CONFIRMATION', data: parsedData };
                await sock.sendMessage(sender, { text: confirmMsg });
                return;
            }
        } catch (error) {
            console.error("[BOT ERROR] Error processing message:", error);
        }
    });
}

startBot().catch(err => console.error("[FATAL ERROR] Bot failed to start:", err));


