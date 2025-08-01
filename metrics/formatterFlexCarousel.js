/**
* metrics/formatterFlexCarousel.js
* buildCompatibilityCarousel: Carousel Flex Message with detailed pages
*/

const fs = require('fs');
const path = require('path');

const commentsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../comments.json'), 'utf8')
);


function getScoreBand(score) {
if (score >= 95)   return '95';
if (score >= 90)   return '90';
if (score >= 85)   return '85';
if (score >= 80)   return '80';
if (score >= 70)   return '70';
if (score >= 60)   return '60';
if (score >= 50)   return '50';
return '49';
}




function formatMinutes(min) {
if (min == null || isNaN(min)) return '—';




// 分数から日・時間・分を計算
const totalMinutes = min;
const days = Math.floor(totalMinutes / 1440);        // 1日 = 1440分
const hours = Math.floor((totalMinutes % 1440) / 60);
const minutes = totalMinutes % 60;




if (days > 0) {
  // 例: 20日 / 20日6時間 / 20日6時間30分
  let s = `${days}日`;
  if (hours > 0) s += `${hours}時間`;
  // （分は細かすぎるかもなので、省略してもOK）
  return s;
}
if (hours > 0) {
  // 例: 3時間 / 3時間20分
  return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
}
// 1時間未満は分表示
return `${minutes}分`;
}




function buildCompatibilityCarousel({
selfName,
otherName,
radarScores,
overall,
habitsData,
behaviorData,
recordsData,
comments,
animalType,      
animalTypeData,
zodiacScores
}) {
console.log('干支診断 scores: ', zodiacScores);
 // ラベルマップ：tempo を "LINE頻度" に変更
const labelMap = { time: '時間帯', balance: 'バランス', tempo: 'LINE頻度', type: 'タイプ', words: '言葉' };
const getEmoji = score => (score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴');
const getColor = score => (score >= 80 ? '#4CAF50' : score >= 50 ? '#FF8F00' : '#F44336');
// 日本語曜日マッピングとキー配列
const jpWeekMap = {
  Sun: '日', Mon: '月', Tue: '火',
  Wed: '水', Thu: '木', Fri: '金', Sat: '土'
};
const weekdayLabelKeys = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
// --- 会話した曜日と時間帯の中央値との差 ---
// ①一番活発な曜日
const recDayKey = habitsData.dayOfWeek.mostActiveDay;
const recDayLabel = jpWeekMap[recDayKey] || '—';
// ②一番活発な時間帯スロット
const timeBinLabelMap = {
  '0-3': '深夜',  '3-6': '早朝',
  '6-11': '朝',  '11-15': '昼',
  '15-18': '夕方','18-24': '夜'
};
const recTimeKey = habitsData.timeOfDay.mostActiveSlot;
const recTimeLabel = timeBinLabelMap[recTimeKey] || '—';








// --- ページ1: 総合レポート ---
const page1 = {
type: 'bubble',
size: 'mega',
hero: {
  type: 'image',
  url: 'https://syuta-sns.github.io/line-bot-assets/%E3%83%98%E3%83%83%E3%82%BF%E3%82%99%E3%83%BC1.png', // ←ここパスは合うように調整
  size: 'full',
  aspectMode: 'cover',
  aspectRatio: '13:3' // 画像比率に合わせて調整
},
body: {
  type: 'box',
  layout: 'vertical',
  spacing: 'lg',
  paddingAll: '16px',
  backgroundColor: '#FAF4F9',
  contents: [
  
    // サブタイトル
    {
      type: 'text',
      text: `あなたと${otherName}さんの相性は…`,
      size: 'md',
      color: '#333333',
      align: 'center',
      margin: 'sm'
    },
    { type: 'separator', margin: 'md', color: '#FFC1D4' },
// スコアを一番上に
    {
      type: 'box',
      layout: 'horizontal',
      contents: [
        { type: 'text',
          text: `${getEmoji(overall)} ${overall}点`,
          size: 'xxl',
          weight: 'bold',
          color: '#D63384',
          align: 'center',
          flex: 1 }
      ],
      justifyContent: 'center',
      margin: 'md'
    },




    // 各スコア表示
    ...Object.entries(radarScores).map(([key, score]) => ({
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: labelMap[key], flex: 3, size: 'md', weight: 'bold', color: '#333333' },
        { type: 'text', text: `${getEmoji(score)} ${score}点`, flex: 4, size: 'md', weight: 'bold', align: 'end', color: getColor(score) }
      ]
    })),
    // 日付・経過日数
    { type: 'separator', margin: 'md' },
    { type: 'text', text: `はじめ：${recordsData.firstTalkDate}`, size: 'xs', color: '#888888', align: 'center', margin: 'sm' },
    { type: 'text', text: `さいご：${recordsData.lastTalkDate}`, size: 'xs', color: '#888888', align: 'center', margin: 'xs' },
    { type: 'text', text: `${otherName}さんと話し始めて${recordsData.daysSinceStart}日経ちました！`, size: 'xs', color: '#888888', align: 'center', margin: 'xs' }
   




  ]
}
,
 footer: {
 type: 'box',
 layout: 'vertical',
 contents: [
   // 画像を最初に
    {
     type: 'image',
     url: 'https://github.com/syuta-sns/line-bot-assets/raw/main/%E3%83%8F%E3%82%99%E3%83%8A%E3%83%BC%20(1).png', // GitHub Pagesの画像URL
     size: 'full',
     aspectMode: 'cover',
     aspectRatio: '52:7' // 画像の比率に合わせて調整
     },
   // コメント（背景色つきボックス）
   {
     type: 'box',
     layout: 'vertical',
     backgroundColor: '#FFE7F0', // ← 背景色
     cornerRadius: '8px',
     paddingAll: '12px',
     contents: [
        {
      type: 'text',
      text: comments.overall,
       wrap: true,
       margin: 'md',
       size: 'xs',
       color: '#555555'
      }
     ]
   }
 ],
 spacing: 'none',
 paddingAll: 'none'
}
};








  // --- ページ2: 時間帯＆曜日別 ---
