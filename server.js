const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const validateItem = require('./js/validation');

const dataDir = path.resolve(process.env.PORTFOLIO_DATA_DIR || __dirname);
const dataFile = path.join(dataDir, 'portfolios.json');
const resultsDir = path.join(dataDir, 'challenge-results');
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });

const assets = {
  '/': ['index.html', 'text/html'],
  '/index.html': ['index.html', 'text/html'],
  '/css/style.css': ['css/style.css', 'text/css'],
  '/challenge/': ['challenge/index.html', 'text/html'],
  '/challenge/style.css': ['challenge/style.css', 'text/css'],
  '/challenge/game.js': ['challenge/game.js', 'text/javascript'],
  '/challenge/scene.js': ['challenge/scene.js', 'text/javascript'],
  '/challenge/fonts/thai-regular.ttf': ['challenge/fonts/thai-regular.ttf', 'font/ttf'],
  '/challenge/fonts/thai-bold.ttf': ['challenge/fonts/thai-bold.ttf', 'font/ttf'],
};
for (const name of ['samples', 'validation', 'app', 'show-items', 'add-item', 'exchange']) {
  assets['/js/' + name + '.js'] = ['js/' + name + '.js', 'text/javascript'];
}

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readPortfolios() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function writePortfolios(portfolios) {
  const temp = path.join(dataDir, '.portfolios-' + randomUUID() + '.tmp');
  try {
    fs.writeFileSync(temp, JSON.stringify(portfolios, null, 2), { mode: 0o600, flag: 'wx' });
    fs.renameSync(temp, dataFile);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

async function readJSON(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') {
    throw new RequestError(415, 'Expected application/json.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 65536) {
      req.resume();
      throw new RequestError(413, 'JSON is too large.');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'Invalid JSON.');
  }
}

function validatePortfolio(portfolio) {
  for (const field of ['id', 'name', 'enjoy', 'tried', 'curious']) {
    if (typeof portfolio?.[field] !== 'string' || !portfolio[field].trim()) {
      throw new RequestError(400, 'Please enter ' + field + '.');
    }
  }
  if (portfolio.items === undefined) portfolio.items = [];
  if (!Array.isArray(portfolio.items)) throw new RequestError(400, 'Expected an items array.');
  const ids = new Set();
  for (const item of portfolio.items) {
    const error = validateItem(item);
    if (error) throw new RequestError(400, error);
    if (ids.has(item.id)) throw new RequestError(409, 'This item ID already exists in the portfolio.');
    ids.add(item.id);
  }
}

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

function saveChallengeResult(incoming) {
  const alias = typeof incoming?.alias === 'string' ? incoming.alias.trim() : '';
  if (!alias || alias.length > 60) throw new RequestError(400, 'Expected a player nickname.');
  // Three five-point scenes and eight logo questions in the booth challenge.
  const limits = { found: [15, 15], correct: [0, 8], spotSeconds: [0, 86400], colorSeconds: [0, 86400] };
  const result = { alias };
  for (const [field, [min, max]] of Object.entries(limits)) {
    const value = incoming[field];
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RequestError(400, 'Invalid ' + field + '.');
    }
    result[field] = value;
  }
  const id = randomUUID();
  fs.mkdirSync(resultsDir, { recursive: true, mode: 0o700 });
  const temp = path.join(resultsDir, '.' + id + '.tmp');
  try {
    fs.writeFileSync(temp, JSON.stringify(result), { mode: 0o600, flag: 'wx' });
    fs.renameSync(temp, path.join(resultsDir, id + '.json'));
  } finally {
    fs.rmSync(temp, { force: true });
  }
  return id;
}

