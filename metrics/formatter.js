// metrics/formatter.js

const MAX_CHUNK_SIZE = 1500;

/**
 * buildFullReport: 重複削除＆整理版
 */
function buildFullReport({
  selfName,
  otherName,
  compatibilityData,
  habitsData,
  behaviorData,
  recordsData
}) {
  const sb = [];

  // ===== 相性結果 =====
  sb.push('===== 相性結果 =====');
  sb.push(`・自分  : ${selfName}`);
  sb.push(`・相手  : ${otherName}`);
  sb.push(`・分析日: ${recordsData.analyzedDate}`);
  sb.push('');
  sb.push('--- スコア (レーダーチャート５軸) ---');
  for (const [k, v] of Object.entries(compatibilityData.radarScores)) {
    sb.push(`・${k.padEnd(6)}: ${v}`);
  }
  sb.push('');
  for (const [k, v] of Object.entries(compatibilityData.radarScores)) {
    sb.push(getScoreComment(v, k));
  }
  sb.push('');

  // ===== 習慣 =====
  sb.push('===== 習慣 =====');
  sb.push('・曜日別メッセージ数:');
  for (const dow of Object.keys(habitsData.dayOfWeek[selfName])) {
    const a = habitsData.dayOfWeek[selfName][dow];
    const b = habitsData.dayOfWeek[otherName][dow];
    sb.push(`  ${dow} → ${selfName}: ${a}件 | ${otherName}: ${b}件`);
  }
  sb.push(`・最も活発な曜日: ${habitsData.dayOfWeek.mostActiveDay}`);
  sb.push('');
  sb.push('・時間帯別メッセージ数:');
  for (const slot of Object.keys(habitsData.timeOfDay[selfName])) {
    const a = habitsData.timeOfDay[selfName][slot];
    const b = habitsData.timeOfDay[otherName][slot];
    sb.push(`  ${slot} → ${selfName}: ${a}件 | ${otherName}: ${b}件`);
  }
  sb.push(`・最も活発な時間帯: ${habitsData.timeOfDay.mostActiveSlot}`);
  sb.push('');

  // ===== 行動 =====
  sb.push('===== 行動 =====');
  const B = behaviorData;
  sb.push(`・トーク回数          : ${selfName} ${B.totalTalkCount[selfName]}回 | ${otherName} ${B.totalTalkCount[otherName]}回`);
  sb.push(`・追いトーク回数      : ${selfName} ${B.totalReplyCount[selfName]}回 | ${otherName} ${B.totalReplyCount[otherName]}回`);
  sb.push(`・スタンプ            : ${selfName} ${B.stampCount[selfName]}回 | ${otherName} ${B.stampCount[otherName]}回`);
  sb.push(`・写真送付            : ${selfName} ${B.photoCount[selfName]}回 | ${otherName} ${B.photoCount[otherName]}回`);
  sb.push(`・動画送付            : ${selfName} ${B.videoCount[selfName]}回 | ${otherName} ${B.videoCount[otherName]}回`);
  sb.push(`・URL送付             : ${selfName} ${B.urlCount[selfName]}回 | ${otherName} ${B.urlCount[otherName]}回`);
  sb.push(`・ファイル送付        : ${selfName} ${B.fileCount[selfName]}回 | ${otherName} ${B.fileCount[otherName]}回`);
  sb.push(`・通話回数／時間     : ${selfName} ${B.callCount[selfName]}回／${formatSec(B.callDuration[selfName])} | ${otherName} ${B.callCount[otherName]}回／${formatSec(B.callDuration[otherName])}`);
  sb.push(`・不在着信            : ${selfName} ${B.missedCallCount[selfName]}回 | ${otherName} ${B.missedCallCount[otherName]}回`);
  sb.push(`・笑いワード("笑")    : ${selfName} ${B.laughCount[selfName]}回 | ${otherName} ${B.laughCount[otherName]}回`);
  sb.push(`・「w」使用            : ${selfName} ${B.wCount[selfName]}回 | ${otherName} ${B.wCount[otherName]}回`);
  sb.push(`・感謝ワード(ありがとう): ${selfName} ${B.thankCount[selfName]}回 | ${otherName} ${B.thankCount[otherName]}回`);
  sb.push(`・謝罪ワード(ごめん)    : ${selfName} ${B.sorryCount[selfName]}回 | ${otherName} ${B.sorryCount[otherName]}回`);
  sb.push('');

  // ===== 記録 =====
  sb.push('===== 記録 =====');
  sb.push(`・はじめてのトーク: ${recordsData.firstTalkDate}`);
  sb.push(`・さいごのトーク: ${recordsData.lastTalkDate}`);
  sb.push(`・経過日数       : ${recordsData.daysSinceStart}日`);
  sb.push(`・総トーク数     : ${recordsData.totalTalks}件`);
  sb.push(`・総追いトーク数 : ${recordsData.totalReplies}件`);
  sb.push(`・総通話回数     : ${recordsData.totalCallCount[selfName] + recordsData.totalCallCount[otherName]}回`);
  sb.push(`・総通話時間     : ${recordsData.totalCallDuration[selfName]} + ${recordsData.totalCallDuration[otherName]}`);
  sb.push('');

  return sb.join('\n');
}

/**
 * スコアに応じた評価コメント
 */
function getScoreComment(score, label) {
  if (score >= 80) {
    return `🟢 ${label}は良好です。快適なやりとりができています。`;
  } else if (score >= 50) {
    return `🟡 ${label}はやや不安定です。少し意識するともっと良くなります。`;
  } else {
    return `🔴 ${label}はズレが大きめです。やりとりの仕方を見直してみましょう。`;
  }
}

/**
 * LINE のメッセージ文字数制限対策：1500文字ごとに分割
 */
function splitIntoChunks(fullText) {
  const chunks = [];
  let start = 0;
  while (start < fullText.length) {
    const end = Math.min(start + MAX_CHUNK_SIZE, fullText.length);
    chunks.push(fullText.slice(start, end));
    start = end;
  }
  return chunks;
}

/**
 * 秒数 → "H時間M分S秒"
 */
function formatSec(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}時間${m}分${s}秒`;
}

module.exports = {
  buildFullReport,
  splitIntoChunks
};