const timeBinDefs = [
  { key: '0-3',    label: '🌙深夜', emoji: '🌙'   },
  { key: '3-6',    label: '🌅早朝', emoji: '🌅'   },
  { key: '6-11',   label: '☀️朝',   emoji: '☀️'  },
  { key: '11-15',  label: '🌞昼',   emoji: '🌞'  },
  { key: '15-18',  label: '🌇夕方', emoji: '🌇'  },
  { key: '18-24',  label: '🌃夜',   emoji: '🌃'  }
];




const page2 = {
type: 'bubble',
size: 'mega',
hero: {
  type: 'image',
  url: 'https://syuta-sns.github.io/line-bot-assets/%E3%83%98%E3%83%83%E3%82%BF%E3%82%99%E3%83%BC2.png', // GitHub Pagesの画像URL
  size: 'full',
  aspectMode: 'cover',
  aspectRatio: '13:3' // 画像の比率に合わせて調整
},
body: {
  type: 'box',
  layout: 'vertical',
  spacing: 'xs',
  paddingAll: '16px',
  backgroundColor: '#F5F8F3',
  contents: [
    // スコア
    {
      type: 'text',
      text: `${getEmoji(radarScores.time)} ${radarScores.time}点`,
      size: 'xxl',
      color: '#73AD6A',
      align: 'center',
      margin: 'md',
      weight: 'bold'
    },
    // ヘッダー行
    {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '　あなた', flex: 3, size: 'sm', weight: 'bold', color: '#333333' },
        { type: 'text', text: '相手',     flex: 3, size: 'sm', weight: 'bold', color: '#333333', align: 'end' }
      ]
    },
    { type: 'separator', margin: 'md' },
    // 各時間帯行
    ...timeBinDefs.map(({ key, label }) => {
      const a = (habitsData.timeOfDay[selfName] || {})[key] || 0;
      const b = (habitsData.timeOfDay[otherName] || {})[key] || 0;
      return {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          { type: 'text', text: `${label} :`, flex: 2, size: 'sm', color: '#333333' },
          { type: 'text', text: `${a}回`, flex: 2, size: 'sm', color: '#333333', align: 'end' },
          { type: 'text', text: '｜', flex: 1, size: 'sm', color: '#333333', align: 'center' },
          { type: 'text', text: `${b}回`, flex: 2, size: 'sm', color: '#333333', align: 'start' }
        ]
      };
    }),
    { type: 'separator', margin: 'md' },
  
  ]
},
 footer: {
 type: 'box',
 layout: 'vertical',
 contents: [
   // 画像を最初に
    {
     type: 'image',
     url: 'https://github.com/syuta-sns/line-bot-assets/raw/main/%E3%83%8F%E3%82%99%E3%83%8A%E3%83%BC%20(2).png', // GitHub Pagesの画像URL
     size: 'full',
     aspectMode: 'cover',
     aspectRatio: '52:7' // 画像の比率に合わせて調整
     },
   // コメント（背景色つきボックス）
   {
     type: 'box',
     layout: 'vertical',
     backgroundColor: '#E5F7E3', // ← 背景色
     cornerRadius: '8px',
     paddingAll: '12px',
     contents: [
        {
      type: 'text',
      text: comments.time[getScoreBand(radarScores.time)],
      wrap: true,
      margin: 'md',
      size: 'xs',
      color: '#555555'
    }
     ]
   }
 ],
 spacing: 'none',
 paddingAll: 'none'
}
};








