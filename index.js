require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const PAGE_TOKEN = process.env.PAGE_TOKEN;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

const CHAT_ID = process.env.CHAT_ID;


// VERIFY WEBHOOK
app.get("/webhook", (req, res) => {

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
        console.log("Webhook verified");
        return res.status(200).send(challenge);
    }

    res.sendStatus(403);
});


// RECEIVE EVENTS
app.post("/webhook", async (req, res) => {

    try {

        const entry = req.body.entry?.[0];
        const change = entry?.changes?.[0];

        if (change?.field === "feed") {

            const value = change.value;

            const commentId = value.comment_id;

            const message = value.message || "";

            const fromName = value.from?.name || "Unknown";

            // 1. Reply comment
            await axios.post(
                `https://graph.facebook.com/v23.0/${commentId}/comments`,
                {
                    message: "Anh/chị xem ib nhé ❤️",
                    access_token: PAGE_TOKEN
                }
            );

            // 2. Send Telegram
            await axios.post(
                `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
                {
                    chat_id: CHAT_ID,
                    text:
`📢 Có khách comment

👤 ${fromName}

💬 ${message}`
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

app.listen(3000, () => {
    console.log("Bot running at 3000");
});