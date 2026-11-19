const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');const filePath = path.join(__dirname, 'portfolios.json');

function loadPortfolios() {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/api/portfolios') {
    const portfolios = loadPortfolios();
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8'
    });
    response.end(JSON.stringify(portfolios));
    return;
  }
    if (request.method === 'POST' && request.url === '/api/portfolios') {
    let portfolio;

    try {
      const chunks = [];
      for await (const chunk of request) {
        chunks.push(chunk);
      }
      portfolio = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      response.writeHead(400);
      response.end('Invalid JSON');
      return;
    }

    const fields = ['id', 'name', 'enjoy', 'tried', 'curious'];
    const valid = fields.every(
      field => typeof portfolio?.[field] === 'string' && portfolio[field].trim()
    );

    if (!valid) {
      response.writeHead(400);
      response.end('Required portfolio fields are missing');
      return;
    }

    const portfolios = loadPortfolios();

    if (portfolios.some(saved => saved.id === portfolio.id)) {
      response.writeHead(409);
      response.end('Portfolio ID already exists');
      return;
    }

    const saved = { ...portfolio, items: [] };
    portfolios.push(saved);
    fs.writeFileSync(filePath, JSON.stringify(portfolios, null, 2));

    response.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(saved));
    return;
  }
  response.writeHead(404);
  response.end('Not found');
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Server running at http://127.0.0.1:3000');
});