// --- ページ3: バランス詳細 ---
const page3 = {
type: 'bubble',
size: 'mega',
hero: {
  type: 'image',
  url: 'https://syuta-sns.github.io/line-bot-assets/%E3%83%98%E3%83%83%E3%82%BF%E3%82%99%E3%83%BC4.png',
  size: 'full',
  aspectMode: 'cover',
  aspectRatio: '13:3'
},
body: {
  type: 'box',
  layout: 'vertical',
  spacing: 'sm',
  paddingAll: '16px',
  backgroundColor: '#EFF6FA',
  contents: [
    // スコア行（大きく、イメージカラーで）
    {
      type: 'text',
      text: `${getEmoji(radarScores.balance)} ${radarScores.balance}点`,
      size: 'xxl',
      weight: 'bold',
      color: '#58A6C7', // 淡い水色系
      align: 'center',
      margin: 'xs'
    },
    {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'あなた', flex: 4, size: 'sm', weight: 'bold', color: '#333333' },
        { type: 'text', text: '相手',   flex: 4, size: 'sm', weight: 'bold', color: '#333333', align: 'end' }
      ]
    },
    { type: 'separator', margin: 'md' },
    {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'メッセージ数', flex: 4, size: 'sm', color: '#333333' },
        { type: 'text', text: `${recordsData.summary.talkCount[selfName]||0}回`, flex: 2, size: 'sm', color: '#333333', align: 'end' },
        { type: 'text', text: '｜', flex: 1, size: 'sm', color: '#333333', align: 'center' },
        { type: 'text', text: `${recordsData.summary.talkCount[otherName]||0}回`, flex: 2, size: 'sm', color: '#333333', align: 'start' }
      ]
    },
    {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '文字数', flex: 4, size: 'sm', color: '#333333' },
        { type: 'text', text: `${recordsData.summary.totalChars[selfName]||0}字`, flex: 2, size: 'sm', color: '#333333', align: 'end' },
        { type: 'text', text: '｜', flex: 1, size: 'sm', color: '#333333', align: 'center' },
        { type: 'text', text: `${recordsData.summary.totalChars[otherName]||0}字`, flex: 2, size: 'sm', color: '#333333', align: 'start' }
      ]
    },
    { type: 'separator', margin: 'md' },
    { type: 'text', text: '曜日別メッセージ数', size: 'sm', weight: 'bold', color: '#333333', margin: 'md' },
    ...weekdayLabelKeys.map(key => ({
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: jpWeekMap[key], flex: 2, size: 'sm', color: '#333333' },
        { type: 'text', text: `${habitsData.dayOfWeek[selfName][key] || 0}回`, flex: 2, size: 'sm', color: '#333333', align: 'end' },
        { type: 'text', text: '｜', flex: 1, size: 'sm', color: '#333333', align: 'center' },
        { type: 'text', text: `${habitsData.dayOfWeek[otherName][key] || 0}回`, flex: 2, size: 'sm', color: '#333333', align: 'start' }
      ]
    }
   ))
  
  ]
},
 footer: {
 type: 'box',
 layout: 'vertical',
 contents: [
   // 画像を最初に
    {
     type: 'image',
     url: 'https://github.com/syuta-sns/line-bot-assets/raw/main/%E3%83%8F%E3%82%99%E3%83%8A%E3%83%BC%20(3).png', // GitHub Pagesの画像URL
     size: 'full',
     aspectMode: 'cover',
     aspectRatio: '52:7' // 画像の比率に合わせて調整
     },
   // コメント（背景色つきボックス）
   {
     type: 'box',
     layout: 'vertical',
     backgroundColor: '#E8F6FA', // ← 背景色
     cornerRadius: '8px',
     paddingAll: '12px',
     contents: [
    // ← ここから追加
    {
      type: 'text',
      text: comments.balance[getScoreBand(radarScores.balance)],
      wrap: true,
      margin: 'md',
      size: 'xs',
      color: '#555555'
    }
     ]
   }
 ],
 spacing: 'none',
 paddingAll: 'none'
}
};




