const hostForm = document.getElementById('host-form');
const hostOutput = document.getElementById('host-output');
const hostJSON = document.getElementById('host-json');
const hostStatus = document.getElementById('host-status');

const gameResult = new URLSearchParams(window.location.search);
const gameTitles = new Map([
  ['spot', 'ตาไว! — จับผิดภาพ'],
  ['color', 'ตาไว! — จำสีโลโก้']
]);
const gameTitle = gameTitles.get(gameResult.get('game'));
if (gameTitle) {
  hostForm.elements.title.value = gameTitle;
  hostForm.elements.result.value = (gameResult.get('result') || '').slice(0, 500);
}

hostForm.addEventListener('input', () => {
  hostOutput.hidden = true;
  hostStatus.textContent = '';
  hostStatus.className = '';
});

hostForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(hostForm);
  const alias = data.get('alias').trim();
  const title = data.get('title').trim();
  const result = data.get('result').trim();
  const skills = data.get('skills').split(',').map(skill => skill.trim()).filter(Boolean);
  if (!alias || !result) {
    return showStatus(hostStatus, 'กรอกชื่อเล่นและผลของผู้เข้าร่วม', true);
  }
  const now = new Date();
  const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const item = {
    id: newId(),
    title,
    type: 'Challenge',
    date,
    role: 'Participant',
    description: alias + ' — ' + result,
    skills,
    reflection: {
      whatIDid: result,
      whatILearned: data.get('learned').trim(),
      challenge: data.get('challenge').trim(),
      nextStep: data.get('next').trim()
    },
    evidence: [data.get('evidence').trim()],
    hostGroup: 'Phuvalat-V/cs100-power-up',
    schemaVersion: '1.0'
  };
  const error = validatePortfolioItem(item);
  if (error) return showStatus(hostStatus, error, true);
  hostJSON.value = JSON.stringify(item, null, 2);
  hostOutput.hidden = false;
  showStatus(hostStatus, 'Item ready. Ask the participant to review the reflection after import.');
});

document.getElementById('copy-item').addEventListener('click', async () => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(hostJSON.value);
    } else {
      hostJSON.focus();
      hostJSON.select();
      if (!document.execCommand('copy')) throw new Error();
    }
    showStatus(hostStatus, 'Item JSON copied.');
  } catch {
    hostJSON.focus();
    hostJSON.select();
    showStatus(hostStatus, 'JSON selected. Use Ctrl+C or Command+C to copy.', true);
  }
});

const importJSON = document.getElementById('import-json');
const importForm = document.getElementById('import-form');
const importStatus = document.getElementById('import-status');
const reflectionLabels = {
  whatIDid: 'What I Did',
  whatILearned: 'What I Learned',
  challenge: 'What Was Challenging',
  nextStep: 'Next Step'
};
let importedItem;

for (const [key, label] of Object.entries(reflectionLabels)) {
  const wrapper = document.createElement('div');
  wrapper.className = 'mb-2';
  const field = document.createElement('textarea');
  field.id = 'import-' + key;
  field.name = key;
  field.className = 'form-control';
  field.required = true;
  const caption = document.createElement('label');
  caption.htmlFor = field.id;
  caption.className = 'form-label';
  caption.textContent = label;
  wrapper.append(caption, field);
  document.getElementById('import-reflection').append(wrapper);
}

importJSON.addEventListener('input', () => {
  importForm.hidden = true;
  importedItem = undefined;
  importStatus.textContent = '';
  importStatus.className = '';
});

document.getElementById('preview-item').addEventListener('click', () => {
  let item;
  try {
    item = JSON.parse(importJSON.value);
  } catch {
    return showStatus(importStatus, 'Invalid JSON. Paste the complete item and try again.', true);
  }
  const error = validatePortfolioItem(item, { draftReflection: true });
  if (error) return showStatus(importStatus, error, true);
  importedItem = item;
  document.getElementById('import-title').textContent = item.title;
  document.getElementById('import-description').textContent = item.description;
  const evidence = document.getElementById('import-evidence');
  evidence.replaceChildren();
  item.evidence.forEach((url, index) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'me-3';
    link.textContent = 'Evidence ' + (index + 1);
    evidence.append(link);
  });
  for (const key of Object.keys(reflectionLabels)) {
    importForm.elements[key].value = item.reflection[key];
  }
  importForm.hidden = false;
  showStatus(importStatus, 'Review the evidence and write your reflection before saving.');
});

importForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!importedItem) return;
  submitAction(event.submitter, importStatus, async () => {
    const reflection = {};
    for (const key of Object.keys(reflectionLabels)) {
      reflection[key] = importForm.elements[key].value.trim();
    }
    const item = { ...importedItem, reflection };
    const error = validatePortfolioItem(item);
    if (error) throw new Error(error);
    const portfolio = await saveItem(document.getElementById('import-portfolio').value, item);
    importJSON.value = '';
    importedItem = undefined;
    importForm.hidden = true;
    showStatus(importStatus, 'Saved "' + item.title + '" to ' + portfolio.name + '.');
  });
});

function exportPortfolio(id, button) {
  const status = document.getElementById('status-message');
  submitAction(button, status, async () => {
    const entries = await requestPortfolio();
    const portfolio = entries.find(entry => entry.id === id);
    if (!portfolio) throw new Error('Portfolio not found. Reload the list and try again.');
    const blob = new Blob([JSON.stringify(portfolio, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-portfolio.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus(status, 'Exported ' + portfolio.name + ' as my-portfolio.json.');
  });
}
