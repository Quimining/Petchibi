require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;


// Trang chủ
app.get("/", (req, res) => {
    res.send("Facebook Bot Running");
});


// Verify webhook Facebook
app.get("/webhook", (req, res) => {

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {

        console.log("Webhook verified");

        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
});


// Nhận comment Facebook
app.post("/webhook", async (req, res) => {

    try {

        const entry = req.body.entry?.[0];
        const change = entry?.changes?.[0];

        if (change?.field === "feed") {

            const value = change.value;

            const commentId = value.comment_id;
            const message = value.message || "";

            const fromName = value.from?.name || "Unknown";

            console.log("New Comment:", message);

            // 1. Reply comment
            await axios.post(
                `https://graph.facebook.com/v23.0/${commentId}/comments`,
                {
                    message: "Anh/chị xem ib nhé ❤️",
                    access_token: PAGE_TOKEN
                }
            );


            // 2. Gửi Telegram
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

            console.log("Done");
        }

        res.sendStatus(200);

    } catch (err) {

        console.log(
            err.response?.data || err.message
        );

        res.sendStatus(500);
    }
});


// PORT Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});