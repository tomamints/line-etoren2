// ── metrics/habits.js ──
const dayjs = require('dayjs');


// 1日を 6つの時間帯に分割するためのヘルパー
const TIME_BINS = [
 { label: '0-3',   start:   0, end:   3 },
 { label: '3-6',   start:   3, end:   6 },
 { label: '6-11',  start:   6, end:  11 },
 { label: '11-15', start:  11, end:  15 },
 { label: '15-18', start:  15, end:  18 },
 { label: '18-24', start:  18, end:  24 }
];


// 日本語の曜日ラベル
const WEEK_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];


/**
* calcAll({ messages, selfName, otherName })
* - 「曜日別」「時間帯別」「よく使うフレーズ」を返す
*/
function calcAll({ messages, selfName, otherName }) {
 // 曜日と時間帯の初期化
 const dayOfWeek = {
   [selfName]:   initDayOfWeekCounts(),
   [otherName]:  initDayOfWeekCounts(),
   mostActiveDay: ''
 };
 const timeOfDay = {
   [selfName]:   initTimeBinCounts(),
   [otherName]:  initTimeBinCounts(),
   mostActiveSlot: ''
 };


 // フレーズ集計用 Map
 const phraseCounts = {
   [selfName]:  new Map(),
   [otherName]: new Map()
 };


 for (const msg of messages) {
   const who = msg.sender === selfName ? selfName : otherName;
   const dt = dayjs(msg.datetime, 'YYYY/MM/DD HH:mm');
   if (!dt.isValid()) continue;


   // 曜日
   const dow = WEEK_LABELS[dt.day()];
   dayOfWeek[who][dow]++;


   // 時間帯
   const hour = dt.hour();
   for (const bin of TIME_BINS) {
     if (hour >= bin.start && hour < bin.end) {
       timeOfDay[who][bin.label]++;
       break;
     }
   }


   // フレーズ（テキストのみ）
   if (msg.type === 'text') {
     msg.body
       .replace(/[。、！？「」『』]/g, ' ')
       .split(/\s+/).filter(t => t)
       .forEach(tok => {
         const m = phraseCounts[who];
         m.set(tok, (m.get(tok) || 0) + 1);
       });
   }
 }


 // 最も活発な曜日／時間帯
 dayOfWeek.mostActiveDay   = findMostFrequentKey(dayOfWeek[selfName],   dayOfWeek[otherName]);
 timeOfDay.mostActiveSlot  = findMostFrequentKey(timeOfDay[selfName],  timeOfDay[otherName]);


 // 上位10フレーズと共通フレーズ抽出
 const topSelf  = getTopNFromMap(phraseCounts[selfName],  10);
 const topOther = getTopNFromMap(phraseCounts[otherName], 10);
 const common   = extractCommonPhrases(phraseCounts[selfName], phraseCounts[otherName]);


 return {
   dayOfWeek: {
     [selfName]: dayOfWeek[selfName],
     [otherName]: dayOfWeek[otherName],
     mostActiveDay: dayOfWeek.mostActiveDay
   },
   timeOfDay: {
     [selfName]: timeOfDay[selfName],
     [otherName]: timeOfDay[otherName],
     mostActiveSlot: timeOfDay.mostActiveSlot
   },
   topPhrases: {
     [selfName]: topSelf,
     [otherName]: topOther,
     common
   }
 };
}


// ── ヘルパー ──
function initDayOfWeekCounts() {
 return { Sun:0, Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0 };
}
function initTimeBinCounts() {
 const o = {};
 TIME_BINS.forEach(b => o[b.label] = 0);
 return o;
}
function findMostFrequentKey(a, b) {
 const sums = {};
 Object.keys(a).forEach(k => sums[k] = (a[k]||0)+(b[k]||0));
 return Object.keys(sums).reduce((best,k)=> sums[k]>sums[best]?k:best);
}
function getTopNFromMap(m, N) {
 return Array.from(m.entries())
   .map(([phrase,count])=>({phrase,count}))
   .sort((x,y)=>y.count-x.count)
   .slice(0,N);
}
function extractCommonPhrases(ms, mo) {
 const arr = [];
 for (const [p,c] of ms.entries()) {
   if (mo.has(p)) arr.push({ phrase:p, countSelf:c, countOther:mo.get(p) });
 }
 return arr.sort((x,y)=> (y.countSelf+y.countOther)-(x.countSelf+x.countOther)).slice(0,10);
}


module.exports = { calcAll, TIME_BINS };