// --- ページ4: LINE頻度詳細 ---
const stats       = behaviorData.replyStats;
const selfStats   = stats[selfName];
const otherStats  = stats[otherName];
const adviceAvg   = formatMinutes(otherStats.avg);
const adviceSlow  = formatMinutes(otherStats.slowest);




// 5分以内に何通送ったかのカウント（不要なら削除してください）
const selfQuickCount  = behaviorData.replyDiffs[selfName]?.filter(d => d < 1).length || 0;
const otherQuickCount = behaviorData.replyDiffs[otherName]?.filter(d => d < 1).length || 0;




// --- ページ4: LINE頻度詳細 ---
const page4 = {
type: 'bubble',
size: 'mega',
hero: {
  type: 'image',
  url: 'https://syuta-sns.github.io/line-bot-assets/%E3%83%98%E3%83%83%E3%82%BF%E3%82%99%E3%83%BC3.png',
  size: 'full',
  aspectMode: 'cover',
  aspectRatio: '13:3'
},
body: {
  type: 'box',
  layout: 'vertical',
  spacing: 'sm',
  paddingAll: '16px',
  backgroundColor: '#F6F6EC',
  contents: [
    {
      type: 'text',
      text: `${getEmoji(radarScores.tempo)} ${radarScores.tempo}点`,
      size: 'xxl',
      weight: 'bold',
      color: '#75a56f', // 緑
      align: 'center',
      margin: 'xs'
    },
    {
      type: 'text',
      text: '返信間隔',
      size: 'sm',
      weight: 'bold',
      color: '#333333',
      align: 'center',
      margin: 'md'
    },
    {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: 'あなた', flex: 1, size: 'sm', weight: 'bold', color: '#333333' },
        { type: 'text', text: '相手',   flex: 1, size: 'sm', weight: 'bold', color: '#333333', align: 'end' }
      ]
    },
    { type: 'separator', margin: 'md' },
    {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: '平均返信', flex: 2, size: 'sm', weight: 'bold', color: '#333333' },
        { type: 'text', text: formatMinutes(selfStats.avg), flex: 3, size: 'sm', color: '#333333', align: 'end', wrap: true },
        { type: 'text', text: '｜', flex: 1, size: 'sm', color: '#333333', align: 'center' },
        { type: 'text', text: formatMinutes(otherStats.avg), flex: 3, size: 'sm', color: '#333333', align: 'start', wrap: true }
      ]
    },
    {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: '最速返信', flex: 2, size: 'sm', weight: 'bold', color: '#333333' },
        { type: 'text', text: selfStats.fastest != null && selfStats.fastest <= 5 ? '5分以内' : formatMinutes(selfStats.fastest), flex: 3, size: 'sm', color: '#333333', align: 'end', wrap: true },
        { type: 'text', text: '｜', flex: 1, size: 'sm', color: '#333333', align: 'center' },
        { type: 'text', text: otherStats.fastest != null && otherStats.fastest <= 5 ? '5分以内' : formatMinutes(otherStats.fastest), flex: 3, size: 'sm', color: '#333333', align: 'start', wrap: true }
      ]
    },
    {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: '最遅返信', flex: 2, size: 'sm', weight: 'bold', color: '#333333' },
        { type: 'text', text: formatMinutes(selfStats.slowest), flex: 3, size: 'sm', color: '#333333', align: 'end', wrap: true },
        { type: 'text', text: '｜', flex: 1, size: 'sm', color: '#333333', align: 'center' },
        { type: 'text', text: formatMinutes(otherStats.slowest), flex: 3, size: 'sm', color: '#333333', align: 'start', wrap: true }
      ]
    }
    // ← ここから追加
  ]
}
,
 footer: {
 type: 'box',
 layout: 'vertical',
 contents: [
   // 画像を最初に
    {
     type: 'image',
     url: 'https://github.com/syuta-sns/line-bot-assets/raw/main/%E3%83%8F%E3%82%99%E3%83%8A%E3%83%BC%20(4).png', // GitHub Pagesの画像URL
     size: 'full',
     aspectMode: 'cover',
     aspectRatio: '52:7' // 画像の比率に合わせて調整
     },
   // コメント（背景色つきボックス）
   {
     type: 'box',
     layout: 'vertical',
     backgroundColor: '#FDF6DD', // ← 背景色
     cornerRadius: '8px',
     paddingAll: '12px',
     contents: [
       {
      type: 'text',
      text: comments.tempo[getScoreBand(radarScores.tempo)],
      wrap: true,
      margin: 'md',
      size: 'xs',
      color: '#555555'
    }
     ]
   }
 ],
 spacing: 'none',
 paddingAll: 'none'
}
};
















  // --- ページ5: 行動タイプ詳細 (短文・長文・追いライン) ---
