const { guessLineAnimalType } = require('./metrics/compatibility');

// 仮のダミーデータ（適当じゃが例として…）
const behaviorData = {
  replyStats: {
    '田中太郎': { avg: 45 },
  },
  shortCounts: { '田中太郎': 5 },
  longCounts: { '田中太郎': 1 },
  pursuitCounts: { '田中太郎': 0 },
  counters: {
    '田中太郎': {
      stamp: 10,
      photo: 2,
      video: 1,
    }
  }
};

const recordsData = {
  summary: {
    loveWordCount: { '田中太郎': 5 },
    negativeWordCount: { '田中太郎': 1 },
    talkCount: { '田中太郎': 20 },
    totalChars: { '田中太郎': 200 },
  }
};

const selfName = '自分';
const otherName = '田中太郎';

const type = guessLineAnimalType({ behaviorData, recordsData, selfName, otherName });

console.log('判定タイプ:', type);
