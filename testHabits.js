const path   = require('path');
const parser = require('./metrics/parser');
const habits = require('./metrics/habits');

const logPath = path.join(__dirname, 'sample_tl.txt');

// (1) ファイルを読み込んでパース
const messages = parser.parseTLFileSync(logPath);
console.log('■ 読み込んだメッセージ数:', messages.length);

// (2) 参加者を推定
const { self, other } = parser.extractParticipants(
  messages,
  '水野就太（ダニエル)'  // ログに出ている自分の名前を部分一致で指定
);
console.log('participants:', { self, other });

// (3) habitsモジュールで集計
const result = habits.calcAll({
  messages,
  selfName:   self,
  otherName:  other
});
console.log('===== habits.calcAll の戻り値 =====');
console.log(JSON.stringify(result, null, 2));