const page5 = {
type: 'bubble',
size: 'mega',
hero: {
  type: 'image',
  url: 'https://syuta-sns.github.io/line-bot-assets/%E3%83%98%E3%83%83%E3%82%BF%E3%82%99%E3%83%BC5.png',
  size: 'full',
  aspectMode: 'cover',
  aspectRatio: '13:3'
},
body: {
  type: 'box',
  layout: 'vertical',
  spacing: 'sm',
  paddingAll: '16px',
  backgroundColor: '#F9F6F4', // くすみベージュ
  contents: [
    {
      type: 'text',
      text: `${getEmoji(radarScores.type)} ${radarScores.type}点`,
      size: 'xxl',
      weight: 'bold',
      color: '#6D4C41', // ブラウン
      align: 'center',
      margin: 'xs'
    },
    {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: '　', flex: 2 }, // 空き
        { type: 'text', text: 'あなた', flex: 2, align: 'end', size: 'sm', weight: 'bold' },
        { type: 'text', text: '｜', flex: 1, align: 'center', size: 'sm' },
        { type: 'text', text: '相手', flex: 2, align: 'start', size: 'sm', weight: 'bold' }
      ]
    },
    { type: 'separator', margin: 'md' },
    {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: '平均文字数', flex: 2, size: 'sm', color: '#333333', weight: 'bold', wrap: true },
        { type: 'text', text: recordsData.summary.talkCount[selfName] > 0 ? Math.round(recordsData.summary.totalChars[selfName] / recordsData.summary.talkCount[selfName]) + '字' : '—', flex: 2, align: 'end', size: 'sm', color: '#333333', wrap: true },
        { type: 'text', text: '｜', flex: 1, align: 'center', size: 'sm', color: '#333333' },
        { type: 'text', text: recordsData.summary.talkCount[otherName] > 0 ? Math.round(recordsData.summary.totalChars[otherName] / recordsData.summary.talkCount[otherName]) + '字' : '—', flex: 2, align: 'start', size: 'sm', color: '#333333', wrap: true }
      ]
    },
    {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: '短文　　(<7字)', flex: 2, size: 'sm', weight: 'bold', color: '#333333', wrap: true },
        { type: 'text', text: `${behaviorData.shortCounts[selfName]}回`, flex: 2, align: 'end', size: 'sm', wrap: true },
        { type: 'text', text: '｜', flex: 1, align: 'center', size: 'sm' },
        { type: 'text', text: `${behaviorData.shortCounts[otherName]}回`, flex: 2, align: 'start', size: 'sm', wrap: true }
      ]
    },
    {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: '長文　　(>100字)', flex: 2, size: 'sm', weight: 'bold', color: '#333333', wrap: true },
        { type: 'text', text: `${behaviorData.longCounts[selfName]}回`, flex: 2, align: 'end', size: 'sm', wrap: true },
        { type: 'text', text: '｜', flex: 1, align: 'center', size: 'sm' },
        { type: 'text', text: `${behaviorData.longCounts[otherName]}回`, flex: 2, align: 'start', size: 'sm', wrap: true }
      ]
    },
    {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: '追いLINE', flex: 2, size: 'sm', weight: 'bold', color: '#333333', wrap: true },
        { type: 'text', text: `${behaviorData.pursuitCounts[selfName]}回`, flex: 2, align: 'end', size: 'sm', wrap: true },
        { type: 'text', text: '｜', flex: 1, align: 'center', size: 'sm' },
        { type: 'text', text: `${behaviorData.pursuitCounts[otherName]}回`, flex: 2, align: 'start', size: 'sm', wrap: true }
      ]
    },// --- 行動タイプの内訳 ---
{
type: 'box', layout: 'horizontal', spacing: 'sm',
contents: [
  { type: 'text', text: 'スタンプ', flex: 2, size: 'sm', weight: 'bold', color: '#333333', wrap: true },
  { type: 'text', text: `${behaviorData.counters[selfName].stamp}回`, flex: 2, align: 'end', size: 'sm', wrap: true },
  { type: 'text', text: '｜', flex: 1, align: 'center', size: 'sm' },
  { type: 'text', text: `${behaviorData.counters[otherName].stamp}回`, flex: 2, align: 'start', size: 'sm', wrap: true }
]
},
{
type: 'box', layout: 'horizontal', spacing: 'sm',
contents: [
  { type: 'text', text: '画像', flex: 2, size: 'sm', weight: 'bold', color: '#333333', wrap: true },
  { type: 'text', text: `${behaviorData.counters[selfName].photo}回`, flex: 2, align: 'end', size: 'sm', wrap: true },
  { type: 'text', text: '｜', flex: 1, align: 'center', size: 'sm' },
  { type: 'text', text: `${behaviorData.counters[otherName].photo}回`, flex: 2, align: 'start', size: 'sm', wrap: true }
]
},
{
type: 'box', layout: 'horizontal', spacing: 'sm',
contents: [
  { type: 'text', text: '動画', flex: 2, size: 'sm', weight: 'bold', color: '#333333', wrap: true },
  { type: 'text', text: `${behaviorData.counters[selfName].video}回`, flex: 2, align: 'end', size: 'sm', wrap: true },
  { type: 'text', text: '｜', flex: 1, align: 'center', size: 'sm' },
  { type: 'text', text: `${behaviorData.counters[otherName].video}回`, flex: 2, align: 'start', size: 'sm', wrap: true }
]
},
{
type: 'box', layout: 'horizontal', spacing: 'sm',
contents: [
  { type: 'text', text: '送信取消', flex: 2, size: 'sm', weight: 'bold', color: '#333333', wrap: true },
  { type: 'text', text: `${behaviorData.counters[selfName].cancel}回`, flex: 2, align: 'end', size: 'sm', wrap: true },
  { type: 'text', text: '｜', flex: 1, align: 'center', size: 'sm' },
  { type: 'text', text: `${behaviorData.counters[otherName].cancel}回`, flex: 2, align: 'start', size: 'sm', wrap: true }
]
}
    // ← ここから追加 
  ]
},
footer: {
 type: 'box',
 layout: 'vertical',
 contents: [
   // 画像を最初に
    {
     type: 'image',
     url: 'https://github.com/syuta-sns/line-bot-assets/raw/main/%E3%83%8F%E3%82%99%E3%83%8A%E3%83%BC%20(5).png', // GitHub Pagesの画像URL
     size: 'full',
     aspectMode: 'cover',
     aspectRatio: '52:7' // 画像の比率に合わせて調整
     },
   // コメント（背景色つきボックス）
   {
     type: 'box',
     layout: 'vertical',
     backgroundColor: '#FFE9E3', // ← 背景色
     cornerRadius: '8px',
     paddingAll: '12px',
     contents: [
       {
      type: 'text',
      text: comments.type[getScoreBand(radarScores.type)],
      wrap: true,
      margin: 'md',
      size: 'xs',
      color: '#555555'
    }
     ]
   }
 ],
 spacing: 'none',
 paddingAll: 'none'
}
};












