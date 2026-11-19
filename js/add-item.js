function refreshPortfolioOptions() {
  for (const id of ['portfolio-select', 'import-portfolio']) {
    fillPortfolioSelect(document.getElementById(id));
  }
}

function fillPortfolioSelect(select) {
  const selected = select.value;
  select.replaceChildren(new Option('Choose a portfolio', ''));
  portfolios.forEach(p => select.add(new Option(p.name, p.id)));
  if (portfolios.some(p => p.id === selected)) select.value = selected;
}
function readItemForm(form) {
  const d = new FormData(form);
  return {
    id: newId(), title: String(d.get('title') || '').trim(),
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
  const status = document.getElementById('item-status');
  submitAction(event.submitter, status, async () => {
    const select = document.getElementById('portfolio-select');
    const selectedId = select.value;
    const item = readItemForm(itemForm);
    const error = validatePortfolioItem(item);
    if (error) throw new Error(error);
    const portfolio = await saveItem(selectedId, item);
    itemForm.reset();
    select.value = selectedId;
    showStatus(status, 'Saved "' + item.title + '" to ' + portfolio.name + '.');
  });
});

async function saveItem(portfolioId, item) {
  if (!portfolioId) throw new Error('Please select the destination portfolio.');
  const portfolio = await requestPortfolio('/' + encodeURIComponent(portfolioId) + '/items', item);
  updatePortfolio(portfolio);
  return portfolio;
}
