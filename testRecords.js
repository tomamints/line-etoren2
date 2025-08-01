// testRecords.js
const path    = require('path');
const parser  = require('./metrics/parser');
const records = require('./metrics/records');

// (1) sample_tl.txt をパースする
const samplePath = path.resolve(__dirname, 'sample_tl.txt');
const messages   = parser.parseTLFileSync(samplePath);

// (2) 「自分」の名前を指定して participants を取る
//     —— ここは実際のあなたの LINE 表示名を一部でかまわないので渡してください
const participants = parser.extractParticipants(messages, 'しゅーた');
console.log('participants:', participants);

// (3) calcAll の呼び出し
const result = records.calcAll({
  messages,
  selfName:  participants.self,
  otherName: participants.other
});

console.log('===== calcAll の戻り値 =====');
console.dir(result, { depth: null });
console.log('============================');
