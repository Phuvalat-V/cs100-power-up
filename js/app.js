const STORAGE_KEY = "cs100-portfolios";

let portfolios = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]"
);

function savePortfolios() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(portfolios)
  );
}

function createPortfolio(name, enjoy, tried, curious) {
  const portfolio = {
    id: crypto.randomUUID(),
    name: name,
    enjoy: enjoy,
    tried: tried,
    curious: curious,
    items: []
  };

  portfolios.push(portfolio);
  savePortfolios();

  return portfolio;
}

const portfolioForm = document.getElementById("portfolio-form");

portfolioForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("portfolio-name").value.trim();
  const enjoy = document.getElementById("portfolio-enjoy").value.trim();
  const tried = document.getElementById("portfolio-tried").value.trim();
  const curious = document.getElementById("portfolio-curious").value.trim();

  if (!name || !enjoy || !tried || !curious) {
    alert("Please fill in all fields.");
    return;
  }

  const newPortfolio = createPortfolio(name, enjoy, tried, curious);

    renderPortfolios();

  console.log("Portfolio created:", newPortfolio);
  alert("Portfolio created successfully!");

  portfolioForm.reset();
});

const portfolioList = document.getElementById("portfolio-list");