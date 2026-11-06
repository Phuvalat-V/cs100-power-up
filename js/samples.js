const SAMPLE_PORTFOLIOS = [
  {
    "id": "p-sample-1",
    "name": "Nok (Demo)",
    "enjoy": "Designing websites",
    "tried": "Built a website and a club poster",
    "curious": "Browser storage",
    "items": [
      {
        "id": "item001",
        "title": "My First Website",
        "type": "Course Assignment",
        "date": "2026-10-18",
        "role": "Developer",
        "description": "Created a personal website with HTML and CSS",
        "skills": [
          "HTML",
          "CSS"
        ],
        "reflection": {
          "whatIDid": "Built the website",
          "whatILearned": "Responsive design",
          "challenge": "Mobile layout",
          "nextStep": "Improve the design"
        },
        "evidence": [
          "https://example.com/my-first-website"
        ]
      },
      {
        "id": "item002",
        "title": "Club Poster",
        "type": "Club Activity",
        "date": "2026-09-12",
        "role": "Designer",
        "description": "Designed a poster for a club event",
        "skills": [
          "Canva",
          "Typography"
        ],
        "reflection": {
          "whatIDid": "Created three layouts",
          "whatILearned": "Contrast and spacing",
          "challenge": "Fitting event details",
          "nextStep": "Try grid layouts"
        },
        "evidence": [
          "https://example.com/club-poster"
        ]
      }
    ]
  },
  {
    "id": "p-sample-2",
    "name": "Mint (Demo)",
    "enjoy": "Programming and photography",
    "tried": "Made a calculator and photo story",
    "curious": "Building interactive apps",
    "items": [
      {
        "id": "item003",
        "title": "JavaScript Calculator",
        "type": "Course Assignment",
        "date": "2026-10-20",
        "role": "Developer",
        "description": "Built a simple calculator",
        "skills": [
          "JavaScript",
          "HTML"
        ],
        "reflection": {
          "whatIDid": "Implemented calculations",
          "whatILearned": "DOM events",
          "challenge": "Handling invalid inputs",
          "nextStep": "Add keyboard support"
        },
        "evidence": [
          "https://example.com/calculator"
        ]
      },
      {
        "id": "item004",
        "title": "Photo Story",
        "type": "Personal Project",
        "date": "2026-10-22",
        "role": "Photographer",
        "description": "Created a themed photo series",
        "skills": [
          "Photography",
          "Editing"
        ],
        "reflection": {
          "whatIDid": "Selected and edited photographs",
          "whatILearned": "Visual storytelling",
          "challenge": "Consistent lighting",
          "nextStep": "Build an online gallery"
        },
        "evidence": [
          "https://example.com/photo-story"
        ]
      }
    ]
  }
];

// Issue #3 - Load sample portfolios. No fetch required: works via file:// too.
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('load-samples').addEventListener('click', () => {
    const ids = new Set(portfolios.map(p => p.id));
    let added = 0;
    SAMPLE_PORTFOLIOS.forEach(p => {
      if (!ids.has(p.id)) { portfolios.push(JSON.parse(JSON.stringify(p))); added++; }
    });
    try { savePortfolios(); }
    catch { alert('Could not save samples in this browser.'); return; }
    renderPortfolios();
    if (typeof refreshPortfolioOptions === 'function') refreshPortfolioOptions();
    const status = document.getElementById('status-message');
    status.className = 'alert alert-info';
    status.textContent = added ? `Loaded ${added} demo portfolio(s).` : 'Demo portfolios already loaded.';
  });
});
