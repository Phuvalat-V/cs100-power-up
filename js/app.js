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

function renderPortfolios() {
  portfolioList.innerHTML = "";

  if (portfolios.length === 0) {
    portfolioList.innerHTML = `
      <div class="col-12">
        <p class="text-muted">No portfolios yet. Create one above!</p>
      </div>
    `;
    return;
  }

  portfolios.forEach(function (portfolio) {
    const column = document.createElement("div");
    column.className = "col-md-6 col-lg-4";

    const card = document.createElement("div");
    card.className = "card h-100 shadow-sm";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const name = document.createElement("h3");
    name.className = "h5 card-title";
    name.textContent = portfolio.name;

    const enjoy = document.createElement("p");
    enjoy.textContent = "Enjoy: " + portfolio.enjoy;

    const tried = document.createElement("p");
    tried.textContent = "Tried: " + portfolio.tried;

    const curious = document.createElement("p");
    curious.textContent = "Curious: " + portfolio.curious;

    const itemCount = document.createElement("p");
    itemCount.className = "text-muted";
    itemCount.textContent =
      "Learning Items: " + portfolio.items.length;

    cardBody.append(name, enjoy, tried, curious, itemCount);
    card.appendChild(cardBody);
    column.appendChild(card);
    portfolioList.appendChild(column);
  });
}
renderPortfolios();