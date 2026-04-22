const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const qrcode = require('qrcode-terminal');

// --- 1. CONFIGURATION (Vijay Ratna Enterprises) ---
const ADMIN_NUMBER = "919822434060"; 
const BRAND_NAME   = "𝐕𝐢𝐣𝐚𝐲 𝐑𝐚𝐭𝐧𝐚 𝐄𝐧𝐭𝐞𝐫𝐩𝐫𝐢𝐬𝐞𝐬";
const INSTAGRAM    = "https://instagram.com/evijayratna__enterptises";
const YOUTUBE      = "https://youtube.com/@Vijay_ratna_enterprises";

// --- 2. RENDER PORT FIX (Zaroori hai) ---
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('🏡 Vijay Ratna Bot is Running!'));
app.listen(port, '0.0.0.0', () => console.log(`✅ Server Live on Port ${port}`));

async function startBot() {
    // Session load karega (session_data folder se)
    const { state, saveCreds } = await useMultiFileAuthState('session_data');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Render logs mein QR dikhega
        logger: pino({ level: 'silent' }),
        browser: [BRAND_NAME, "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'open') console.log(`✨ ${BRAND_NAME} IS ONLINE!`);
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const sender = msg.key.remoteJid;
            // Message reading logic
            const text = (msg.message.conversation || 
                          msg.message.extendedTextMessage?.text || 
                          "").toLowerCase().trim();
            
            const pushName = msg.pushName || "Guest";

            // Helper: Emoji Reaction
            const react = async (emoji) => await sock.sendMessage(sender, { react: { text: emoji, key: msg.key } });

            // --- WELCOME MENU (Detects Hi, Hello, Hey, Start, Menu, .) ---
            const triggerWords = ['hi', 'hello', 'hey', 'start', 'menu', '.', 'vijay'];
            
            if (triggerWords.some(word => text === word)) {
                await react("👋");
                const welcomeMenu = `╔═══════════════════╗
   🏡 *${BRAND_NAME}* 🏡
╚═══════════════════╝

Namaste *${pushName}*! ✨
Find your luxury lifestyle with our expert consultancy.

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

            // --- NUMBER BASED RESPONSES ---
            if (text === '1') {
                await sock.sendMessage(sender, { text: "🏠 *Buying Options:* We have premium flats, villas, and plots. Please type *4* to fill the form so we can suggest the best ones!" });
            } 
            else if (text === '2') {
                await sock.sendMessage(sender, { text: "🔑 *Rental Listings:* We provide premium rental spaces. Please share your location or type *4* to fill the form." });
            }
            else if (text === '3') {
                await sock.sendMessage(sender, { text: "💰 *Sell Property:* Want to list your property? Please send photos/location here, or type *5* to speak with our expert." });
            }
            else if (text === '4') {
                await react("📋");
                const form = `┏━━━━━━━━━━━━━━━━━━━━┓
     📋 *𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 𝐅𝐎𝐑𝐌*
┗━━━━━━━━━━━━━━━━━━━━┛
*Please Copy, Paste & Fill:*

👤 *Full Name:* 
💰 *Budget:* 
🏗️ *Property Type:* 
📍 *Location:* 
🎯 *Purpose:* (Buy/Rent/Invest)

━━━━━━━━━━━━━━━━━━━━━
_Fill the details and send back._`;
                await sock.sendMessage(sender, { text: form });
            }
            else if (text === '5') {
                await sock.sendMessage(sender, { text: `📞 *𝐂𝐎𝐍𝐓𝐀𝐂𝐓 𝐔𝐒*\n━━━━━━━━━━━━━━━━━━━━━\n👤 *Admin:* ${BRAND_NAME}\n📱 *WhatsApp:* +${ADMIN_NUMBER}\n📸 *Insta:* ${INSTAGRAM}` });
            }

            // --- FORM DETECTION (Thank You & Lead Forwarding) ---
            const isFormFilled = (text.includes("name") || text.includes("👤")) && (text.includes("budget") || text.includes("💰"));
            if (isFormFilled) {
                await react("✅");
                await sock.sendMessage(sender, { text: `🎊 *𝐃𝐞𝐭𝐚𝐢𝐥𝐬 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝!* 🙏\n\nThank you *${pushName}*. Hamara consultant aapko jaldi call karega. Have a great day! 🌟` });

                // Lead Forward to Admin
                const leadMsg = `🔥 *𝐇𝐎𝐓 𝐋𝐄𝐀𝐃 𝐀𝐋𝐄𝐑𝐓* 🔥\n👤 *Client:* ${pushName}\n📱 *Chat:* wa.me/${sender.split('@')[0]}\n📝 *Details:* \n${text}`;
                await sock.sendMessage(ADMIN_NUMBER + "@s.whatsapp.net", { text: leadMsg });
            }

        } catch (err) {
            console.log("Error handling message:", err);
        }
    });
}

startBot().catch(err => console.log("Start Error: " + err));
