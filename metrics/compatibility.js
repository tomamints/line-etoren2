// metrics/compatibility.js

const dayjs = require('dayjs');
const { TIME_BINS } = require('./habits');
const { guessZodiacType, calcZodiacTypeScores } = require('./zodiac');

// --- 時間帯スコア ---
function calcTimeScore(selfBins, otherBins) {
  const diffs = Object.keys(selfBins)
    .reduce((sum, label) => sum + Math.abs(selfBins[label] - otherBins[label]), 0);
  const total = Object.values(selfBins).reduce((a, b) => a + b, 0)
    + Object.values(otherBins).reduce((a, b) => a + b, 0);
  if (total === 0) return 100;
  return Math.max(0, Math.round((1 - diffs / total) * 100));
}

// --- バランススコア（メッセージ数と文字数の平均）---
function calcBalanceScore(totalSelf, totalOther, charsSelf, charsOther) {
  const minMsg = Math.min(totalSelf, totalOther);
  const maxMsg = Math.max(totalSelf, totalOther);
  const msgScore = maxMsg === 0 ? 100 : (minMsg / maxMsg) * 100;
  const minChar = Math.min(charsSelf, charsOther);
  const maxChar = Math.max(charsSelf, charsOther);
  const charScore = maxChar === 0 ? 100 : (minChar / maxChar) * 100;
  return Math.round((msgScore + charScore) / 2);
}

// --- LINE頻度スコア ---
function calcTempoScore(messages, selfName, otherName) {
  const daily = {};
  for (const m of messages) {
    const who = m.sender === selfName ? selfName : otherName;
    const day = dayjs(m.datetime, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD');
    daily[day] = daily[day] || { [selfName]: 0, [otherName]: 0 };
    daily[day][who]++;
  }
  const days = Object.keys(daily);
  if (days.length < 2) return 100;
  const xs = days.map(d => daily[d][selfName]);
  const ys = days.map(d => daily[d][otherName]);
  const n = days.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const denom = Math.sqrt(denX * denY);
  const r = denom === 0 ? 0 : num / denom;
  const r2 = r * r;
  return Math.round(((Math.pow(r2, 0.75) + 1) / 2) * 100);
}

// --- 行動タイプスコア ---
function calcTypeScore(messages, selfName, otherName) {
  const categories = ['text','sticker','image','video','voice','file'];
  const selfCount  = Object.fromEntries(categories.map(c => [c, 0]));
  const otherCount = Object.fromEntries(categories.map(c => [c, 0]));
  for (const m of messages) {
    const cat = categories.includes(m.type) ? m.type : 'text';
    if (m.sender === selfName) selfCount[cat]++;
    else                        otherCount[cat]++;
  }
  let num = 0, den = 0;
  categories.forEach(c => {
    num += Math.min(selfCount[c], otherCount[c]);
    den += Math.max(selfCount[c], otherCount[c]);
  });
  if (den === 0) return 100;
  return Math.round((num / den) * 100);
}

// --- 言葉スコア（ポジ/ネガ比＋共通ワード加点, 上限100点） ---
function calcWordsScorePosNegCommon(recordsData, selfName, otherName) {
  if (!recordsData || !recordsData.summary) return 50;
  const pos = (recordsData.summary.loveWordCount[selfName] || 0)
            + (recordsData.summary.loveWordCount[otherName] || 0);
  const neg = (recordsData.summary.negativeWordCount[selfName] || 0)
            + (recordsData.summary.negativeWordCount[otherName] || 0);
  const total = pos + neg;
  if (total === 0) return 50;
  const posRatio = pos / total;
  const commonWords = recordsData.summary.commonWords || {};
  let commonCount = 0;
  Object.entries(commonWords).forEach(([w, v]) => {
    if (w.length >= 3 && (v[selfName] >= 5 || v[otherName] >= 5)) {
      commonCount++;
    }
  });
  const commonBonus = Math.min(20, commonCount * 1);
  const score = Math.round(posRatio * 100 + commonBonus);
  return Math.min(100, score);
}

// --- 全体 ---
// 旧animalType系は消去・zodiac判定はzodiac.jsで行う
function calcAll({ messages, selfName, otherName, recordsData }) {
  // 各種スコア集計
  const selfBins  = Object.fromEntries(TIME_BINS.map(b => [b.label, 0]));
  const otherBins = Object.fromEntries(TIME_BINS.map(b => [b.label, 0]));
  let totalSelf = 0, totalOther = 0;
  let charsSelf = 0, charsOther = 0;

  for (const m of messages) {
    const whoIsSelf = m.sender === selfName;
    if (whoIsSelf) {
      totalSelf++;
      if (m.type === 'text') charsSelf += m.body.length;
    } else {
      totalOther++;
      if (m.type === 'text') charsOther += m.body.length;
    }
    const hour = dayjs(m.datetime, 'YYYY/MM/DD HH:mm').hour();
    for (const bin of TIME_BINS) {
      if (hour >= bin.start && hour < bin.end) {
        if (whoIsSelf) selfBins[bin.label]++;
        else           otherBins[bin.label]++;
        break;
      }
    }
  }

  const radarScores = {
    time:    calcTimeScore(selfBins, otherBins),
    balance: calcBalanceScore(totalSelf, totalOther, charsSelf, charsOther),
    tempo:   calcTempoScore(messages, selfName, otherName),
    type:    calcTypeScore(messages, selfName, otherName),
    words:   calcWordsScorePosNegCommon(recordsData, selfName, otherName)
  };

  const overall = Math.round(
    (radarScores.time + radarScores.balance + radarScores.tempo + radarScores.type + radarScores.words) / 5
  );

  // zodiac.jsのスコアもここで併せて返しておくと便利（必要なら）
  const zodiacScores = calcZodiacTypeScores({ messages, selfName, otherName, recordsData });

  return { radarScores, overall, zodiacScores };
}

// 干支タイプ判定はzodiac.jsのguessZodiacTypeを使うこと

module.exports = { calcAll };
