// Issue #2 - Replace the basic renderer with a detailed, safe DOM renderer.
// textContent prevents user-provided HTML from executing.
function renderPortfolios() {
  const list = document.getElementById('portfolio-list');
  list.replaceChildren();
  if (!portfolios.length) {
    const p = document.createElement('p'); p.className = 'text-muted';
    p.textContent = 'No portfolios yet. Create one above!'; list.append(p); return;
  }
  function element(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined) el.textContent = value;
    return el;
  }
  portfolios.forEach(p => {
    const col = element('div','col-md-6');
    const card = element('article','card h-100 shadow-sm');
    const body = element('div','card-body');
    body.append(element('h3','h5 card-title',p.name),
      element('p','',`Enjoy: ${p.enjoy}`), element('p','',`Tried: ${p.tried}`),
      element('p','',`Curious: ${p.curious}`),
      element('p','text-muted',`Learning Items: ${(p.items || []).length}`));
    (p.items || []).forEach(item => {
      const section = element('section','portfolio-item');
      section.append(element('h4','h6',item.title),
        element('p','mb-1',`${item.type} | ${item.date} | Role: ${item.role}`),
        element('p','mb-1',item.description),
        element('p','mb-1',`Skills: ${(item.skills || []).join(', ')}`));
      const reflection = item.reflection || {};
      for (const [label,key] of [['What I did','whatIDid'],['What I learned','whatILearned'],['Challenge','challenge'],['Next step','nextStep']])
        section.append(element('p','mb-1',`${label}: ${reflection[key] || ''}`));
      const links = element('div','mt-2');
      links.append(element('strong','', 'Evidence: '));
      (item.evidence || []).forEach((url,index) => {
        try { const parsed = new URL(url); if (!['https:','http:'].includes(parsed.protocol)) return; }
        catch { return; }
        const a = element('a','d-inline-block me-2',`Link ${index+1}`);
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; links.append(a);
      });
      section.append(links); body.append(section);
    });
    card.append(body); col.append(card); list.append(col);
  });
}
renderPortfolios();
