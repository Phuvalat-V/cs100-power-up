function validatePortfolioItem(data) {
  const required = ['title','type','date','role','description'];
  for (const field of required) {
    if (typeof data[field] !== 'string' || !data[field].trim()) return `Please enter ${field}.`;
  }
  const date = data.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date + 'T00:00:00').toISOString().slice(0,10) !== date) return 'Please enter a valid date.';
  if (!Array.isArray(data.skills) || !data.skills.length) return 'Please enter at least one skill.';
  for (const key of ['whatIDid','whatILearned','challenge','nextStep']) {
    if (!data.reflection || typeof data.reflection[key] !== 'string' || !data.reflection[key].trim()) return `Please complete reflection: ${key}.`;
  }
  if (!Array.isArray(data.evidence) || !data.evidence.length) return 'Please enter at least one evidence URL.';
  for (const link of data.evidence) {
    try { const u = new URL(link); if (!['https:','http:'].includes(u.protocol) || !u.hostname.includes('.')) throw Error(); }
    catch { return `Invalid evidence URL: ${link}`; }
  }
  return null;
}
