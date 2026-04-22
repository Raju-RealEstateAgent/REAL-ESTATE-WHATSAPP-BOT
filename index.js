const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const qrcode = require('qrcode-terminal');

// ==========================================
// ⚙️ CONFIGURATION (Aapki Details Fixed)
// ==========================================
const ADMIN_NUMBER = "919822434060"; 
const BRAND_NAME   = "𝐕𝐢𝐣𝐚𝐲 𝐑𝐚𝐭𝐧𝐚 𝐄𝐧𝐭𝐞𝐫𝐩𝐫𝐢𝐬𝐞𝐬";
const WEBSITE      = "Under Construction";
const INSTAGRAM    = "https://instagram.com/evijayratna__enterptises";
const YOUTUBE      = "https://youtube.com/@Vijay_ratna_enterprises";

// --- WEB SERVER FOR RENDER ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('🏡 Vijay Ratna Bot is Active! ✅'));
app.listen(port, '0.0.0.0', () => console.log(`✅ Web Server Live on Port ${port}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_data');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: [BRAND_NAME, "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'open') console.log(`✨ ${BRAND_NAME} CONNECTED SUCCESSFULLY`);
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;

        const sender = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase().trim();
        const pushName = msg.pushName || "Guest";

        const react = async (emoji) => await sock.sendMessage(sender, { react: { text: emoji, key: msg.key } });

        const isGreeting = ["hi", "hello", "hey", "start", "menu"].includes(text);
        const isFormFilled = (text.includes("👤") || text.includes("name")) && (text.includes("💰") || text.includes("budget"));

        // A. LUXURY WELCOME MENU
        if (isGreeting) {
            await react("👋");
            const welcome = `╔═══════════════════╗
   🏡 *${BRAND_NAME}* 🏡
╚═══════════════════╝

Greetings, *${pushName}*! ✨
Find your luxury lifestyle with our expert consultancy.

📌 *𝐐𝐔𝐈𝐂𝐊 𝐒𝐄𝐑𝐕𝐈𝐂𝐄𝐒*
━━━━━━━━━━━━━━━━━━━━━
𝟙. Type *'Buy'* ➜ Luxury Properties
𝟚. Type *'Rent'* ➜ Premium Rentals
𝟛. Type *'Sell'* ➜ List Your Property
𝟜. Type *'Form'* ➜ Property Enquiry
𝟝. Type *'Contact'* ➜ Speak to Agent

🌐 *𝐕𝐈𝐒𝐈𝐓 𝐎𝐔𝐑 𝐒𝐎𝐂𝐈𝐀𝐋𝐒*
📸 *Insta:* ${INSTAGRAM}

━━━━━━━━━━━━━━━━━━━━━
_Reply with 'Hi' to see this menu again._`;
            await sock.sendMessage(sender, { text: welcome });
            return;
        }

        // B. PROPERTY FORM
        if (text === "form" || text === "fill form") {
            await react("📋");
            const form = `┏━━━━━━━━━━━━━━━━━━━━┓
     📋 *𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 𝐅𝐎𝐑𝐌*
┗━━━━━━━━━━━━━━━━━━━━┛
*Please Copy, Paste & Fill:*

👤 *Full Name:* 
💰 *Budget Range:* 
🏗️ *Property Type:* (Flat/Villa/Plot)
📍 *Location:* 
🎯 *Purpose:* (Buy/Rent/Invest)

━━━━━━━━━━━━━━━━━━━━━
📸 *Insta:* ${INSTAGRAM}
📺 *YouTube:* ${YOUTUBE}
━━━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(sender, { text: form });
            return;
        }

        // C. THANK YOU & ADMIN LEAD
        if (isFormFilled) {
            await react("✅");
            const thanks = `🎊 *𝐒𝐔𝐂𝐂𝐄𝐒𝐒, ${pushName.toUpperCase()}!* 🎊
━━━━━━━━━━━━━━━━━━━━━
Details registered successfully! 🤝

🚀 *𝐖𝐇𝐀𝐓'𝐒 𝐍𝐄𝐗𝐓?*
📞 Expert Call within *4 Hours*.
📂 Exclusive *Brochures* on WhatsApp.
🚗 *Free Site Visit* arrangement.

🌐 *𝐒𝐓𝐀𝐘 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃*
📸 *Instagram:* ${INSTAGRAM}
📺 *YouTube:* ${YOUTUBE}

━━━━━━━━━━━━━━━━━━━━━
*Admin:* +${ADMIN_NUMBER}`;
            await sock.sendMessage(sender, { text: thanks });

            // Lead Forwarding to Admin
            const clientPhone = sender.split('@')[0];
            const adminLead = `🔥 *𝐇𝐎𝐓 𝐋𝐄𝐀𝐃 𝐀𝐋𝐄𝐑𝐓* 🔥
👤 *Client:* ${pushName}
📱 *Chat:* wa.me/${clientPhone}
📝 *Details:* 
${text}`;
            await sock.sendMessage(ADMIN_NUMBER + "@s.whatsapp.net", { text: adminLead });
            return;
        }

        // D. CONTACT
        if (text === "contact") {
            await react("📞");
            await sock.sendMessage(sender, { text: `📞 *𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐂𝐎𝐍𝐓𝐀𝐂𝐓* \n━━━━━━━━━━━━━━━━━━━━━\n👤 *Admin:* ${BRAND_NAME}\n📱 *WhatsApp:* +${ADMIN_NUMBER}\n📸 *Insta:* ${INSTAGRAM}` });
        }
    });
}

startBot().catch(err => console.log("Error: " + err));
