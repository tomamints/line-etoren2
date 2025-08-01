// debugBehavior.js
const fs = require('fs');
const path = require('path');
const { parseTLText, parseTLFileSync, extractParticipants } = require('./metrics/parser');
const { calcAll } = require('./metrics/behavior');

async function main() {
  // どちらを使うかコメントで切り替え
  // 1) テキストを直接パース
  const raw = fs.readFileSync(path.resolve(__dirname, 'sample_tl.txt'), 'utf8');
  const messages = parseTLText(raw);

  // 2) ファイルパスから直接パース
  // const messages = parseTLFileSync(path.resolve(__dirname, 'sample_tl.txt'));

  // 参加者を自動抽出（myName はログ内に含まれている自分の名前の一部を指定）
  const { self, other } = extractParticipants(messages, '水野就太');

  // 行動データを計算
  const behaviorData = await calcAll({ messages, selfName: self, otherName: other });

  console.log('— messages parsed:', messages.length);
  console.log('— participants:', { self, other });
  console.log('— behaviorData:', JSON.stringify(behaviorData, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
