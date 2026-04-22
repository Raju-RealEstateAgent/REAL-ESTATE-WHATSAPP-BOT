const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('⭐ Real Estate Bot Active'));
app.listen(port, '0.0.0.0');

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState('session_data');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'close') startBot();
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {

        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;

        const textRaw =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text || "";

        const text = textRaw.toLowerCase().trim();

        const selected =
            msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId || "";

        // 🔥 AUTO REACTION
        const react = async (emoji) => {
            await sock.sendMessage(sender, {
                react: { text: emoji, key: msg.key }
            });
        };

        // 🚫 SPAM
        if (/(.)\1{4,}/.test(text)) {
            await sock.sendMessage(sender, { text: "⚠️ Please send a proper message 🙂" });
            await react("⚠️");
            return;
        }

        // 🧠 PURPOSE DETECT
        let purpose = "";
        if (text.includes("buy") || text.includes("lena")) purpose = "Buy";
        if (text.includes("rent")) purpose = "Rent";
        if (text.includes("sell") || text.includes("bech")) purpose = "Sell";

        // 👋 TRIGGER MENU
        if (["hi","hello","hey","start"].some(w => text.includes(w))) {

            await react("👋");

            await sock.sendMessage(sender, {
                text: "🏡 *REAL ESTATE CONSULTANT*\nSelect an option below 👇",
                footer: "Find Your Dream Property",
                title: "📋 Property Menu",
                buttonText: "Choose Option",
                sections: [
                    {
                        title: "🏠 Property Options",
                        rows: [
                            { title: "Buy Property", rowId: "buy" },
                            { title: "Rent Property", rowId: "rent" },
                            { title: "Sell Property", rowId: "sell" }
                        ]
                    },
                    {
                        title: "⚡ Quick Actions",
                        rows: [
                            { title: "Fill Enquiry Form", rowId: "form" },
                            { title: "Contact Agent", rowId: "contact" }
                        ]
                    }
                ]
            });

            return;
        }

        // 🎯 MENU SELECTION HANDLER
        if (selected) {

            await react("👍");

            if (selected === "buy" || selected === "rent" || selected === "sell") {

                await sock.sendMessage(sender, {
                    text: `🏡 You selected *${selected.toUpperCase()} PROPERTY*\n\n📋 Please fill the form below 👇`
                });
            }

            if (selected === "form") {
                // FORM MESSAGE
                const form = `🏡 *REAL ESTATE CONSULTANT*
----------------------------------

📋 PROPERTY ENQUIRY FORM

> 👤 Full Name:
> 💰 Budget Range:
> 🏠 Property Type: (Flat / Villa / Plot)
> 📍 Location:
> 🎯 Purpose: (${selected || "Buy / Rent / Invest"})

----------------------------------

📞 +91 98224 34060

📸 Instagram: @yourbrand
▶️ YouTube: @yourchannel`;

                await sock.sendMessage(sender, { text: form });
            }

            if (selected === "contact") {
                await sock.sendMessage(sender, {
                    text: "📞 Call: +91 98224 34060"
                });
            }

            return;
        }

        // 🧠 DIRECT USER INTENT
        if (purpose) {

            await react("🏡");

            await sock.sendMessage(sender, {
                text: `👍 You want to *${purpose}* property.\n\n📋 Please fill the form 👇`
            });

            return;
        }

        // 📋 DETAILS DETECT
        const isDetails =
            text.includes("name") &&
            text.includes("budget") &&
            text.includes("location");

        if (isDetails) {

            await react("✅");

            const thankYou = `✨ *DETAILS RECEIVED SUCCESSFULLY!* 🙏
----------------------------------

✔ Your requirements are saved  
✔ Our expert is analyzing best options  

[ NEXT ]
----------------------------------

📞 Call within 4 hours  
📂 Property PDFs  
🚗 Free site visit  

----------------------------------

📞 +91 98224 34060

📸 Instagram: @yourbrand
▶️ YouTube: @yourchannel

----------------------------------

🏡 *Trust | Transparency | Luxury*`;

            await sock.sendMessage(sender, { text: thankYou });
            return;
        }

        // 👋 BYE
        if (text.includes("bye")) {
            await react("👋");
            await sock.sendMessage(sender, {
                text: "👋 Thank you! Message anytime for property help 🏡"
            });
            return;
        }

        // 🔄 DEFAULT
        await react("🙂");
        await sock.sendMessage(sender, {
            text: "🏡 Type *Hi* to start or choose from menu."
        });

    });


    or 

    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

// --- RENDER PORT BINDING (Fixes Port Scan Timeout) ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('⭐ Real Estate Bot is Active and Healthy!'));
app.listen(port, '0.0.0.0', () => console.log(`Server listening on port ${port}`));