function renderChallengeResult(res, id) {
  let result;
  try {
    result = JSON.parse(fs.readFileSync(path.join(resultsDir, id + '.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new RequestError(404, 'ไม่พบผลการเล่น');
    throw error;
  }
  const escaped = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  const alias = result.alias.replace(/[&<>]/g, char => escaped[char]);
  const time = seconds => [Math.floor(seconds / 60), seconds % 60]
    .map(part => String(part).padStart(2, '0')).join(':');

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  });
  res.end(`<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ผลการเล่นตาไว! | CS100</title>
  <link rel="stylesheet" href="/challenge/style.css">
</head>
<body>
  <main class="evidence-page">
    <section class="game-board evidence-card">
      <h1>ผลการเล่นตาไว!</h1>
      <p>ผู้เล่น <strong>${alias}</strong></p>
      <dl>
        <dt>จับผิดภาพ</dt>
        <dd>เจอ ${result.found} / 15 จุด · เวลา ${time(result.spotSeconds)}</dd>
        <dt>จำสีโลโก้</dt>
        <dd>ตอบถูก ${result.correct} / 8 ข้อ · เวลา ${time(result.colorSeconds)}</dd>
      </dl>
      <a class="button" href="/challenge/">ไปหน้าเกมตาไว!</a>
    </section>
  </main>
</body>
</html>`);
}

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const pathname = req.url.split('?')[0];

  try {
    if (pathname === '/challenge' && req.method === 'GET') {
      res.writeHead(308, { Location: '/challenge/' });
      return res.end();
    }

    const asset = Object.hasOwn(assets, pathname) && assets[pathname];
    if (asset && req.method === 'GET') {
      const [file, type] = asset;
      const content = fs.readFileSync(path.join(__dirname, file));
      res.writeHead(200, { 'Content-Type': type.startsWith('text/') ? type + '; charset=utf-8' : type });
      return res.end(content);
    }

    if (pathname === '/api/challenge-results' && req.method === 'POST') {
      return json(res, 201, { id: saveChallengeResult(await readJSON(req)) });
    }
    const challengeResult = /^\/challenge\/results\/([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/.exec(pathname);
    if (challengeResult && req.method === 'GET') {
      return renderChallengeResult(res, challengeResult[1]);
    }

    if (pathname === '/api/portfolios' && req.method === 'GET') {
      return json(res, 200, readPortfolios());
    }
    if (pathname === '/api/portfolios' && req.method === 'POST') {
      const incoming = await readJSON(req);
      validatePortfolio(incoming);
      const portfolios = readPortfolios();
      const existing = portfolios.find(portfolio => portfolio.id === incoming.id);
      if (existing) {
        const same = JSON.stringify(existing) === JSON.stringify(incoming);
        if (same) return json(res, 200, existing);
        throw new RequestError(409, 'This portfolio ID already exists.');
      }
      portfolios.push(incoming);
      writePortfolios(portfolios);
      return json(res, 201, incoming);
    }

    const match = /^\/api\/portfolios\/([^/]+)\/items$/.exec(pathname);
    if (match && req.method === 'POST') {
      const id = decodeURIComponent(match[1]);
      const item = await readJSON(req);
      const error = validateItem(item);
      if (error) throw new RequestError(400, error);
      const portfolios = readPortfolios();
      const portfolio = portfolios.find(entry => entry.id === id);
      if (!portfolio) throw new RequestError(404, 'Portfolio not found.');
      if (portfolio.items.some(entry => entry.id === item.id)) {
        throw new RequestError(409, 'This item ID already exists in the portfolio.');
      }
      portfolio.items.push(item);
      writePortfolios(portfolios);
      return json(res, 201, portfolio);
    }

    return json(res, 404, { error: 'Not found.' });
  } catch (error) {
    if (error instanceof URIError) return json(res, 400, { error: 'Invalid portfolio ID.' });
    if (!error.status) console.error(error);
    return json(res, error.status || 500, { error: error.status ? error.message : 'Server could not complete the request.' });
  }
}).listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => {
  console.log('Portfolio server ready on port ' + (process.env.PORT || 3000));
});
