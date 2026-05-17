require("dotenv").config();

const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();

app.use(express.json());


// FILE LƯU USER ĐÃ REPLY
const DATA_FILE = "sent-users.json";

let sentUsers = new Set();


// LOAD DATA
if (fs.existsSync(DATA_FILE)) {

    const data = JSON.parse(
        fs.readFileSync(DATA_FILE)
    );

    sentUsers = new Set(data);
}


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

        // FEED COMMENT
        if (req.body.object === "page") {

            for (const entry of req.body.entry) {


                // =========================
                // COMMENT FACEBOOK
                // =========================
                if (entry.changes) {

                    for (const change of entry.changes) {

                        if (change.field !== "feed") {
                            continue;
                        }

                        const value = change.value;

                        const commentId = value.comment_id;

                        const message = value.message || "";

                        const fromName =
                            value.from?.name || "Unknown";

                        const fromId =
                            value.from?.id || "";

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


                        // CHỈ REPLY 1 LẦN
                        if (!sentUsers.has(fromId)) {

                            try {

                                // REPLY COMMENT
                                await axios.post(
                                    `https://graph.facebook.com/v23.0/${commentId}/comments`,
                                    {
                                        message:
`Dạ anh/chị nhắn tin trực tiếp zalo 0778.107.369 hoặc
vào page để em gửi báo giá và ưu đãi mới nhất nhé ❤️`,
                                        access_token: PAGE_TOKEN
                                    }
                                );

                                console.log("COMMENT REPLIED");


                                // SAVE USER
                                sentUsers.add(fromId);

                                fs.writeFileSync(
                                    DATA_FILE,
                                    JSON.stringify(
                                        [...sentUsers]
                                    )
                                );

                            } catch (replyError) {

                                console.log(
                                    "REPLY ERROR:",
                                    replyError.response?.data ||
                                    replyError.message
                                );
                            }
                        }
                        else {

                            console.log("ALREADY REPLIED");
                        }


                        // TELEGRAM
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
                                telegramError.response?.data ||
                                telegramError.message
                            );
                        }
                    }
                }


                // =========================
                // MESSENGER INBOX
                // =========================
                if (entry.messaging) {

                    for (const messagingEvent of entry.messaging) {

                        const senderId =
                            messagingEvent.sender.id;

                        const text =
                            messagingEvent.message?.text || "";

                        console.log(
                            "NEW MESSAGE:",
                            text
                        );

                        console.log(
                            "SENDER:",
                            senderId
                        );


                        // CHẶN PAGE
                        if (senderId === PAGE_ID) {

                            continue;
                        }


                        try {

                            // AUTO REPLY MESSENGER
                            await axios.post(
                                `https://graph.facebook.com/v23.0/me/messages?access_token=${PAGE_TOKEN}`,
                                {
                                    recipient: {
                                        id: senderId
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

                            console.log(
                                "MESSENGER REPLIED"
                            );

                        } catch (msgError) {

                            console.log(
                                "MESSENGER ERROR:",
                                msgError.response?.data ||
                                msgError.message
                            );
                        }
                    }
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

    console.log(
        `Server running on ${PORT}`
    );
});