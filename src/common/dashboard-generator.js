'use strict';

function generateDashboardHtml(runs) {
  const total = runs.length;
  const imageCount = runs.filter((r) => r.imagePath).length;

  const byDate = {};
  runs.forEach((r) => {
    const d = r.timestamp.slice(0, 10);
    byDate[d] = (byDate[d] || 0) + 1;
  });
  const dateLabels = JSON.stringify(Object.keys(byDate));
  const dateCounts = JSON.stringify(Object.values(byDate));

  const rows = runs
    .slice()
    .reverse()
    .map(
      (r) => `
      <tr>
        <td>${r.timestamp.slice(0, 19).replace('T', ' ')}</td>
        <td>${r.topic || '-'}</td>
        <td>${(r.instagram || '').slice(0, 40)}…</td>
        <td>${r.imagePath ? '✅' : '—'}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI SNS 자동화 대시보드</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
  body { font-family: -apple-system, sans-serif; margin: 0; background: #f5f5f5; color: #222; }
  header { background: #1a1a2e; color: #fff; padding: 20px 40px; }
  h1 { margin: 0; font-size: 1.4rem; }
  .stats { display: flex; gap: 20px; padding: 24px 40px; }
  .card { background: #fff; border-radius: 8px; padding: 20px 28px; flex: 1; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  .card .num { font-size: 2.4rem; font-weight: 700; color: #1a1a2e; }
  .card .label { font-size: 0.85rem; color: #888; margin-top: 4px; }
  .chart-wrap { background: #fff; margin: 0 40px 24px; border-radius: 8px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.08); max-height: 280px; }
  table { width: calc(100% - 80px); margin: 0 40px 40px; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  th, td { padding: 12px 16px; text-align: left; font-size: 0.9rem; border-bottom: 1px solid #f0f0f0; }
  th { background: #1a1a2e; color: #fff; font-weight: 500; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafafa; }
</style>
</head>
<body>
<header><h1>AI SNS 자동화 대시보드</h1></header>
<div class="stats">
  <div class="card"><div class="num">${total}</div><div class="label">총 실행 횟수</div></div>
  <div class="card"><div class="num">${imageCount}</div><div class="label">이미지 생성 성공</div></div>
  <div class="card"><div class="num">${total - imageCount}</div><div class="label">이미지 생성 실패</div></div>
</div>
<div class="chart-wrap">
  <canvas id="chart"></canvas>
</div>
<table>
  <thead><tr><th>시각</th><th>주제</th><th>Instagram 미리보기</th><th>이미지</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#aaa;">실행 이력 없음</td></tr>'}</tbody>
</table>
<script>
new Chart(document.getElementById('chart'), {
  type: 'bar',
  data: {
    labels: ${dateLabels},
    datasets: [{ label: '일별 발행 수', data: ${dateCounts}, backgroundColor: '#4f46e5' }]
  },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
});
</script>
</body>
</html>`;
}

module.exports = { generateDashboardHtml };
