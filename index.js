require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());


// ENV
const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;


// HOME
app.get("/", (req, res) => {
    res.send("Facebook Bot Running");
});


// FACEBOOK WEBHOOK VERIFY
app.get("/webhook", (req, res) => {

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("==== VERIFY WEBHOOK ====");
    console.log("TOKEN FACEBOOK:", token);
    console.log("TOKEN SERVER:", VERIFY_TOKEN);

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

        const entry = req.body.entry?.[0];
        const change = entry?.changes?.[0];

        if (change?.field === "feed") {

            const value = change.value;

            const commentId = value.comment_id;

            const message = value.message || "";

            const fromName = value.from?.name || "Unknown";

            console.log("NEW COMMENT:", message);


            // REPLY COMMENT
            await axios.post(
                `https://graph.facebook.com/v23.0/${commentId}/comments`,
                {
                    message: "Anh/chị xem ib nhé ❤️",
                    access_token: PAGE_TOKEN
                }
            );


            // SEND TELEGRAM
            await axios.post(
                `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
                {
                    chat_id: CHAT_ID,
                    text:
`📢 Có khách mới comment

👤 ${fromName}

💬 ${message}

💰 Báo giá:
0.9x2m-50: 250k
0.9x4m-50: 400k

🎁 Mua 5 tặng 2
🚚 Miễn phí vận chuyển`
                }
            );

            console.log("DONE");
        }

        res.sendStatus(200);

    } catch (err) {

        console.log(
            err.response?.data || err.message
        );

        res.sendStatus(500);
    }
});


// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});