// chartBuilder.js

// Chart.js の全コントローラ／スケールを自動登録
require('chart.js/auto');
// データラベルプラグインを登録
require('chartjs-plugin-datalabels');

const fs = require('fs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width  = 500;
const height = 500;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour: 'transparent'
});

/**
 * レーダーチャート画像を生成
 * @param {string[]} labels チャートの軸ラベル（日本語可）
 * @param {number[]}   scores 各軸のスコア
 * @param {string}     filename 出力ファイルパス
 */
async function generateRadarChart(labels, scores, filename = 'radar.png') {
  const config = {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: '相性スコア',
        data: scores,
        backgroundColor: 'rgba(255,182,193,0.4)',
        borderColor: 'rgba(255,105,180,1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255,105,180,1)'
      }]
    },
    options: {
      responsive: false,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: {
            stepSize: 20,
            color: '#555'
          },
          pointLabels: {
            color: '#444',
            font: { size: 14 }
          },
          grid: { color: '#ccc' },
          angleLines: { color: '#ccc' }
        }
      },
      plugins: {
        legend: { display: false },
        title:  { display: false },
        datalabels: {
          color: '#333',
          formatter: value => value,
          align: 'top',
          font: { size: 12 }
        }
      }
    }
  };

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config, 'image/png');
  fs.writeFileSync(filename, imageBuffer);
  return filename;
}

/**
 * 棒グラフ画像を生成
 * @param {string[]} labels      棒グラフの X 軸ラベル
 * @param {number[]} dataValues  各棒の値（配列長=labels長）
 * @param {string}   filename    出力ファイルパス
 */
async function generateBarChart(labels, dataValues, filename = 'bar.png') {
  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: dataValues,
        backgroundColor: labels.map(() => 'rgba(255,182,193,0.8)'),
        borderColor:     labels.map(() => 'rgba(255,105,180,1)'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: false,
      scales: {
        x: { ticks: { color: '#555' } },
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(...dataValues),
          ticks: { stepSize: 20, color: '#555' }
        }
      }
    }
  };

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config, 'image/png');
  fs.writeFileSync(filename, imageBuffer);
  return filename;
}

/**
 * 円グラフ画像を生成
 * @param {string[]} labels      セグメントのラベル
 * @param {number[]} dataValues  各セグメントの値
 * @param {string}   filename    出力ファイルパス
 */
async function generatePieChart(labels, dataValues, filename = 'pie.png') {
  const config = {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: dataValues,
        backgroundColor: labels.map(() => 'rgba(255,105,180,0.7)')
      }]
    },
    options: { responsive: false }
  };

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config, 'image/png');
  fs.writeFileSync(filename, imageBuffer);
  return filename;
}

module.exports = {
  generateRadarChart,
  generateBarChart,
  generatePieChart
};