// --- ページ6: 言葉詳細 ---
// ワードリスト（loveWordList, negativeWordList, commonWords）を、
function wordDictToRows(wordDict, selfKey, otherKey, limit = 5) {
 return Object.entries(wordDict || {})
   .slice(0, limit)
   .map(([word, counts]) => ({
     word,
     self: counts[selfKey] || 0,
     other: counts[otherKey] || 0
   }));
}


// 使用時に、共通ワードだけ3件にする
const loveRows = wordDictToRows(recordsData.summary.loveWordList, selfName, otherName, 5);
const negRows  = wordDictToRows(recordsData.summary.negativeWordList, selfName, otherName, 5);
const commRows = wordDictToRows(recordsData.summary.commonWords, selfName, otherName, 3); // ← ここ




// 1ジャンル分（例：loveRows）のFlex生成
function makeWordFlexRows(rows, colorWord, colorSelf, colorOther) {
return rows.map(row => ({
  type: 'box',
  layout: 'horizontal',
  contents: [
    { type: 'text', text: row.word, flex: 6, size: 'sm', color: colorWord, align: 'start' },
    { type: 'text', text: `${row.self}回`, flex: 3, size: 'sm', color: colorSelf, align: 'end' },
    { type: 'text', text: `${row.other}回`, flex: 3, size: 'sm', color: colorOther, align: 'end' }
  ]
}));
}


