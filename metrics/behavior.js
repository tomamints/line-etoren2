// metrics/behavior.js
const dayjs = require('dayjs');


/**
* 行動タブ用集計
*/
async function calcAll({ messages, selfName, otherName }) {
 let lastSender = null;


 // カウンタ初期化
 const counters = {
   [selfName]:  { stamp:0, photo:0, video:0, voice:0, file:0, cancel:0, url:0, missedCall:0, greeting:0, thank:0, sorry:0, laugh:0, w:0, exclam:0, question:0, callCount:0 },
   [otherName]: { stamp:0, photo:0, video:0, voice:0, file:0, cancel:0, url:0, missedCall:0, greeting:0, thank:0, sorry:0, laugh:0, w:0, exclam:0, question:0, callCount:0 }
 };


 // 各人ごとの返信間隔配列（生データ）
 const replyDiffs = {
   [selfName]:  [],
   [otherName]: []
 };


 // 送信者ごとの短文・長文・追いライン件数
 const shortCounts   = { [selfName]: 0, [otherName]: 0 };
 const longCounts    = { [selfName]: 0, [otherName]: 0 };
 const pursuitCounts = { [selfName]: 0, [otherName]: 0 };


 let prevTimestamp = null;


 for (const msg of messages) {
   const who = msg.sender === selfName ? selfName : otherName;
   const now = dayjs(msg.datetime, 'YYYY/MM/DD HH:mm');


   // ── 返信間隔：発言者が変わったら記録
   if (prevTimestamp && lastSender && lastSender !== who) {
     const diff = now.diff(prevTimestamp, 'minute');
     replyDiffs[who].push(diff);
   }


   // 追いライン判定：同一送信者が30分以上空いて再送信
   if (lastSender === who) {
     const pause = now.diff(prevTimestamp, 'minute');
     if (pause >= 30) {
       pursuitCounts[who]++;
     }
   }


   // 短文・長文カウント
   if (msg.type === 'text') {
     const len = msg.body.length;
     if (len <= 7) {
       shortCounts[who]++;
     }
     if (len >= 100) {
       longCounts[who]++;
     }
   }


   // その他メッセージタイプカウント
   switch (msg.type) {
     case 'sticker':    counters[who].stamp++;      break;
     case 'image':      counters[who].photo++;      break;
     case 'video':      counters[who].video++;      break;
     case 'voice':      counters[who].voice++;      break;
     case 'file':       counters[who].file++;       break;
     case 'missedCall': counters[who].missedCall++; break;
     case 'call':       counters[who].callCount++;  break;
     case 'text':
       if (msg.body.includes('[送信取消]'))    counters[who].cancel++;
       if (/https?:\/\//.test(msg.body))     counters[who].url++;
       if (/笑/.test(msg.body))               counters[who].laugh++;
       if (/[wｗ]{2,}/.test(msg.body))        counters[who].w++;
       if (/[!！]/.test(msg.body))             counters[who].exclam++;
       if (/[?？]/.test(msg.body))             counters[who].question++;
       if (/(おはよ|こんにちは|こんばんは|おやすみ)/.test(msg.body)) counters[who].greeting++;
       if (/(ありがとう|感謝)/.test(msg.body)) counters[who].thank++;
       if (/(ごめん|すみません)/.test(msg.body)) counters[who].sorry++;
       break;
   }


   prevTimestamp = now;
   lastSender = who;
 }


 // ── 外れ値をはじいて統計を算出（MAX 7日＝10080分）
 const MAX_MINUTES = 7 * 24 * 60;
 const replyStats = {};


 for (const who of [selfName, otherName]) {
   const raw = replyDiffs[who] || [];
   const arr = raw.filter(d => d <= MAX_MINUTES);


   if (arr.length === 0) {
     replyStats[who] = { avg: null, fastest: null, slowest: null };
   } else {
     replyStats[who] = {
       avg:     Math.round(arr.reduce((sum, d) => sum + d, 0) / arr.length),
       fastest: Math.min(...arr),
       slowest: Math.max(...arr)
     };
   }
 }


 return {
   counters,
   // 全体件数が必要なら以下も出せます
   // shortCount: shortCounts[selfName] + shortCounts[otherName],
   // longCount:  longCounts[selfName]  + longCounts[otherName],
   // pursuitCount: pursuitCounts[selfName] + pursuitCounts[otherName],


   // 送信者ごとの件数
   shortCounts,
   longCounts,
   pursuitCounts,


   // LINE頻度の統計情報
   replyStats,
   // 生データ
   replyDiffs
 };
}


module.exports = { calcAll };