async function startBot() {
    // Session load karega
    const { state, saveCreds } = await useMultiFileAuthState('session_data');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Render logs mein scanner dikhega agar logout hua toh
        logger: pino({ level: 'silent' }),
        browser: ["Premium Real Estate", "Chrome", "1.0.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ PREMIUM REAL ESTATE BOT IS LIVE ON RENDER!');
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
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase().trim();

        // --- STEP 1: ULTRA-LUXURY WELCOME FORM ---
        const triggerWords = ['hi', 'hello', 'hey', 'start', 'interest', 'info', 'property', 'enquiry'];
        if (triggerWords.some(word => text === word)) {
            
            const welcomeForm = `🏡 *𝐑𝐄𝐀𝐋 𝐄𝐒𝐓𝐀𝐓𝐄 𝐂𝐎𝐍𝐒𝐔𝐋𝐓𝐀𝐍𝐓* 🏡
✨ _𝐹𝒾𝓃𝒹 𝒴𝑜𝓊𝓇 𝒟𝓇𝑒𝒶𝓂 𝐻𝑜𝓂𝑒_ ✨
━━━━━━━━━━━━━━━━━━━━━

Greetings! Thank you for choosing us to find your perfect property. 😊 🔑

📋 *𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 𝐄𝐍𝐐𝐔𝐈𝐑𝐘 𝐅𝐎𝐑𝐌*
━━━━━━━━━━━━━━━━━━━━━
👤 𝖥𝗎𝗅𝗅 𝖭𝖺𝗆𝖾:
💰 𝖡𝗎𝖽𝗀𝖾𝗍 𝖱𝖺𝗇𝗀𝖾:
🏠 𝖯𝗋𝗈𝗉𝖾𝗋𝗍𝗒 𝖳𝗒𝗉𝖾: (𝖥𝗅𝖺𝗍 / 𝖵𝗂𝗅𝗅𝖺 / 𝖯𝗅𝗈𝗍)
📍 𝖫𝗈𝖼𝖺𝗍𝗂𝗈𝗇:
🎯 𝖯𝗎𝗋𝗉𝗈𝗌𝖾: (𝖡𝗎𝗒 / 𝖱𝖾𝗇𝗍 / 𝖨𝗇𝗏𝖾𝗌𝗍)
━━━━━━━━━━━━━━━━━━━━━

💡 *𝖧𝗈𝗐 𝗍𝗈 𝖥𝗂𝗅𝗅:* 
𝖢𝗈𝗉𝗒 𝗍𝗁𝗂𝗌 𝗆𝖾𝗌𝗌𝖺𝗀𝖾, 𝗉𝖺𝗌𝗍𝖾 𝗂𝗍, 𝖺𝗇𝖽 𝗍𝗒𝗉𝖾 𝗒𝗈𝗎𝗋 𝖽𝖾𝗍𝖺𝗂𝗅𝗌 𝗇𝖾𝗑𝗍 𝗍𝗈 𝗍𝗁𝖾 𝗂𝖼𝗈𝗇𝗌.

📞 *𝖣𝗂𝗋𝖾𝗖𝗍 𝖫𝗂𝗇𝖾:* +91 98224 34060
━━━━━━━━━━━━━━━━━━━━━
📌 _𝒪𝓊𝓇 𝓉𝑒𝒶𝓂 𝓌𝒾𝓁𝓁 𝒸𝑜𝓃𝓉𝒶𝒸𝓉 𝓎𝑜𝓊 𝓈𝒽𝑜𝓇𝓉𝓁𝓎!_`;

            await sock.sendMessage(sender, { text: welcomeForm });
            return;
        }

        // --- STEP 2: SMART DETAILS DETECTION & THANK YOU ---
        const isDetails = (text.includes('name') || text.includes('👤')) && 
                          (text.includes('budget') || text.includes('💰')) &&
                          (text.includes('location') || text.includes('📍'));

        if (isDetails) {
            const thankYouMessage = `🎊 *𝐓𝐇𝐀𝐍𝐊 𝐘𝐎𝐔 𝐅𝐎𝐑 𝐓𝐇𝐄 𝐃𝐄𝐓𝐀𝐈𝐋𝐒!* 🎊

✅ *𝐃𝐞𝐭𝐚𝐢𝐥𝐬 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲!* 🙏
We have saved your requirements. Our expert consultant is analyzing the best options for you. 

🚀 *𝐖𝐇𝐀𝐓 𝐇𝐀𝐏𝐏𝐄𝐍𝐒 𝐍𝐄𝐗𝐓?*
📞 You will receive a call within *𝟦 𝐻𝑜𝓊𝓇𝓈*.
📂 Exclusive property PDFs will be sent here.
🚗 We will arrange a *𝖥𝗋𝖾𝖾 𝖲𝗂𝗍𝖾 𝖵𝗂𝗌𝗂𝑡*.

📱 *𝖧𝖾𝗅𝗉𝗅𝗂𝗇𝖾:* +91 98224 34060
━━━━━━━━━━━━━━━━━━━━━
🌟 _𝒯𝓇𝓊𝓈𝓉. 𝒯𝓇𝒶𝓃𝓈𝓅𝒶𝓇𝑒noc𝓎. 𝐿𝓊𝓍𝓊𝓇𝓎._ 🌟`;

            await sock.sendMessage(sender, { text: thankYouMessage });
        }
    });
}

startBot().catch(err => console.log("Error: " + err));
}

startBot();   