const page6 = {
type: 'bubble',
size: 'mega',
hero: {
  type: 'image',
  url: 'https://syuta-sns.github.io/line-bot-assets/%E3%83%98%E3%83%83%E3%82%BF%E3%82%99%E3%83%BC6.png',
  size: 'full',
  aspectMode: 'cover',
  aspectRatio: '13:3'
},
body: {
  type: 'box',
  layout: 'vertical',
  spacing: 'sm',
  paddingAll: '16px',
  backgroundColor: '#F6F0F1', // くすみピンク
  contents: [
    {
      type: 'text',
      text: `${getEmoji(radarScores.words)} ${radarScores.words}点`,
      size: 'xxl',
      weight: 'bold',
      color: '#BB8673',
      align: 'center',
      margin: 'xs'
    },
    {
      type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: '共通ワード', flex: 6, size: 'xs', color: '#333333', weight: 'bold' },
        { type: 'text', text: 'あなた', flex: 3, size: 'xs', color: '#00897B', align: 'end', weight: 'bold' },
        { type: 'text', text: '相手', flex: 3, size: 'xs', color: '#E91E63', align: 'end', weight: 'bold' }
      ]
    },
    ...makeWordFlexRows(commRows, '#333333', '#00897B', '#E91E63'),
    { type: 'separator', margin: 'xs' },
    {
      type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: 'ポジティブワード', flex: 6, size: 'xs', color: '#E91E63', weight: 'bold' },
        { type: 'text', text: 'あなた', flex: 3, size: 'xs', color: '#00897B', align: 'end', weight: 'bold' },
        { type: 'text', text: '相手', flex: 3, size: 'xs', color: '#E91E63', align: 'end', weight: 'bold' }
      ]
    },
    ...makeWordFlexRows(loveRows, '#E91E63', '#00897B', '#E91E63'),
    { type: 'separator', margin: 'xs' },
    {
      type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: 'ネガティブワード', flex: 6, size: 'xs', color: '#F44336', weight: 'bold' },
        { type: 'text', text: 'あなた', flex: 3, size: 'xs', color: '#00897B', align: 'end', weight: 'bold' },
        { type: 'text', text: '相手', flex: 3, size: 'xs', color: '#E91E63', align: 'end', weight: 'bold' }
      ]
    },
    ...makeWordFlexRows(negRows, '#F44336', '#00897B', '#E91E63')
    // ← ここから追加
   
  ]
},
footer: {
 type: 'box',
 layout: 'vertical',
 contents: [
   // 画像を最初に
    {
     type: 'image',
     url: 'https://github.com/syuta-sns/line-bot-assets/raw/main/%E3%83%8F%E3%82%99%E3%83%8A%E3%83%BC%20(6).png', // GitHub Pagesの画像URL
     size: 'full',
     aspectMode: 'cover',
     aspectRatio: '52:7' // 画像の比率に合わせて調整
     },
   // コメント（背景色つきボックス）
   {
     type: 'box',
     layout: 'vertical',
     backgroundColor: '#F8E8F1', // ← 背景色
     cornerRadius: '8px',
     paddingAll: '12px',
     contents: [
       {
      type: 'text',
      text: comments.words[getScoreBand(radarScores.words)],
      wrap: true,
      margin: 'md',
      size: 'xs',
      color: '#555555'
    }
     ]
   }
 ],
 spacing: 'none',
 paddingAll: 'none'
}
};


// --- ページ7: 性格診断 ---
const typeLinks = {
  "ねずみ男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=ne",
  "うし男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=ushi",
  "とら男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=tora",
  "うさぎ男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=u",
  "りゅう男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=tatsu",
  "へび男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=mi",
  "うま男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=uma",
  "ひつじ男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=hitsuji",
  "さる男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=saru",
  "とり男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=tori",
  "いぬ男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=inu",
  "いのしし男子": "https://line-bot-assets-git-main-mizunos-projects-d8e13887.vercel.app/?type=i"
};

const resultUrl = typeLinks[animalTypeData.name || animalType] || 'https://syuta-sns.github.io/line-bot-assets/index.html';

