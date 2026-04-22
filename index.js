const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const qrcode = require('qrcode-terminal');

// --- ⚙️ CONFIGURATION (Vijay Ratna Enterprises) ---
const ADMIN_NUMBER = "919822434060"; 
const BRAND_NAME   = "𝐕𝐢𝐣𝐚𝐲 𝐑𝐚𝐭𝐧𝐚 𝐄𝐧𝐭𝐞𝐫𝐩𝐫𝐢𝐬𝐞𝐬";
const WEBSITE      = "https://www.vijayratna.com"; 
const INSTAGRAM    = "https://instagram.com/evijayratna__enterptises";
const YOUTUBE      = "https://youtube.com/@Vijay_ratna_enterprises";

// --- 🌐 WEB SERVER (Permanent Fix for Render) ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('🏡 Vijay Ratna Bot: Status Online ✅'));
app.listen(port, '0.0.0.0', () => console.log(`✅ Web Server Active on Port ${port}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_data');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: [BRAND_NAME, "Chrome", "1.0.0"],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'open') console.log(`✨ ${BRAND_NAME} IS NOW ONLINE`);
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;

            const sender = msg.key.remoteJid;
            const pushName = msg.pushName || "Guest";
            const text = (msg.message.conversation || 
                          msg.message.extendedTextMessage?.text || 
                          "").toLowerCase().trim();

            const react = async (emoji) => await sock.sendMessage(sender, { react: { text: emoji, key: msg.key } });

            // --- UNLIMITED HI/HELLO DETECTION ---
            const hiRegex = /^(h+i+|h+e+l+l+o+|h+e+y+|s+t+a+r+t+|m+e+n+u+|v+i+j+a+y+|\.|\!)/i;
            
            if (hiRegex.test(text)) {
                await react("👋");
                const welcomeMenu = `╔════════════════════╗
   🏡 *${BRAND_NAME}* 🏡
╚════════════════════╝

Greetings, *${pushName}*! ✨
Your trusted partner in premium properties. 🗝️

📌 *𝐐𝐔𝐈𝐂𝐊 𝐒𝐄𝐑𝐕𝐈𝐂𝐄𝐒* (Type Number)
━━━━━━━━━━━━━━━━━━━━━
𝟙. *Buy Property* ➜ Luxury Options
𝟚. *Rent Property* ➜ Premium Listings
𝟛. *Sell Property* ➜ List with Us
𝟜. *Fill Form* ➜ Property Enquiry
𝟝. *Contact Agent* ➜ Speak to Us

🌐 *𝐎𝐔𝐑 𝐃𝐈𝐆𝐈𝐓𝐀𝐋 𝐏𝐑𝐄𝐒𝐄𝐍𝐂𝐄*
━━━━━━━━━━━━━━━━━━━━━
🔗 *Web:* ${WEBSITE}
📸 *Insta:* ${INSTAGRAM}
📺 *YT:* ${YOUTUBE}

━━━━━━━━━━━━━━━━━━━━━
_Reply with 'Hi' to see this menu._`;
                await sock.sendMessage(sender, { text: welcomeMenu });
                return;
            }

            // --- MENU RESPONSES (Numbers 1-5) ---
            if (text === '1') {
                await sock.sendMessage(sender, { text: "🏠 *Buying:* We have premium Flats, Villas, and Plots. \n\n👉 Type *4* to fill the form for best matches!" });
            } 
            else if (text === '2') {
                await sock.sendMessage(sender, { text: "🔑 *Rent:* Searching for premium rentals? \n\n👉 Type *4* to share your requirements via our form." });
            }
            else if (text === '3') {
                await sock.sendMessage(sender, { text: "💰 *Sell:* Want to list your property? \n\n👉 Send photos/location here, or type *5* to speak with us." });
            }
            else if (text === '4' || text === 'form') {
                await react("📋");
                const form = `┏━━━━━━━━━━━━━━━━━━━━┓
     📋 *𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 𝐅𝐎𝐑𝐌*
┗━━━━━━━━━━━━━━━━━━━━┛
*Please Copy, Paste & Fill:*

👤 *Full Name:* 
💰 *Budget Range:* 
🏗️ *Property Type:* 
📍 *Location:* 
🎯 *Purpose:* (Buy/Rent/Invest)

━━━━━━━━━━━━━━━━━━━━━
🏡 *${BRAND_NAME}*
🌐 *Web:* ${WEBSITE}
📸 *Insta:* ${INSTAGRAM}
━━━━━━━━━━━━━━━━━━━━━`;
                await sock.sendMessage(sender, { text: form });
            }
            else if (text === '5' || text === 'contact') {
                await react("📞");
                await sock.sendMessage(sender, { text: `📞 *𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐂𝐎𝐍𝐓𝐀𝐂𝐓* \n━━━━━━━━━━━━━━━━━━━━━\n👤 *Admin:* ${BRAND_NAME}\n📱 *WhatsApp:* +${ADMIN_NUMBER}\n🌐 *Web:* ${WEBSITE}\n📸 *Insta:* ${INSTAGRAM}` });
            }

            // --- LEAD DETECTION & THANK YOU ---
            const isFormFilled = (text.includes("name") || text.includes("👤")) && (text.includes("budget") || text.includes("💰"));
            if (isFormFilled) {
                await react("✅");
                const thanks = `🎊 *𝐒𝐔𝐂𝐂𝐄𝐒𝐒, ${pushName.toUpperCase()}!* 🎊
━━━━━━━━━━━━━━━━━━━━━
Details registered at *${BRAND_NAME}*! 🤝

🚀 *𝐖𝐇𝐀𝐓 𝐇𝐀𝐏𝐏𝐄𝐍𝐒 𝐍𝐄𝐗𝐓?*
📞 Expert Call within *4 Hours*.
📂 Exclusive *Brochures* on WhatsApp.
🚗 *Free Site Visit* arrangement.

🌐 *𝐒𝐓𝐀𝐘 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃*
🔗 *Web:* ${WEBSITE}
📸 *Insta:* ${INSTAGRAM}
📺 *YT:* ${YOUTUBE}

━━━━━━━━━━━━━━━━━━━━━
*Contact:* +${ADMIN_NUMBER}`;
                await sock.sendMessage(sender, { text: thanks });

                // Lead Forwarding to Admin
                const adminAlert = `🔥 *𝐍𝐄𝐖 𝐋𝐄𝐀𝐃* (Vijay Ratna) 🔥
━━━━━━━━━━━━━━━━━━━━━
👤 *Client:* ${pushName}
📱 *Chat:* wa.me/${sender.split('@')[0]}
📝 *Details:*
${text}
━━━━━━━━━━━━━━━━━━━━━`;
                await sock.sendMessage(ADMIN_NUMBER + "@s.whatsapp.net", { text: adminAlert });
            }

        } catch (err) { console.log("Msg Error:", err); }
    });
}

startBot().catch(err => console.log("Start Error:", err));
