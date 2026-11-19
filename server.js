const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const validateItem = require('./js/validation');

const dataDir = path.resolve(process.env.PORTFOLIO_DATA_DIR || __dirname);
const dataFile = path.join(dataDir, 'portfolios.json');
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });

const assets = {
  '/': ['index.html', 'text/html'],
  '/index.html': ['index.html', 'text/html'],
  '/css/style.css': ['css/style.css', 'text/css'],
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

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const pathname = req.url.split('?')[0];

  try {
    const asset = Object.hasOwn(assets, pathname) && assets[pathname];
    if (asset && req.method === 'GET') {
      const [file, type] = asset;
      const content = fs.readFileSync(path.join(__dirname, file));
      res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
      return res.end(content);
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
