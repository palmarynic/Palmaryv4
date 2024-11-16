const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = process.env.OPENAI_API_URL;

// 處理來自 LINE 的 Webhook
app.post('/api/webhook', async (req, res) => {
    const events = req.body.events;
    if (!events || events.length === 0) {
        return res.status(200).send('No events received');
    }

    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const userMessage = event.message.text;

            // 呼叫 OpenAI Assistant
            const openAIResponse = await axios.post(
                OPENAI_API_URL,
                {
                    messages: [{ role: 'user', content: userMessage }],
                },
                {
                    headers: {
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const assistantResponse = openAIResponse.data.choices[0].message.content;

            // 回傳訊息給 LINE 使用者
            await axios.post(
                'https://api.line.me/v2/bot/message/reply',
                {
                    replyToken: event.replyToken,
                    messages: [{ type: 'text', text: assistantResponse }],
                },
                {
                    headers: {
                        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        }
    }

    res.status(200).send('OK');
});

// 啟動伺服器（僅開發時使用，Vercel 無需這行）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
