const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const qrcode = require('qrcode-terminal');

// --- CONFIGURATION ---
const ADMIN_NUMBER = "919822434060"; 
const BRAND_NAME   = "𝐕𝐢𝐣𝐚𝐲 𝐑𝐚𝐭𝐧𝐚 𝐄𝐧𝐭𝐞𝐫𝐩𝐫𝐢𝐬𝐞𝐬";
const INSTAGRAM    = "https://instagram.com/evijayratna__enterptises";
const YOUTUBE      = "https://youtube.com/@Vijay_ratna_enterprises";

// --- WEB SERVER FOR RENDER (Keeps bot alive) ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('🏡 Bot is Online!'));
app.listen(port, '0.0.0.0', () => console.log(`✅ Server Live on Port ${port}`));

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
        if (connection === 'open') console.log(`✨ ${BRAND_NAME} CONNECTED!`);
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        // This part reads the text correctly from any type of message
        const text = (msg.message.conversation || 
                      msg.message.extendedTextMessage?.text || 
                      msg.message.listResponseMessage?.singleSelectReply?.selectedRowId || 
                      "").toLowerCase().trim();
        
        const pushName = msg.pushName || "Guest";

        // 1. AUTO REACTION
        const react = async (emoji) => await sock.sendMessage(sender, { react: { text: emoji, key: msg.key } });

        // 2. TRIGGER: WELCOME MENU (Detects Hi, Hello, Hey, Start, Menu)
        const triggerWords = ['hi', 'hello', 'hey', 'start', 'menu', '.', 'info'];
        
        if (triggerWords.includes(text)) {
            await react("👋");
            const welcomeMenu = `╔═══════════════════╗
   🏡 *${BRAND_NAME}* 🏡
╚═══════════════════╝

Greetings, *${pushName}*! ✨
How can we help you today? 

📌 *𝐐𝐔𝐈𝐂𝐊 𝐒𝐄𝐑𝐕𝐈𝐂𝐄𝐒* (Type Number)
━━━━━━━━━━━━━━━━━━━━━
𝟙. *Buy Property* ➜ Luxury Options
𝟚. *Rent Property* ➜ Premium Listings
𝟛. *Sell Property* ➜ List with us
𝟜. *Fill Form* ➜ Requirement Enquiry
𝟝. *Contact Agent* ➜ Speak to Us

📸 *Instagram:* ${INSTAGRAM}
📺 *YouTube:* ${YOUTUBE}
━━━━━━━━━━━━━━━━━━━━━
_Type 'Hi' anytime to see this menu._`;

            await sock.sendMessage(sender, { text: welcomeMenu });
            return;
        }

        // 3. NUMBER BASED RESPONSES
        if (text === '1' || text === 'buy') {
            await sock.sendMessage(sender, { text: "🏠 *Buying Options:* We have luxury flats and villas available. Please type *4* to fill the requirement form so we can suggest the best ones!" });
        } 
        else if (text === '2' || text === 'rent') {
            await sock.sendMessage(sender, { text: "🔑 *Rental Listings:* Please share your preferred location. Type *4* to fill the enquiry form." });
        }
        else if (text === '3' || text === 'sell') {
            await sock.sendMessage(sender, { text: "💰 *Sell Property:* Please send us photos and location of your property, or type *5* to talk to our expert." });
        }
        // 4. PROPERTY FORM
        else if (text === '4' || text === 'form') {
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
_Send the filled form to register._`;
            await sock.sendMessage(sender, { text: form });
        }
        // 5. CONTACT
        else if (text === '5' || text === 'contact') {
            await sock.sendMessage(sender, { text: `📞 *𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐂𝐎𝐍𝐓𝐀𝐂𝐓*\n━━━━━━━━━━━━━━━━━━━━━\n👤 *Admin:* ${BRAND_NAME}\n📱 *WhatsApp:* +${ADMIN_NUMBER}\n📸 *Insta:* ${INSTAGRAM}` });
        }

        // 6. FORM DETECTION (THANK YOU & LEAD ALERT)
        const isFormFilled = (text.includes("👤") || text.includes("name")) && (text.includes("💰") || text.includes("budget"));
        if (isFormFilled) {
            await react("✅");
            await sock.sendMessage(sender, { text: `🎊 *𝐃𝐞𝐭𝐚𝐢𝐥𝐬 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝!* 🙏\n\nThank you *${pushName}*. Our expert from *${BRAND_NAME}* will call you within 4 hours.` });

            // Forward Lead to Admin
            const leadMsg = `🔥 *𝐇𝐎𝐓 𝐋𝐄𝐀𝐃 𝐀𝐋𝐄𝐑𝐓* 🔥\n👤 *Client:* ${pushName}\n📱 *Chat:* wa.me/${sender.split('@')[0]}\n📝 *Details:* \n${text}`;
            await sock.sendMessage(ADMIN_NUMBER + "@s.whatsapp.net", { text: leadMsg });
        }
    });
}

startBot().catch(err => console.log("Error: " + err));
