let portfolios = [];

function newId() {
  // getRandomValues works on the public HTTP address of the EC2 demo.
  return Array.from(crypto.getRandomValues(new Uint8Array(16)),
    byte => byte.toString(16).padStart(2, '0')).join('');
}

async function requestPortfolio(path = '', body) {
  const options = body === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
  const response = await fetch('/api/portfolios' + path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}

async function reloadPortfolios() {
  portfolios = await requestPortfolio();
  renderPortfolios();
  refreshPortfolioOptions();
}

function showStatus(area, message, isError = false) {
  area.className = 'alert ' + (isError ? 'alert-danger' : 'alert-success');
  area.textContent = message;
}

async function submitAction(button, area, action) {
  button.disabled = true;
  try {
    await action();
  } catch (error) {
    showStatus(area, error.message, true);
  } finally {
    button.disabled = false;
  }
}

function updatePortfolio(portfolio) {
  portfolios = portfolios.filter(entry => entry.id !== portfolio.id);
  portfolios.push(portfolio);
  renderPortfolios();
  refreshPortfolioOptions();
}

const portfolioForm = document.getElementById('portfolio-form');
portfolioForm.addEventListener('submit', event => {
  event.preventDefault();
  const status = document.getElementById('create-status');
  submitAction(event.submitter, status, async () => {
    const data = new FormData(portfolioForm);
    const portfolio = { id: newId(), items: [] };
    for (const key of ['name', 'enjoy', 'tried', 'curious']) {
      portfolio[key] = data.get(key).trim();
    }
    const saved = await requestPortfolio('', portfolio);
    updatePortfolio(saved);
    document.getElementById('portfolio-select').value = saved.id;
    portfolioForm.reset();
    showStatus(status, 'Saved ' + saved.name + ' to the server.');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('reload-portfolios');
  const status = document.getElementById('status-message');
  const reload = () => submitAction(button, status, async () => {
    await reloadPortfolios();
    showStatus(status, 'Portfolios loaded from the server.');
  });
  button.addEventListener('click', reload);
  reload();
});
