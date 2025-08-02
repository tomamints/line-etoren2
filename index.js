// index.js

require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { Client, middleware } = require('@line/bot-sdk');
const parser        = require('./metrics/parser');
const compatibility = require('./metrics/compatibility');
const habits        = require('./metrics/habits');
const behavior      = require('./metrics/behavior');
const records       = require('./metrics/records');
const { buildCompatibilityCarousel } = require('./metrics/formatterFlexCarousel');
const { calcZodiacTypeScores } = require('./metrics/zodiac');

// ── ① コメントデータ読み込み
const commentsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'comments.json'), 'utf8')
);

// ── ② スコア帯取得ヘルパー
function getScoreBand(score) {
  if (score >= 95) return '95';
  if (score >= 90) return '90';
  if (score >= 85) return '85';
  if (score >= 80) return '80';
  if (score >= 70) return '70';
  if (score >= 60) return '60';
  if (score >= 50) return '50';
  return '49';
}

// ── ③ コメント取得ヘルパー
function getShutaComment(category, scoreOrKey) {
  const band = typeof scoreOrKey === 'number'
    ? getScoreBand(scoreOrKey)
    : scoreOrKey;
  return commentsData[category]?.[band] || '';
}

// ── ④ LINEクライアント初期化
const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

console.log("✅ SECRET:", !!process.env.CHANNEL_SECRET);
console.log("✅ TOKEN:", !!process.env.CHANNEL_ACCESS_TOKEN);

const app    = express();
const client = new Client(config);
app.use('/images', express.static(path.join(__dirname, 'images')));

// ── ⑤ 重複防止
const recentMessageIds = new Set();

// ── ⑥ Webhook
app.post('/webhook', middleware(config), async (req, res) => {
  // 🟡🔽 ここにログ追加じゃ
  console.log("🧪 typeof body:", typeof req.body);
  console.log("🧪 body keys:", Object.keys(req.body || {}));
  console.log("🧪 full body:", JSON.stringify(req.body, null, 2));

  // LINEに即座に200を返す
  res.status(200).json({});

  // イベント処理は非同期で実行（Vercel対応版）
  try {
    const promises = req.body.events.map(event => {
      if (event.type === 'message' && event.message.type === 'file') {
        return handleEvent(event).catch(err => {
          console.error('=== 分析中にエラー ===', err);
          return client.pushMessage(event.source.userId, {
            type: 'text',
            text: '⚠️ 分析中にエラーが発生しました。少々お待ちください🙏'
          }).catch(pushErr => console.error('Push message error:', pushErr));
        });
      }
      return Promise.resolve();
    });
    
    // すべてのイベント処理を並行実行
    await Promise.all(promises);
  } catch (fatal) {
    console.error('🌋 Webhook 処理で致命的なエラー', fatal);
  }
});


// ── ⑦ イベント処理本体
async function handleEvent(event) {
  console.log('📌 handleEvent開始:', new Date().toISOString());
  if (event.type !== 'message' || event.message.type !== 'file') return;

  const userId = event.source.userId;
  
  // タイムアウト設定（8秒）
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('処理がタイムアウトしました')), 8000)
  );
  
  try {
    await Promise.race([
      processFile(event, userId),
      timeout
    ]);
  } catch (error) {
    console.error('エラー:', error.message);
    throw error;
  }
}

async function processFile(event, userId) {
  console.log('📌 ファイルダウンロード開始:', new Date().toISOString());
  const stream = await client.getMessageContent(event.message.id);
  const chunks = [];
  let chunkCount = 0;
  for await (const c of stream) {
    chunks.push(c);
    chunkCount++;
    if (chunkCount % 100 === 0) {
      console.log(`📌 チャンク読み込み中: ${chunkCount}`);
    }
  }
  console.log('📌 ファイルダウンロード完了:', new Date().toISOString(), 'チャンク数:', chunkCount);
  const rawText = Buffer.concat(chunks).toString('utf8');

  console.log('📌 パース開始:', new Date().toISOString());
  const messages  = parser.parseTLText(rawText);
  console.log('📌 メッセージ数:', messages.length);
  
  console.log('📌 プロフィール取得開始:', new Date().toISOString());
  const profile   = await client.getProfile(userId);
  const { self, other } = parser.extractParticipants(messages, profile.displayName);
  const selfName  = self;
  const otherName = other;

  console.log('📌 各種分析開始:', new Date().toISOString());
  const recordsData  = records.calcAll({ messages, selfName, otherName });
  console.log('📌 records完了:', new Date().toISOString());
  
  const compData     = compatibility.calcAll({ messages, selfName, otherName, recordsData });
  console.log('📌 compatibility完了:', new Date().toISOString());
  
  const habitsData   = habits.calcAll({ messages, selfName, otherName });
  console.log('📌 habits完了:', new Date().toISOString());
  
  const behaviorData = await behavior.calcAll({ messages, selfName, otherName });
  console.log('📌 behavior完了:', new Date().toISOString());

  const { animalType, scores: zodiacScores } = calcZodiacTypeScores({
    messages,
    selfName,
    otherName,
    recordsData
  });
  const animalTypeData = commentsData.animalTypes?.[animalType] || {};
  console.log('干支診断 scores: ', zodiacScores);

  const radar = compData.radarScores;
  const lowestCategory = Object.entries(radar).sort((a, b) => a[1] - b[1])[0][0];
  const commentOverall = getShutaComment('overall', compData.overall).replace(/（相手）/g, otherName);
  const comment7p      = getShutaComment('7p', lowestCategory).replace(/（相手）/g, otherName);


  const carousel = buildCompatibilityCarousel({
    selfName,
    otherName,
    radarScores: compData.radarScores,
    overall:     compData.overall,
    habitsData,
    behaviorData,
    recordsData,
    comments: {
      overall: commentOverall,
      time:    commentsData.time,
      balance: commentsData.balance,
      tempo:   commentsData.tempo,
      type:    commentsData.type,
      words:   commentsData.words,
      '7p':    comment7p,
      animalTypes: commentsData.animalTypes,
    },
    animalType,
    animalTypeData,
    zodiacScores,
    promotionalImageUrl: `${process.env.BASE_URL}/images/promotion.png`,
    promotionalLinkUrl:  'https://note.com/enkyorikun/n/n38aad7b8a548'
  });

  // --- ✅ Flexバイトサイズ確認 ---
  if (carousel?.contents?.type === 'carousel' && Array.isArray(carousel.contents.contents)) {
    carousel.contents.contents.forEach((bubble, index) => {
      const msg = {
        type: 'flex',
        altText: `ページ${index + 1}`,
        contents: bubble
      };
      const size = Buffer.byteLength(JSON.stringify(msg), 'utf8');
      console.log(`📦 ページ${index + 1} のサイズ: ${size} bytes`);
    });

    const totalSize = Buffer.byteLength(JSON.stringify(carousel), 'utf8');
    console.log(`📦 全体（carousel）サイズ: ${totalSize} bytes`);
    if (totalSize > 25000) {
      console.warn(`⚠️ Flex Message が 25KB を超えています！`);
    }
  }

  console.log('📌 メッセージ送信開始:', new Date().toISOString());
  await client.pushMessage(userId, carousel);
  console.log('📌 handleEvent完了:', new Date().toISOString());
}

// ── ⑧ 起動
// Vercel環境では自動的にサーバーが起動されるため、明示的なlistenは不要
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`⚡️ サーバー起動: http://localhost:${port}`);
  });
}

module.exports = app;