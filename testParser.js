// testParser.js
const parser = require('./metrics/parser');
const fs     = require('fs');
const path   = require('path');

// いつものようにチャットログファイルを読み込む
const rawText  = fs.readFileSync(path.join(__dirname, 'sample_tl.txt'), 'utf8');
const parsed   = parser.parseTLFileSync(path.join(__dirname, 'sample_tl.txt'));

// ここでは「ログ上に出てくる自分の表示名」を直接渡します。
// 例）ログ中の sender に "水野就太（ダニエル)" が出てくるので、これを myName として渡す
const participants = parser.extractParticipants(parsed, '水野就太（ダニエル)');
console.log('===== extractParticipants の戻り値 =====');
console.log(participants);

console.log('===== parseTLFileSync の戻り値（先頭5件） =====');
console.log(parsed.slice(0, 5));
console.log('===== 全メッセージ件数 =====');
console.log(parsed.length);