const page7 = {
 type: 'bubble',
 size: 'mega',
 hero: {
   type: 'image',
   url: 'https://syuta-sns.github.io/line-bot-assets/%E3%83%98%E3%83%83%E3%82%BF%E3%82%99%E3%83%BC7.png',
   size: 'full',
   aspectMode: 'cover',
   aspectRatio: '13:3'
 },
 body: {
   type: 'box',
   layout: 'vertical',
   paddingAll: '16px',
   backgroundColor: '#F6F8FA',
   spacing: 'md',
   contents: [
     { type: 'text', text: '彼のLINE傾向から見る性格は…', size: 'md', weight: 'bold', align: 'center', margin: 'md' },
     { type: 'text', text: animalTypeData.name || animalType, size: 'xxl', weight: 'bold', align: 'center', color: '#6D82B3' },
     { type: 'text', text: `👇${otherName}さんの性格を詳しく見る👀👇`, size: 'xs', wrap: true, color: '#444444', margin: 'sm' },
     {
      type: 'button',
      style: 'primary',
      color: '#6D82B3',
      action: {
        type: 'uri',
        label: '詳しい結果はここをクリック！',
        uri: resultUrl
      }
     },
     {
       type: 'text',
       text: "　",
       size: 'xxs',
       margin: 'md'
     },
     {
       type: 'image',
       url: 'https://raw.githubusercontent.com/syuta-sns/line-bot-assets/main/%E3%83%8F%E3%82%99%E3%83%8A%E3%83%BC%20(71).png',
       size: 'full',
       aspectMode: 'cover',
       aspectRatio: '55:7'
     },
     { type: 'text', text: `⭕️${recDayLabel}曜 ${recTimeLabel}ごろがおすすめ！`, weight: 'bold', size: 'md', align: 'center' },
     { type: 'text', text: `この時間帯はあなたも${otherName}さんもLINEしやすいタイミングなので、返信がもらいやすいですよ👍`, size: 'xs', wrap: true }    
   ]
 },
 footer: {
   type: 'box',
   layout: 'vertical',
   contents: [
     {
       type: 'image',
       url: 'https://github.com/syuta-sns/line-bot-assets/raw/main/%E3%83%8F%E3%82%99%E3%83%8A%E3%83%BC%20(72).png',
       size: 'full',
       aspectMode: 'cover',
       aspectRatio: '52:7'     
     },
     {
       type: 'box',
       layout: 'vertical',
       backgroundColor: '#F6F8FB',
       cornerRadius: '8px',
       paddingAll: '16px',
       contents: [
         { type: 'text',
           text: `${otherName}さんからの返信は平均で${adviceAvg}くらい！\n遅いときは${adviceSlow}かかることもあります😳\n返信を待つときの目安にしてみてね！😊`,
           size: 'xs', color: '#333333', wrap: true
         }
       ]
     }
   ],
   spacing: 'none',
   paddingAll: 'none'
 }
};

/* 
// --- ページ8: プロモーションページ ---
const page8 = {
type: 'bubble',
size: 'mega',
hero: {
  type: 'image',
  url: 'https://syuta-sns.github.io/line-bot-assets/%E3%83%98%E3%83%83%E3%82%BF%E3%82%99%E3%83%BC8.png',
  size: 'full',
  aspectMode: 'cover',
  aspectRatio: '13:3'
},
body: {
  type: 'box',
  layout: 'vertical',
  contents: [
    {
      type: 'text',
      text: 'あなたの恋愛診断士しゅーたが\nもっと詳しいアドバイスをお届け中！',
      size: 'md',
      color: '#D63384',
      align: 'center',
      wrap: true
    }
  ]
},
footer: {
  type: 'box',
  layout: 'vertical',
  spacing: 'sm',
  paddingAll: '12px',
  backgroundColor: '#F8F6FB',
  contents: [
    {
      type: 'button',
      style: 'primary',
      color: '#D63384',
      action: {
        type: 'uri',
        label: '診断結果を詳しく見る',
        uri: 'https://syuta-sns.github.io/line-bot-assets/index.html'
      }
    }
  ]
}
};
 */





return {
  type: 'flex',
  altText: '詳細診断結果',
  contents: {
    type: 'carousel',
    contents: [page1, page2, page3, page4, page5, page6, page7]
  }
};
}




module.exports = { buildCompatibilityCarousel };

