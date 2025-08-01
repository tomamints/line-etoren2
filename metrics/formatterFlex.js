// metrics/formatterFlex.js


function buildCompatibilityFlex({ selfName, otherName, radarScores, chartImageUrl }) {
 const getColor = (score) => {
   if (score >= 80) return '#FFB6C1';
   if (score >= 50) return '#FFDAB9';
   return '#FF9999';
 };


 const getEmoji = (score) => {
   if (score >= 80) return '🟢';
   if (score >= 50) return '🟡';
   return '🔴';
 };


 const scoreRows = Object.entries(radarScores).map(([label, score]) => {
   const labelMap = {
     time: '時間帯',
     balance: 'バランス',
     tempo: 'テンポ',
     type: 'タイプ',
     words: '言葉'
   };
   return {
     type: 'box',
     layout: 'horizontal',
     spacing: 'sm',
     contents: [
       { type: 'text', text: labelMap[label], flex: 3, size: 'sm', weight: 'regular' },
       { type: 'text', text: `${getEmoji(score)} ${score} 点`, flex: 4, size: 'sm', align: 'end', color: getColor(score) }
     ]
   };
 });


 return {
   type: 'flex',
   altText: '相性診断結果',
   contents: {
     type: 'bubble',
     size: 'mega',
     styles: {
       header: { backgroundColor: '#FFE4EC' },
       body:   { backgroundColor: '#FFF0F5' }
     },
     hero: {
       type: 'image',
       url: chartImageUrl || `${process.env.BASE_URL}/images/bg-cute.jpg`,
       size: 'full',
       aspectRatio: '1:1',
       aspectMode: 'cover'
     },
     header: {
       type: 'box',
       layout: 'vertical',
       contents: [
         { type: 'text', text: '💘 相性診断レポート 💘', align: 'center', weight: 'bold', size: 'lg', color: '#D63384' },
         { type: 'text', text: `${selfName} と ${otherName}`, align: 'center', size: 'sm', color: '#888888' }
       ]
     },
     body: {
       type: 'box',
       layout: 'vertical',
       spacing: 'md',
       paddingAll: '12px',
       contents: [
         { type: 'text', text: '5つの観点から診断したよ📊', size: 'sm', color: '#555555', align: 'center' },
         { type: 'separator', margin: 'md' },
         ...scoreRows,
         { type: 'separator', margin: 'md' },
         { type: 'text', text: '気になるところはチェックしてみてね💡', size: 'xs', color: '#999999', align: 'center', margin: 'md' }
       ]
     }
   }
 };
}


module.exports = { buildCompatibilityFlex };
