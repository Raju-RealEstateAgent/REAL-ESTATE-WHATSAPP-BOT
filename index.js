const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const qrcode = require('qrcode-terminal');

// ==========================================
// ⚙️ CONFIGURATION (Apni Details Yahan Dalein)
// ==========================================
const ADMIN_NUMBER = "+919822434060,
                      +919561859020"; 
const BRAND_NAME   = "Vijay Ratna Enterprises";
const WEBSITE      = "IN PROSSES";
const INSTAGRAM    = "https://instagram.com/@vijayratna__enterptises";
const YOUTUBE      = "https://youtube.com/@Vijay_ratna_enterprises";
// ==========================================

const app = express();
app.get('/', (req, res) => res.send('🏡 Premium Bot is Active...'));
app.listen(process.env.PORT || 3000, () => console.log("✅ Web Server Live"));

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
        if (connection === 'open') console.log(`✨ ${BRAND_NAME} CONNECTED`);
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase().trim();
        const pushName = msg.pushName || "Guest";

        const react = async (emoji) => await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });

        // --- 1. INTENT DETECTION ---
        let intentMsg = "";
        if (text.includes("buy") || text.includes("kharidna")) {
            intentMsg = "✨ _Looking for a new Home? You are in the right place!_";
        } else if (text.includes("rent") || text.includes("kiraya")) {
            intentMsg = "✨ _Searching for a rental? Explore our premium listings._";
        }

        const isGreeting = ["hi", "hello", "hey", "start", "menu"].includes(text);
        const isFormFilled = (text.includes("👤") || text.includes("full name:")) && (text.includes("💰") || text.includes("budget:"));

        // A. MAIN WELCOME MENU
        if (isGreeting) {
            await react("👋");
            const welcome = `╔═══════════════════╗
   🏡 *${BRAND_NAME}* 🏡
╚═══════════════════╝

Greetings, *${pushName}*! ✨
${intentMsg}

📌 *𝐐𝐔𝐈𝐂𝐊 𝐒𝐄𝐑𝐕𝐈𝐂𝐄𝐒*
━━━━━━━━━━━━━━━━━━━━
𝟙. Type *'Buy'* ➜ Luxury Properties
𝟚. Type *'Rent'* ➜ Premium Rentals
𝟛. Type *'Sell'* ➜ List Your Property
𝟜. Type *'Form'* ➜ Property Enquiry
𝟝. Type *'Contact'* ➜ Speak to Agent

🌐 *𝐕𝐈𝐒𝐈𝐓 𝐎𝐔𝐑 𝐖𝐄𝐁𝐒𝐈𝐓𝐄*
🔗 ${In Prosess}

━━━━━━━━━━━━━━━━━━━━
_Reply with 'Hi' to see this menu again._`;
            await sock.sendMessage(jid, { text: welcome });

        // B. PROPERTY FORM (With Socials)
        } else if (text === "form" || text === "fill form") {
            await react("📋");
            const form = `┏━━━━━━━━━━━━━━━━━━━━┓
     📋 *𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 𝐅𝐎𝐑𝐌*
┗━━━━━━━━━━━━━━━━━━━━┛
*Please Copy, Paste & Fill:*

👤 *Full Name:* 
💰 *Budget Range:* 
🏘️ *Property Type:* (Flat/Villa/Plot)
📍 *Location:* 
🎯 *Purpose:* (Buy/Rent/Invest)

━━━━━━━━━━━━━━━━━━━━
🌐 *Web:* ${IN PROsESS}
📸 *Insta:* ${INSTAGRAM}
━━━━━━━━━━━━━━━━━━━━
_Fill the details above to get exclusive PDFs._`;
            await sock.sendMessage(jid, { text: form });

        // C. THANK YOU MESSAGE (With Socials)
        } else if (isFormFilled) {
            await react("✅");
            
            const thanks = `🎊 *𝐒𝐔𝐂𝐂𝐄𝐒𝐒, ${pushName.toUpperCase()}!* 🎊
━━━━━━━━━━━━━━━━━━━━
Requirements registered successfully! 🤝

🚀 *𝐖𝐇𝐀𝐓'𝐒 𝐍𝐄𝐗𝐓?*
📞 Expert Call within *4 Hours*.
📂 Exclusive *Brochures* on WhatsApp.
🚗 *Free Site Visit* arrangement.

🌐 *𝐒𝐓𝐀𝐘 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃*
━━━━━━━━━━━━━━━━━━━━
🔗 *Website:* ${WEBSITE}
📸 *Instagram:* ${INSTAGRAM}
📺 *YouTube:* ${YOUTUBE}

━━━━━━━━━━━━━━━━━━━━
*Admin:* +${ADMIN_NUMBER}`;
            await sock.sendMessage(jid, { text: thanks });

            // Notification to Admin
            const leadAlert = `🔥 *𝐇𝐎𝐓 𝐋𝐄𝐀𝐃 𝐀𝐋𝐄𝐑𝐓* 🔥
👤 *Client:* ${pushName}
📱 *Chat:* wa.me/${jid.split('@')[0]}
📝 *Details:*
${text}`;
            await sock.sendMessage(ADMIN_NUMBER + "@s.whatsapp.net", { text: leadAlert });

        // D. CONTACT
        } else if (text === "contact") {
            await react("📞");
            await sock.sendMessage(jid, { text: `📞 *𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐂𝐎𝐍𝐓𝐀𝐂𝐓* 
━━━━━━━━━━━━━━━━━━━━
👤 *Admin:* Real Estate Expert
📱 *WhatsApp:* +${ADMIN_NUMBER}
🌐 *Website:* ${WEBSITE}
📸 *Instagram:* ${INSTAGRAM}` });

        } else {
            await react("🙂");
            await sock.sendMessage(jid, { text: "Please type *'Hi'* to explore our property services. 🏡✨" });
        }
    });
}

startBot().catch(err => console.log("Error: " + err));
