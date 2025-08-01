// testBehavior.js
const parser   = require('./metrics/parser');
const behavior = require('./metrics/behavior');
const fs       = require('fs');
const path     = require('path');

(async () => {
  // チャットログをパース
  const rawText  = fs.readFileSync(path.join(__dirname, 'sample_tl.txt'), 'utf8');
  const messages = parser.parseTLText(rawText);

  // 「ログに出てくる自分の表示名」を渡す
  const participants = parser.extractParticipants(messages, '水野就太（ダニエル)');
  const selfName  = participants.self;   // → '水野就太（ダニエル)'
  const otherName = participants.other;  // → 'ことは（6/4）'

  console.log('participants:', participants);

  // behavior.calcAll は async なので await する
  const result = await behavior.calcAll({ messages, selfName, otherName });
  console.log('===== calcAll (behavior) の戻り値 =====');
  console.log(JSON.stringify(result, null, 2));
})();
