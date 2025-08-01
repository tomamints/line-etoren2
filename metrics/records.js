const dayjs = require('dayjs');


function calcAll({ messages, selfName, otherName }) {
 const relevant = messages.filter(m =>
   ['text', 'sticker', 'image', 'video', 'voice', 'file', 'call', 'missedCall'].includes(m.type)
 );


 const firstDate = relevant.length
   ? dayjs(relevant[0].datetime, 'YYYY/MM/DD HH:mm')
   : dayjs();
 const lastDate = relevant.length
   ? dayjs(relevant[relevant.length - 1].datetime, 'YYYY/MM/DD HH:mm')
   : dayjs();


 const analyzedDate = dayjs().format('YYYY/MM/DD');
 const daysSinceStart = dayjs(analyzedDate, 'YYYY/MM/DD').diff(firstDate, 'day');


 // ポジ／ネガワード
 const loveKeys = ['ありがとう', '好き', '愛してる', 'ずっと一緒', '大好き'];
 const negKeys = ['ごめん', '別れよう', '嫌い', '寂しい', '辛い', '別れ'];


 // ワードごとにカウント
 function countWordsInMessages(keys, whoName) {
   const result = {};
   for (const key of keys) result[key] = 0;
   for (const m of relevant) {
     if (m.type !== 'text' || m.sender !== whoName) continue;
     for (const key of keys) {
       // 部分一致で全部カウント
       const pattern = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
       const cnt = (m.body.match(pattern) || []).length;
       result[key] += cnt;
     }
   }
   return result;
 }


 const loveSelf  = countWordsInMessages(loveKeys, selfName);
 const loveOther = countWordsInMessages(loveKeys, otherName);
 const negSelf   = countWordsInMessages(negKeys, selfName);
 const negOther  = countWordsInMessages(negKeys, otherName);


 // Flex用に整形
 const loveWordList = {};
 for (const key of loveKeys) {
   loveWordList[key] = { [selfName]: loveSelf[key], [otherName]: loveOther[key] };
 }
 const negativeWordList = {};
 for (const key of negKeys) {
   negativeWordList[key] = { [selfName]: negSelf[key], [otherName]: negOther[key] };
 }


 // 合計
 const loveWordCount = {
   [selfName]: Object.values(loveSelf).reduce((a, b) => a + b, 0),
   [otherName]: Object.values(loveOther).reduce((a, b) => a + b, 0)
 };
 const negativeWordCount = {
   [selfName]: Object.values(negSelf).reduce((a, b) => a + b, 0),
   [otherName]: Object.values(negOther).reduce((a, b) => a + b, 0)
 };


 // メッセージ数・文字数
 const talkCount = { [selfName]: 0, [otherName]: 0 };
 const totalChars = { [selfName]: 0, [otherName]: 0 };
 for (const m of relevant) {
   const who = m.sender === selfName ? selfName : otherName;
   talkCount[who]++;
   if (m.type === 'text') totalChars[who] += m.body.length;
 }


 // ---- 共通ワード（オマケ。必要なければ消してOK） ----
 const phraseMap = { [selfName]: new Map(), [otherName]: new Map() };
 for (const m of relevant) {
   const who = m.sender === selfName ? selfName : otherName;
   if (m.type === 'text') {
     m.body
     .replace(/[。、！？「」『』]/g, ' ')
     .split(/\s+/)
     .filter(t => t.length >= 3)
     .forEach(tok => {
          const cleanTok = tok.replace(/^[\s"'「『（【\[\]＜＜《]+|[\s"'」』）】\]\＞＞》]+$/g, '');
          if (cleanTok.length >= 3) {
           phraseMap[who].set(cleanTok, (phraseMap[who].get(cleanTok) || 0) + 1);
 }
});


   }
 }
 const selfSet = new Set(phraseMap[selfName].keys());
 const otherSet = new Set(phraseMap[otherName].keys());
 const commonWordsArr = Array.from(selfSet).filter(w => otherSet.has(w));
 let commonWordsObj = {};
 for (const w of commonWordsArr) {
   commonWordsObj[w] = {
     [selfName]: phraseMap[selfName].get(w) || 0,
     [otherName]: phraseMap[otherName].get(w) || 0
   };
 }
 // ---- ここまで ----


 return {
   firstTalkDate: firstDate.format('YYYY/MM/DD'),
   lastTalkDate: lastDate.format('YYYY/MM/DD'),
   daysSinceStart,
   summary: {
     talkCount,
     totalChars,
     loveWordCount,
     negativeWordCount,
     loveWordList,
     negativeWordList,
     commonWords: commonWordsObj // 不要なら省略OK
   }
 };
}


module.exports = { calcAll };
