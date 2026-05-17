require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());


// DANH SÁCH ĐÃ GỬI
const sentUsers = new Set();


// ENV
const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const PAGE_ID = process.env.PAGE_ID;


// HOME
app.get("/", (req, res) => {
    res.send("Facebook Bot Running");
});


// VERIFY WEBHOOK
app.get("/webhook", (req, res) => {

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("==== VERIFY WEBHOOK ====");

    if (mode && token === VERIFY_TOKEN) {

        console.log("WEBHOOK VERIFIED");

        return res.status(200).send(challenge);
    }

    console.log("VERIFY FAILED");

    return res.sendStatus(403);
});


// RECEIVE FACEBOOK EVENTS
app.post("/webhook", async (req, res) => {

    try {

        if (req.body.object !== "page") {
            return res.sendStatus(404);
        }

        for (const entry of req.body.entry) {

            for (const change of entry.changes) {

                if (change.field !== "feed") {
                    continue;
                }

                const value = change.value;

                const commentId = value.comment_id;

                const message = value.message || "";

                const fromName = value.from?.name || "Unknown";

                const fromId = value.from?.id || "";

                console.log("NEW COMMENT:", message);
                console.log("FROM:", fromName);
                console.log("FROM ID:", fromId);


                // CHẶN COMMENT CỦA PAGE
                if (fromId === PAGE_ID) {

                    console.log("IGNORE PAGE COMMENT");

                    continue;
                }


                // BỎ COMMENT RỖNG
                if (!message || message.length < 1) {

                    console.log("EMPTY COMMENT");

                    continue;
                }


                // CHỈ GỬI 1 LẦN / 1 NGƯỜI
                if (!sentUsers.has(fromId)) {

                    try {

                        // REPLY COMMENT
                        await axios.post(
                            `https://graph.facebook.com/v23.0/${commentId}/comments`,
                            {
                                message:
`Dạ em đã nhắn tin riêng mình rồi nhé ❤️`,
                                access_token: PAGE_TOKEN
                            }
                        );

                        console.log("COMMENT REPLIED");


                        // SEND MESSENGER
                        await axios.post(
                            `https://graph.facebook.com/v23.0/me/messages?access_token=${PAGE_TOKEN}`,
                            {
                                recipient: {
                                    id: fromId
                                },
                                message: {
                                    text:
`💰 Báo giá:
• 0.9x2m-50 : 250k
• 0.9x4m-50 : 400k

🎁 Mua 5 tặng 2
🚚 Miễn phí vận chuyển toàn quốc`
                                }
                            }
                        );

                        console.log("MESSENGER SENT");


                        sentUsers.add(fromId);

                    } catch (msgError) {

                        console.log(
                            "MESSAGE ERROR:",
                            msgError.response?.data || msgError.message
                        );
                    }
                }
                else {

                    console.log("ALREADY SENT");
                }


                // SEND TELEGRAM
                try {

                    await axios.post(
                        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
                        {
                            chat_id: CHAT_ID,
                            text:
`📢 Có khách mới comment

👤 ${fromName}

💬 ${message}

🆔 ${fromId}`
                        }
                    );

                    console.log("TELEGRAM SENT");

                } catch (telegramError) {

                    console.log(
                        "TELEGRAM ERROR:",
                        telegramError.response?.data || telegramError.message
                    );
                }
            }
        }

        return res.sendStatus(200);

    } catch (err) {

        console.log(
            err.response?.data || err.message
        );

        return res.sendStatus(500);
    }
});


// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on ${PORT}`);

});