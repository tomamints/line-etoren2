const records = require('./records');
const behavior = require('./behavior');
const parser = require('./parser');

/**
 * 干支男子タイプをスコアリング判定する
 * @param {Object} param0
 * @param {Array} param0.messages - メッセージ配列
 * @param {string} param0.selfName - ユーザー名（女性側）
 * @param {string} param0.otherName - 相手名（男性側）
 * @returns {Object} { animalType, scores }
 */
function calcZodiacTypeScores({ messages, selfName, otherName }) {
  // 各種データ
  const recordsData = records.calcAll({ messages, selfName, otherName });
  const behaviorData = behavior.calcAll({ messages, selfName, otherName });

  // パラメータ抽出
  const totalMsgSelf = recordsData.summary?.talkCount?.[selfName] || 1;
  const totalMsgOther = recordsData.summary?.talkCount?.[otherName] || 1;
  const totalMsg = totalMsgSelf + totalMsgOther;
  const photoCountOther = behaviorData.counters?.[otherName]?.photo || 0;
  const consecutiveOther = behaviorData.pursuitCounts?.[otherName] || 0;
  const callCountOther = behaviorData.counters?.[otherName]?.callCount || 0;
  const avgReplyMinOther = behaviorData.replyStats?.[otherName]?.avg || 60;
  const avgReplySecOther = avgReplyMinOther * 60;
  const emojiCountOther = behaviorData.counters?.[otherName]?.stamp || 0;
  const ignoreCountOther = behaviorData.counters?.[otherName]?.missedCall || 0;
  const longMsgCountOther = behaviorData.longCounts?.[otherName] || 0;
  const shortMsgCountOther = behaviorData.shortCounts?.[otherName] || 0;
  const totalCharsOther = recordsData.summary?.totalChars?.[otherName] || 1;
  const urlCountOther = behaviorData.counters?.[otherName]?.url || 0;
  const cancelCountOther = behaviorData.counters?.[otherName]?.cancel || 0;
  const negativeWordCountOther = behaviorData.counters?.[otherName]?.negative || 0;

  const longRatio = totalMsgOther > 0 ? longMsgCountOther / totalMsgOther : 0;
  const shortRatio = totalMsgOther > 0 ? shortMsgCountOther / totalMsgOther : 0;
  const avgChars = totalMsgOther > 0 ? totalCharsOther / totalMsgOther : 0;

  const loveWordCount = recordsData.summary?.loveWordCount?.[otherName] || 0;

  // ひらがな率
  let totalHiraganaCount = 0;
  let totalCharCount = 0;
  messages.forEach(msg => {
    if (msg.sender === otherName && msg.body) {
      const chars = msg.body.split('');
      totalCharCount += chars.length;
      totalHiraganaCount += chars.filter(c => (c >= '\u3040' && c <= '\u309F')).length;
    }
  });
  const hiraganaRatio = totalCharCount > 0 ? totalHiraganaCount / totalCharCount : 0;

  // 俺率・！、？率・w/笑率
  let oreCount = 0, exclQuesCount = 0, laughCount = 0;
  messages.forEach(msg => {
    if (msg.sender === otherName && msg.body) {
      if (msg.body.match(/俺|僕|私/)) oreCount += 1;
      if (msg.body.match(/[！？!?]/g)) exclQuesCount += (msg.body.match(/[！？!?]/g) || []).length;
      if (msg.body.match(/w|笑/gi)) laughCount += (msg.body.match(/w|笑/gi) || []).length;
    }
  });
  const oreRatio = totalMsgOther > 0 ? oreCount / totalMsgOther : 0;
  const exclQuesRatio = totalMsgOther > 0 ? exclQuesCount / totalMsgOther : 0;
  const laughRatio = totalMsgOther > 0 ? laughCount / totalMsgOther : 0;

  // 深夜・早朝率
  let lateNightCount = 0, earlyMorningCount = 0;
  messages.forEach(msg => {
    if (msg.sender === otherName && msg.datetime) {
      const hour = Number(msg.datetime.split(' ')[1]?.split(':')[0]);
      if (hour >= 0 && hour < 5) earlyMorningCount++;
      if (hour >= 23 || hour < 3) lateNightCount++;
    }
  });
  const lateNightRatio = totalMsgOther > 0 ? lateNightCount / totalMsgOther : 0;
  const earlyMorningRatio = totalMsgOther > 0 ? earlyMorningCount / totalMsgOther : 0;
  const deepHourRatio = Math.max(lateNightRatio, earlyMorningRatio);

  // 送信取り消し率
  const cancelRatio = totalMsgOther > 0 ? cancelCountOther / totalMsgOther : 0;

  // 日別やり取り最大数（いのしし男子用）
  const dateCountMap = {};
  messages.forEach(msg => {
    if (msg.sender === otherName && msg.datetime) {
      const date = msg.datetime.split(' ')[0];
      dateCountMap[date] = (dateCountMap[date] || 0) + 1;
    }
  });
  const maxMsgPerDay = Math.max(...Object.values(dateCountMap), 0);
  const over100Days = Object.values(dateCountMap).filter(cnt => cnt >= 100).length;

  // ==================== スコア初期化 ====================
  const scores = {
    "ねずみ男子": 0,
    "うし男子": 0,
    "とら男子": 0,
    "うさぎ男子": 0,
    "りゅう男子": 0,
    "へび男子": 0,
    "うま男子": 0,
    "ひつじ男子": 0,
    "さる男子": 0,
    "とり男子": 0,
    "いぬ男子": 0,
    "いのしし男子": 0,
  };

  // ---- ねずみ男子 ----
  let nezumi = 0;
  // 1. 平均返信速さ
  if (avgReplySecOther <= 3600) nezumi += 30;
  else if (avgReplySecOther <= 3*3600) nezumi += 25;
  else if (avgReplySecOther <= 6*3600) nezumi += 20;
  else if (avgReplySecOther <= 12*3600) nezumi += 15;
  else if (avgReplySecOther <= 24*3600) nezumi += 10;
  else if (avgReplySecOther <= 36*3600) nezumi += 10;
  else if (avgReplySecOther <= 48*3600) nezumi += 5;
  // 2. 追いLINE率
  nezumi += Math.min((consecutiveOther / totalMsgOther) / 0.15, 1) * 10;
  // 3. 愛情ワード
  nezumi += Math.min(loveWordCount / 5, 1) * 10;
  // 4. 写真率
  nezumi += Math.min(photoCountOther / totalMsgOther / 0.15, 1) * 10;
  // 5. 発言比率
  const nezumiRate = totalMsgOther / totalMsg;
  if (nezumiRate <= 0.5) {
    nezumi += 0;
  } else if (nezumiRate > 0.5 && nezumiRate <= 0.65) {
    nezumi += ((nezumiRate - 0.5) / 0.15) * 30;
  } else {
    nezumi += 30;
  }
  // 6. URL送信率
  nezumi += Math.min(urlCountOther / 5, 1) * 10;
  scores["ねずみ男子"] = Math.round(nezumi);

  // ---- うし男子 ----
  let ushi = 0;
  // 1. 平均返信遅さ
  if (avgReplySecOther <= 3600) ushi += 0;
  else if (avgReplySecOther <= 3*3600) ushi += 7;
  else if (avgReplySecOther <= 6*3600) ushi += 15;
  else if (avgReplySecOther <= 12*3600) ushi += 22;
  else if (avgReplySecOther <= 24*3600) ushi += 30;
  else if (avgReplySecOther <= 36*3600) ushi += 40;
  else if (avgReplySecOther <= 48*3600) ushi += 50;
  // 2. 追いLINE少なさ
  ushi += (1 - Math.min((consecutiveOther / totalMsgOther) / 0.15, 1)) * 10;
  // 3. 写真率低さ
  ushi += (1 - Math.min(photoCountOther / totalMsgOther / 0.1, 1)) * 10;
  // 4. 短文率
  ushi += Math.min(shortRatio / 0.4, 1) * 30;
  scores["うし男子"] = Math.round(ushi);

  // ---- とら男子 ----
  let tora = 0;
  // 1. 通話率
  tora += Math.min(callCountOther / totalMsgOther / 0.1, 1) * 60;
  // 2. 愛情ワード
  tora += Math.min(loveWordCount / 5, 1) * 10;
  // 3. 発言比率
  if (nezumiRate <= 0.4) tora += 10;
  else if (nezumiRate > 0.4 && nezumiRate < 0.5) tora += ((0.5 - nezumiRate) / 0.1) * 10;
  // 4. 無視率
  tora += Math.min(ignoreCountOther / totalMsgOther / 0.1, 1) * 10;
  scores["とら男子"] = Math.round(tora);

  // ---- うさぎ男子 ----
  let usagi = 0;
  // 1. 追いLINE率
  usagi += Math.min((consecutiveOther / totalMsgOther) / 0.15, 1) * 30;
  // 2. 長文率
  usagi += Math.min(longRatio / 0.05, 1) * 10;
  // 3. 平均返信速さ
  if (avgReplySecOther <= 3600) usagi += 30;
  else if (avgReplySecOther <= 3*3600) usagi += 25;
  else if (avgReplySecOther <= 6*3600) usagi += 20;
  else if (avgReplySecOther <= 12*3600) usagi += 15;
  else if (avgReplySecOther <= 24*3600) usagi += 10;
  else if (avgReplySecOther <= 36*3600) usagi += 10;
  else if (avgReplySecOther <= 48*3600) usagi += 5;
  // 4. ネガティブワード
  usagi += Math.min(negativeWordCountOther / 60, 1) * 30;
  // 5. 送信取り消し
  usagi += Math.min(cancelRatio / 0.03, 1) * 20;
  if (usagi > 100) usagi = 100;
  scores["うさぎ男子"] = Math.round(usagi);

  // ---- りゅう男子 ----
  let ryu = 0;
  // 1. 俺率
  ryu += Math.min(oreRatio / 0.12, 1) * 40;
  // 2. 長文率
  ryu += Math.min(longRatio / 0.05, 1) * 20;
  // 3. 愛情ワード
  ryu += Math.min(loveWordCount / 40, 1) * 20;
  // 4. 発言比率
  if (nezumiRate <= 0.5) ryu += 0;
  else if (nezumiRate > 0.5 && nezumiRate <= 0.6) ryu += ((nezumiRate - 0.5) / 0.1) * 10;
  else ryu += 10;
  // 5. 絵文字率
  ryu += Math.min(emojiCountOther / totalMsgOther / 0.05, 1) * 10;
  scores["りゅう男子"] = Math.round(ryu);

  // ---- へび男子 ----
  let hebi = 0;
  if (totalMsgOther <= 50) {
    scores["へび男子"] = 120;
  } else {
    // 1. 平均返信遅さ
    if (avgReplySecOther <= 3600) hebi += 0;
    else if (avgReplySecOther <= 3*3600) hebi += 7;
    else if (avgReplySecOther <= 6*3600) hebi += 15;
    else if (avgReplySecOther <= 12*3600) hebi += 22;
    else if (avgReplySecOther <= 24*3600) hebi += 30;
    else if (avgReplySecOther <= 36*3600) hebi += 40;
    else if (avgReplySecOther <= 48*3600) hebi += 50;
    // 2. 深夜率
    hebi += Math.min(deepHourRatio / 0.1, 1) * 20;
    // 3. 送信取り消し
    hebi += Math.min(cancelRatio / 0.05, 1) * 30;
    scores["へび男子"] = Math.round(hebi);
  }

  // ---- うま男子 ----
  let uma = 0;
  // 1. 平均返信速さ
  if (avgReplySecOther <= 3600) uma += 30;
  else if (avgReplySecOther <= 3*3600) uma += 25;
  else if (avgReplySecOther <= 6*3600) uma += 20;
  else if (avgReplySecOther <= 12*3600) uma += 15;
  else if (avgReplySecOther <= 24*3600) uma += 10;
  else if (avgReplySecOther <= 36*3600) uma += 10;
  else if (avgReplySecOther <= 48*3600) uma += 5;
  // 2. 短文率
  if (shortRatio >= 0.1) {
    uma += Math.min((shortRatio - 0.1) / 0.2, 1) * 20;
  }
  // 3. スタンプ率
  uma += Math.min(emojiCountOther / totalMsgOther / 0.05, 1) * 30;
  // 4. ！、？率
  uma += Math.min(exclQuesRatio / 0.12, 1) * 30;
  // 5. 絵文字率
  uma -= Math.min(emojiCountOther / totalMsgOther / 0.05, 1) * 10;
  scores["うま男子"] = Math.round(uma);

  // ---- ひつじ男子 ----
  let hitsuji = 0;
  // 1. 発言比率
  let hRate = totalMsgOther / totalMsg;
  if (hRate >= 0.495 && hRate <= 0.505) hitsuji += 50;
  else if ((hRate >= 0.49 && hRate < 0.495) || (hRate > 0.505 && hRate <= 0.51)) hitsuji += 40;
  else if ((hRate >= 0.48 && hRate < 0.49) || (hRate > 0.51 && hRate <= 0.52)) hitsuji += 30;
  else if ((hRate >= 0.47 && hRate < 0.48) || (hRate > 0.52 && hRate <= 0.53)) hitsuji += 20;
  else if ((hRate >= 0.46 && hRate < 0.47) || (hRate > 0.53 && hRate <= 0.54)) hitsuji += 10;
  // 2. バランス率（上記スコアの半分を足す）
  hitsuji += hitsuji / 2;
  scores["ひつじ男子"] = Math.round(hitsuji);

  // ---- さる男子 ----
  let saru = 0;
  saru += Math.min(hiraganaRatio / 0.05, 1) * 15;
  saru += Math.min(emojiCountOther / totalMsgOther / 0.05, 1) * 20;
  saru += Math.min(shortRatio / 0.3, 1) * 10;
  saru += Math.min(exclQuesRatio / 0.12, 1) * 30;
  saru += Math.min(laughRatio / 0.1, 1) * 30;
  saru += Math.min(photoCountOther / totalMsgOther / 0.05, 1) * 15;
  if (saru > 99) saru = 99;
  scores["さる男子"] = Math.round(saru);

  // ---- とり男子 ----
  let tori = 0;
  tori += Math.min(shortRatio / 0.3, 1) * 10;
  // 返信速度標準偏差（疑似的に平均値利用、より高度にしたい場合は本物の標準偏差を算出推奨）
  const replyStd = behaviorData.replyStats?.[otherName]?.std || 3600; // 秒
  if (replyStd <= 3*3600) tori += 0;
  else if (replyStd <= 6*3600) tori += 10;
  else if (replyStd <= 12*3600) tori += 20;
  else if (replyStd <= 24*3600) tori += 30;
  else if (replyStd <= 48*3600) tori += 40;
  else tori += 50;
  // 無視率
  tori += Math.min(ignoreCountOther / totalMsgOther / 0.1, 1) * 10;
  // 写真率
  tori += Math.min(photoCountOther / totalMsgOther / 0.05, 1) * 10;
  // 深夜早朝率
  tori += Math.min(deepHourRatio / 0.1, 1) * 20;
  // 通話率
  tori += Math.min(callCountOther / totalMsgOther / 0.1, 1) * 30;
  if (tori > 98) tori = 98;
  scores["とり男子"] = Math.round(tori);

  // ---- いぬ男子 ----
  let inu = 0;
  // 平均返信速さ
  if (avgReplySecOther <= 3600) inu += 30;
  else if (avgReplySecOther <= 3*3600) inu += 25;
  else if (avgReplySecOther <= 6*3600) inu += 20;
  else if (avgReplySecOther <= 12*3600) inu += 15;
  else if (avgReplySecOther <= 24*3600) inu += 10;
  else if (avgReplySecOther <= 36*3600) inu += 10;
  else if (avgReplySecOther <= 48*3600) inu += 5;
  // 追いLINE率
  inu += Math.min((consecutiveOther / totalMsgOther) / 0.15, 1) * 10;
  // 愛情ワード
  inu += Math.min(loveWordCount / 5, 1) * 10;
  // 写真率
  inu += Math.min(photoCountOther / totalMsgOther / 0.15, 1) * 10;
  // 発言比率
  if ((hRate >= 0.495 && hRate <= 0.505)) inu += 40;
  else if ((hRate >= 0.49 && hRate < 0.495) || (hRate > 0.505 && hRate <= 0.51)) inu += 30;
  else if ((hRate >= 0.48 && hRate < 0.49) || (hRate > 0.51 && hRate <= 0.52)) inu += 20;
  else if ((hRate >= 0.47 && hRate < 0.48) || (hRate > 0.52 && hRate <= 0.53)) inu += 10;
  scores["いぬ男子"] = Math.round(inu);

  // ---- いのしし男子 ----
  let inoshishi = 0;
  // 1. 愛情ワード
  inoshishi += Math.min(loveWordCount / 40, 1) * 20;
  // 2. 平均返信速さ
  if (avgReplySecOther <= 3600) inoshishi += 30;
  else if (avgReplySecOther <= 3*3600) inoshishi += 25;
  else if (avgReplySecOther <= 6*3600) inoshishi += 20;
  else if (avgReplySecOther <= 12*3600) inoshishi += 15;
  else if (avgReplySecOther <= 24*3600) inoshishi += 10;
  else if (avgReplySecOther <= 36*3600) inoshishi += 10;
  else if (avgReplySecOther <= 48*3600) inoshishi += 5;
  // 3. 日別最大やり取り率
  if (over100Days >= 3) inoshishi += 50;
  else inoshishi += Math.min(maxMsgPerDay / totalMsgOther, 1) * 50;
  scores["いのしし男子"] = Math.round(inoshishi);

  // ---- 判定結果 ----
  let animalType = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

  return { animalType, scores };
}

module.exports = {
  calcZodiacTypeScores
};