const express = require('express');
const { Client } = require('@line/bot-sdk');
const parser = require('../metrics/parser');
const compatibility = require('../metrics/compatibility');
const habits = require('../metrics/habits');
const behavior = require('../metrics/behavior');
const records = require('../metrics/records');
const { buildCompatibilityCarousel } = require('../metrics/formatterFlexCarousel');
const { calcZodiacTypeScores } = require('../metrics/zodiac');
const commentsData = require('../comments.json');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/api/webhook', async (req, res) => {
  const events = req.body.events || [];

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'file') {
      try {
        const client = new Client({ channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN });

        const stream = await client.getMessageContent(event.message.id);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        const rawText = buffer.toString('utf-8');

        const messages = parser.parseTLText(rawText);
        const profile = await client.getProfile(event.source.userId);
        const { self, other } = parser.extractParticipants(messages, profile.displayName);

        const recordsData = records.calcAll({ messages, selfName: self, otherName: other });
        const compData = compatibility.calcAll({ messages, selfName: self, otherName: other, recordsData });
        const habitsData = habits.calcAll({ messages, selfName: self, otherName: other });
        const behaviorData = await behavior.calcAll({ messages, selfName: self, otherName: other });

        const { animalType, scores: zodiacScores } = calcZodiacTypeScores({
          messages,
          selfName: self,
          otherName: other,
          recordsData
        });

        const commentOverall = getShutaComment('overall', compData.overall, commentsData, other);
        const radar = compData.radarScores;
        const lowestCategory = Object.entries(radar).sort((a, b) => a[1] - b[1])[0][0];
        const comment7p = getShutaComment('7p', lowestCategory, commentsData, other);

        const carousel = buildCompatibilityCarousel({
          selfName: self,
          otherName: other,
          radarScores: compData.radarScores,
          overall: compData.overall,
          habitsData,
          behaviorData,
          recordsData,
          comments: {
            overall: commentOverall,
            time: commentsData.time,
            balance: commentsData.balance,
            tempo: commentsData.tempo,
            type: commentsData.type,
            words: commentsData.words,
            '7p': comment7p,
            animalTypes: commentsData.animalTypes,
          },
          animalType,
          animalTypeData: commentsData.animalTypes?.[animalType] || {},
          zodiacScores,
          promotionalImageUrl: `${process.env.BASE_URL}/images/promotion.png`,
          promotionalLinkUrl: 'https://note.com/enkyorikun/n/n38aad7b8a548'
        });

        await client.pushMessage(event.source.userId, carousel);
      } catch (err) {
        console.error('Error in webhook:', err);
      }
    }
  }

  res.status(200).send('OK');
});

function getShutaComment(category, scoreOrKey, commentsData, otherName) {
  const band = typeof scoreOrKey === 'number'
    ? (scoreOrKey >= 95 ? '95' :
       scoreOrKey >= 90 ? '90' :
       scoreOrKey >= 85 ? '85' :
       scoreOrKey >= 80 ? '80' :
       scoreOrKey >= 70 ? '70' :
       scoreOrKey >= 60 ? '60' :
       scoreOrKey >= 50 ? '50' : '49')
    : scoreOrKey;
  const txt = commentsData[category]?.[band] || '';
  return txt.replace(/（相手）/g, otherName);
}

module.exports = app;
