// api/webhook.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { Client, middleware } = require('@line/bot-sdk');
const parser        = require('../metrics/parser');
const compatibility = require('../metrics/compatibility');
const habits        = require('../metrics/habits');
const behavior      = require('../metrics/behavior');
const records       = require('../metrics/records');
const { buildCompatibilityCarousel } = require('../metrics/formatterFlexCarousel');
const { calcZodiacTypeScores } = require('../metrics/zodiac');

const commentsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../comments.json'), 'utf8')
);

console.log("🔧 環境変数チェック:");
console.log("  - CHANNEL_ACCESS_TOKEN:", process.env.CHANNEL_ACCESS_TOKEN ? "設定済み" : "未設定");
console.log("  - CHANNEL_SECRET:", process.env.CHANNEL_SECRET ? "設定済み" : "未設定");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

console.log("🔧 LINE Client 初期化中...");
const client = new Client(config);
console.log("🔧 LINE Client 初期化完了");

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

function getShutaComment(category, scoreOrKey) {
  const band = typeof scoreOrKey === 'number'
    ? getScoreBand(scoreOrKey)
    : scoreOrKey;
  return commentsData[category]?.[band] || '';
}

// VercelではsetIntervalは使えないため、重複チェックは簡易的に実装
const recentMessageIds = new Set();

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  console.log("🧪 Webhook received:", JSON.stringify(req.body, null, 2));
  
  try {
    // すぐに処理中メッセージを送信
    for (const event of req.body.events) {
      if (event.type === 'message' && event.message.type === 'file') {
        // 処理中メッセージを即座に送信
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: '📝 トーク履歴を分析中です...\nしばらくお待ちください（1-2分程度）'
        }).catch(err => {
          console.error('処理中メッセージ送信エラー:', err);
        });
        
        // 処理を開始（別のAPI呼び出しやバックグラウンドジョブとして）
        processFileInBackground(event);
      }
    }
    
    // 200を返す
    res.status(200).json({});
    console.log("✅ 200レスポンスを送信済み");
    
  } catch (error) {
    console.error('🌋 致命的なエラー:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

// バックグラウンドで処理（Vercel Functionsでは制限あり）
async function processFileInBackground(event) {
  try {
    // 少し待機してから処理開始
    await new Promise(resolve => setTimeout(resolve, 1000));
    await handleEvent(event);
  } catch (err) {
    console.error('バックグラウンド処理エラー:', err);
    try {
      await client.pushMessage(event.source.userId, {
        type: 'text',
        text: '⚠️ 分析中にエラーが発生しました。もう一度お試しください。'
      });
    } catch (pushErr) {
      console.error('エラーメッセージ送信失敗:', pushErr);
    }
  }
}

// Webhookイベントを処理
async function processWebhookEvents(events) {
  console.log("🚀 processWebhookEvents 開始");
  
  for (const event of events) {
    try {
      if (event.type === 'message' && event.message.type === 'file') {
        if (recentMessageIds.has(event.message.id)) {
          console.log("⏭️ 重複メッセージをスキップ:", event.message.id);
          continue;
        }
        recentMessageIds.add(event.message.id);
        
        // サイズ制限（1000件まで保持）
        if (recentMessageIds.size > 1000) {
          const firstKey = recentMessageIds.values().next().value;
          recentMessageIds.delete(firstKey);
        }
        
        console.log("📋 イベント処理開始:", event.message.id);
        await handleEvent(event);
        console.log("✅ イベント処理完了:", event.message.id);
      }
    } catch (err) {
      console.error('❌ イベント処理エラー:', err);
      try {
        await client.pushMessage(event.source.userId, {
          type: 'text',
          text: '⚠️ 分析中にエラーが発生しました。少々お待ちください🙏'
        });
      } catch (pushErr) {
        console.error('❌ エラーメッセージ送信失敗:', pushErr);
      }
    }
  }
  
  console.log("🏁 processWebhookEvents 完了");
}

async function handleEvent(event) {
  console.log("📥 handleEvent start!");
  console.log("📎 fileName:", event.message?.fileName);

  if (event.type !== 'message' || event.message.type !== 'file') return;

  const userId = event.source.userId;

  // === ⭐️ ここにログ追加 ===
  console.log("📥 getMessageContent 開始");

  // ファイル読み込み
  let rawText = '';
  try {
    console.log("📥 client.getMessageContent を呼び出し中...");
    console.log("  - message.id:", event.message.id);
    console.log("  - client:", !!client);
    console.log("  - client.getMessageContent:", typeof client.getMessageContent);
    
    // タイムアウト付きで実行（5秒）
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getMessageContent timeout (5s)')), 5000)
    );
    
    console.log("📡 getMessageContent 呼び出し前");
    
    const stream = await Promise.race([
      client.getMessageContent(event.message.id).catch(err => {
        console.error("❌ getMessageContent エラー詳細:", err);
        throw err;
      }),
      timeoutPromise
    ]);
    
    console.log("📡 getMessageContent 成功");

    // === ⭐️ stream取得ログ ===
    console.log("📥 stream を取得");

    const chunks = [];
    for await (const c of stream) chunks.push(c);

    // === ⭐️ stream読み込み完了ログ ===
    console.log("📥 stream 読み込み完了");

    rawText = Buffer.concat(chunks).toString('utf8');
    console.log("📃 rawText length:", rawText.length);
    console.log("📃 rawText preview:", rawText.slice(0, 100));
  } catch (err) {
    console.error("📛 getMessageContent error:", err);
    await client.pushMessage(userId, {
      type: 'text',
      text: '⚠️ ファイルの読み込み中にエラーが発生しました'
    });
    return;
  }

  let messages;
  try {
    messages = parser.parseTLText(rawText);
    console.log("📝 メッセージ数:", messages.length);
  } catch (err) {
    console.error("📛 parseTLText error:", err);
    await client.pushMessage(userId, {
      type: 'text',
      text: '⚠️ トーク履歴の解析に失敗しました'
    });
    return;
  }

  const profile = await client.getProfile(userId);
  const { self, other } = parser.extractParticipants(messages, profile.displayName);
  const selfName  = self;
  const otherName = other;

  const recordsData  = records.calcAll({ messages, selfName, otherName });
  const compData     = compatibility.calcAll({ messages, selfName, otherName, recordsData });
  const habitsData   = habits.calcAll({ messages, selfName, otherName });
  const behaviorData = await behavior.calcAll({ messages, selfName, otherName });

  const { animalType, scores: zodiacScores } = calcZodiacTypeScores({
    messages,
    selfName,
    otherName,
    recordsData
  });
  const animalTypeData = commentsData.animalTypes?.[animalType] || {};
  console.log('🐯 干支診断 scores:', zodiacScores);

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

  try {
    console.log("📮 pushMessage 開始");
    await client.pushMessage(userId, carousel);
    console.log("✅ pushMessage 完了");
  } catch (err) {
    console.error("📛 pushMessage error:", err);
    await client.pushMessage(userId, {
      type: 'text',
      text: '⚠️ 結果の送信に失敗しました'
    });
  }
}