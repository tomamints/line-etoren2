// metrics/parser.js
const fs = require('fs');


/**
* parseTLText(text)
* - LINE のテキストログをパースして
*   { datetime, sender, type, body, [durationSec] } の配列を返す
*/
function parseTLText(text) {
 const lines = text.split(/\r?\n/).filter(line => line.trim());
 let currentDateStr = null;
 const parsed = [];


 for (const rawLine of lines) {
   const line = rawLine.trim();


   // ─ 日付ヘッダー行（例: 2025/06/08(水)）
   const dateMatch = line.match(/^(\d{4}\/\d{2}\/\d{2})/);
   if (dateMatch && line.includes('(')) {
     currentDateStr = dateMatch[1];
     continue;
   }


   // ─ メッセージ行を分割
   let parts = line.split('\t');
   if (parts.length < 3) parts = line.split(/\s{2,}/);
   if (parts.length < 3 || !currentDateStr) continue;


   const timePart = parts[0].trim();
   const sender   = parts[1].trim();
   const body     = parts.slice(2).join('\t').trim();


   // ─ type & 通話時間を判定
   let type = 'text';
   let durationSec = null;


   if (body === '[スタンプ]') {
     type = 'sticker';
   } else if (body === '[写真]') {
     type = 'image';
   } else if (body === '[動画]') {
     type = 'video';
   } else if (body === '[ボイスメッセージ]') {
     type = 'voice';
   } else if (body === '[ファイル]') {
     type = 'file';
   } else if (/☎ 不在着信/.test(body)) {
     type = 'missedCall';
   } else {
     const m = body.match(/☎ 通話時間\s*(\d+):(\d+)/);
     if (m) {
       type = 'call';
       durationSec = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
     }
   }


   const record = {
     datetime: `${currentDateStr} ${timePart}`,
     sender,
     type,
     body
   };
   if (durationSec != null) record.durationSec = durationSec;


   parsed.push(record);
 }


 return parsed;
}


/**
* parseTLFileSync(filepath)
*/
function parseTLFileSync(filepath) {
 const text = fs.readFileSync(filepath, 'utf8');
 return parseTLText(text);
}


/**
* extractParticipants(messages, myName)
*/
function extractParticipants(messages, myName) {
 const uniqueNames = Array.from(new Set(messages.map(m => m.sender))).filter(n => n);
 if (uniqueNames.length === 0) {
   return { self: '自分', other: '相手' };
 }
 let self = uniqueNames.find(n => myName && n.includes(myName)) || uniqueNames[0];
 let other = uniqueNames.find(n => n !== self) || self;
 return { self, other };
}


module.exports = {
 parseTLText,
 parseTLFileSync,
 extractParticipants
};


