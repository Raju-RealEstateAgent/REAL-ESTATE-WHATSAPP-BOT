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
}

startBot();
