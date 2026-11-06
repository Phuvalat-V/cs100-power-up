// Issue #1 - Add portfolio item to the selected portfolio.
// Depends on globals `portfolios`, `savePortfolios`, `renderPortfolios` from app.js.
function refreshPortfolioOptions() {
  const select = document.getElementById('portfolio-select');
  const selected = select.value;
  select.replaceChildren(new Option('Choose a portfolio', ''));
  portfolios.forEach(p => select.add(new Option(p.name, p.id)));
  if (portfolios.some(p => p.id === selected)) select.value = selected;
}
function showItemMessage(message, isError = false) {
  const area = document.getElementById('status-message');
  area.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
  area.textContent = message;
}
function readItemForm(form) {
  const d = new FormData(form);
  return {
    id: crypto.randomUUID(), title: String(d.get('title') || '').trim(),
    type: String(d.get('type') || '').trim(), date: String(d.get('date') || '').trim(),
    role: String(d.get('role') || '').trim(), description: String(d.get('description') || '').trim(),
    skills: String(d.get('skills') || '').split(',').map(x => x.trim()).filter(Boolean),
    reflection: {
      whatIDid: String(d.get('whatIDid') || '').trim(),
      whatILearned: String(d.get('whatILearned') || '').trim(),
      challenge: String(d.get('challenge') || '').trim(),
      nextStep: String(d.get('nextStep') || '').trim()
    },
    evidence: String(d.get('evidence') || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean)
  };
}
const itemForm = document.getElementById('item-form');
itemForm.addEventListener('submit', event => {
  event.preventDefault();
  const selectedId = document.getElementById('portfolio-select').value;
  const portfolio = portfolios.find(p => p.id === selectedId);
  if (!portfolio) return showItemMessage('Please select a portfolio.', true);
  const item = readItemForm(itemForm);
  const error = typeof validatePortfolioItem === 'function' ? validatePortfolioItem(item) : null;
  if (error) return showItemMessage(error, true);
  portfolio.items.push(item);
  try { savePortfolios(); }
  catch { portfolio.items.pop(); return showItemMessage('Unable to save in this browser.', true); }
  renderPortfolios();
  itemForm.reset();
  refreshPortfolioOptions();
  document.getElementById('portfolio-select').value = selectedId;
  showItemMessage(`Saved item "${item.title}" to ${portfolio.name}.`);
});
refreshPortfolioOptions();
// Update dropdown after the existing Create Portfolio handler completes.
portfolioForm.addEventListener('submit', () => queueMicrotask(refreshPortfolioOptions));