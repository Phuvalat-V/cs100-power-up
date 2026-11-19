"use strict";

const $ = (id) => document.getElementById(id);
const canvases = [...document.querySelectorAll(".pictures canvas")];
const backgroundCanvases = canvases.map(() => {
  const canvas = document.createElement("canvas");
  canvas.width = pictureWidth;
  canvas.height = pictureHeight;
  return canvas;
});
const buttons = { spot: $("tab-spot"), color: $("tab-color") };
const colorNames = {
  yellow: "สีเหลือง", red: "สีแดง", green: "สีเขียว", blue: "สีน้ำเงิน",
  orange: "สีส้ม", pink: "สีชมพู", purple: "สีม่วง", black: "สีดำ",
};
const logos = [
  { id: "mcd", brand: "McDonald’s", part: "ซุ้มรูปตัว M", answer: "yellow", ink: "#ffc72c" },
  { id: "walmart", brand: "Walmart", part: "เครื่องหมายแฉก", answer: "yellow", ink: "#ffc220" },
  { id: "youtube", brand: "YouTube", part: "พื้นหลังของปุ่มเล่น", answer: "red", ink: "#ff0033" },
  { id: "spotify", brand: "Spotify", part: "วงกลมของโลโก้แบบสี", answer: "green", ink: "#1ed760" },
  { id: "netflix", brand: "Netflix", part: "ตัว N", answer: "red", ink: "#e50914" },
  { id: "facebook", brand: "Facebook", part: "วงกลมรอบตัว f", answer: "blue", ink: "#0866ff" },
  { id: "line", brand: "LINE", part: "พื้นหลังรอบกล่องข้อความ", answer: "green", ink: "#06c755" },
  { id: "ikea", brand: "IKEA", part: "วงรีด้านหลังชื่อ IKEA", answer: "yellow", ink: "#ffda1a" },
];
const colorQuestionsCount = logos.length;

function shuffle(values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

function freshGame(mode) {
  const game = { round: 0, elapsed: 0, startedAt: null, done: false, feedback: "", tone: "" };
  if (mode === "spot") {
    game.rounds = scenes.map(() => ({ found: [], misses: 0, hints: [], cursor: null, miss: null }));
  } else {
    game.questions = shuffle(logos).map((logo) => {
      const distractors = shuffle(Object.keys(colorNames).filter((color) => color !== logo.answer)).slice(0, 3);
      return { ...logo, options: shuffle([logo.answer, ...distractors]), selected: null };
    });
  }
  return game;
}

let mode = "spot";
let games = { spot: freshGame("spot"), color: freshGame("color") };
let cachedScene = null;
let missTimeout;
const activeGame = () => games[mode];

function elapsed(game) {
  return game.elapsed + (game.startedAt === null ? 0 : performance.now() - game.startedAt);
}

function startTimer(game) {
  if (game.startedAt === null && !game.done) game.startedAt = performance.now();
}

function pauseTimer(game) {
  game.elapsed = elapsed(game);
  game.startedAt = null;
}

function timeLabel(ms) {
  const seconds = Math.floor(ms / 1000);
  const pad = (number) => String(number).padStart(2, "0");
  return pad(Math.floor(seconds / 60)) + ":" + pad(seconds % 60);
}

function updateTimer() {
  $("timer").textContent = timeLabel(elapsed(activeGame()));
}

function setFeedback(message, tone = "") {
  const game = activeGame();
  game.feedback = message;
  game.tone = tone;
  paintFeedback();
}

function paintFeedback() {
  const { feedback, tone } = activeGame();
  $("status").textContent = feedback;
  $("status").dataset.tone = tone;
}

function correctColors(game) {
  return game.questions.filter((question) => question.selected === question.answer).length;
}

function roundSpot() {
  return activeGame().rounds[activeGame().round];
}

function progress() {
  const game = activeGame();
  const isSpot = mode === "spot";
  const max = isSpot ? scenes[game.round].differences.length : colorQuestionsCount;
  const value = isSpot ? roundSpot().found.length : correctColors(game);
  $("score-label").textContent = isSpot ? "จุดที่เจอในด่านนี้" : "ตอบถูก";
  $("score").textContent = value;
  $("score-max").textContent = "/ " + max;
  $("progress").setAttribute("aria-valuemax", max);
  $("progress").setAttribute("aria-valuenow", value);
  $("progress").firstElementChild.style.width = (100 * value / max) + "%";
  if (isSpot) {
    const hints = 2 - roundSpot().hints.length;
    $("hint-left").textContent = hints;
    $("hint").disabled = game.done || hints === 0 || value === max;
    $("hint").setAttribute("aria-label", "ใบ้ตำแหน่ง เหลือ " + hints + " ครั้ง");
  }
}

function drawMarker(ctx, x, y, radius, color, kind) {
  ctx.save();
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  if (kind === "check") {
    const labelX = x + radius * .7;
    const labelY = y - radius * .7;
    ctx.beginPath();
    ctx.arc(labelX, labelY, 9, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(labelX - 4, labelY);
    ctx.lineTo(labelX - 1, labelY + 3);
    ctx.lineTo(labelX + 4, labelY - 3);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#244435";
    ctx.stroke();
  }
  if (kind === "cross") {
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.moveTo(x + 4, y - 4);
    ctx.lineTo(x - 4, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

function paintSpot() {
  const game = activeGame();
  const scene = scenes[game.round];
  const round = roundSpot();
  if (cachedScene !== scene) {
    backgroundCanvases.forEach((canvas, index) => paintScene(canvas, scene, index === 1));
    cachedScene = scene;
  }
  canvases.forEach((canvas, index) => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, pictureWidth, pictureHeight);
    ctx.drawImage(backgroundCanvases[index], 0, 0);
    for (const id of round.hints) {
      if (round.found.includes(id)) continue;
      const point = scenePoint(scene, id);
      drawMarker(ctx, point.x, point.y, point.radius + 4, "#ffe179");
    }
    for (const id of round.found) {
      const point = scenePoint(scene, id);
      drawMarker(ctx, point.x, point.y, point.radius, "#d9f5b0", "check");
    }
    if (round.miss?.index === index) {
      drawMarker(ctx, round.miss.x, round.miss.y, 10, "#ff7859", "cross");
    }
    if (round.cursor?.index === index) {
      drawMarker(ctx, round.cursor.x, round.cursor.y, 9, "#fff");
      drawMarker(ctx, round.cursor.x, round.cursor.y, 6, "#29251f");
    }
  });
}

function paintColors() {
  const game = activeGame();
  const question = game.questions[game.round];
  $("color-instruction").textContent = "ในโลโก้ " + question.brand + " " + question.part + " เป็นสีอะไร?";
  const mark = $("logo-mark");
  mark.dataset.logo = question.id;
  mark.dataset.revealed = String(question.selected !== null);
  mark.style.setProperty("--logo-ink", question.ink);
  mark.replaceChildren();
  const characters = { netflix: "N", facebook: "f", line: "LINE", ikea: "IKEA" };
  if (question.id === "walmart") {
    for (let angle = 0; angle < 360; angle += 60) {
      const ray = document.createElement("span");
      ray.style.setProperty("--angle", angle + "deg");
      mark.append(ray);
    }
  } else if (question.id === "spotify") {
    mark.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
  } else {
    mark.textContent = characters[question.id] ?? "";
  }
  const choices = question.options.map((option) => {
    const button = document.createElement("button");
    button.className = "button";
    button.type = "button";
    button.textContent = colorNames[option];
    button.disabled = Boolean(question.selected);
    if (question.selected && option === question.answer) button.dataset.result = "correct";
    if (question.selected === option && option !== question.answer) button.dataset.result = "wrong";
    button.addEventListener("click", () => answerColor(option));
    return button;
  });
  $("choices").replaceChildren(...choices);
}

function roundComplete(game) {
  return mode === "spot"
    ? roundSpot().found.length === scenes[game.round].differences.length
    : game.questions[game.round].selected !== null;
}

function updateNext() {
  const game = activeGame();
  $("next-round").hidden = game.done || !roundComplete(game);
  const last = game.round === (mode === "spot" ? scenes.length : colorQuestionsCount) - 1;
  $("next-round").textContent = last ? "ดูผลการเล่น" : mode === "spot" ? "ด่านถัดไป" : "ข้อถัดไป";
}

function gameName(kind) {
  return kind === "spot" ? "จับผิดภาพ" : "จำสีโลโก้";
}

function summary(kind, game) {
  if (kind === "spot") {
    const found = game.rounds.reduce((total, round) => total + round.found.length, 0);
    return "เจอ " + found + " จุดใน " + scenes.length + " ด่าน · เวลา " + timeLabel(elapsed(game));
  }
  return "ตอบถูก " + correctColors(game) + " จาก " + colorQuestionsCount + " ข้อ · เวลา " + timeLabel(elapsed(game));
}

function renderGame() {
  const game = activeGame();
  const isSpot = mode === "spot";
  $("board").dataset.game = mode;
  for (const [kind, button] of Object.entries(buttons)) button.setAttribute("aria-pressed", String(kind === mode));
  $("game-chip").textContent = gameName(mode);
  $("spot-play").hidden = !isSpot || game.done;
  $("color-play").hidden = isSpot || game.done;
  $("play-footer").hidden = game.done;
  $("hint").hidden = !isSpot || game.done;
  $("restart").hidden = game.done;
  $("result").hidden = !game.done;
  $("round").textContent = game.done ? "ผลการเล่น" : isSpot
    ? "ด่าน " + (game.round + 1) + " / " + scenes.length
    : "ข้อ " + (game.round + 1) + " / " + colorQuestionsCount;
  $("game-title").textContent = game.done ? "สรุปคะแนน" : isSpot
    ? scenes[game.round].name
    : game.questions[game.round].brand;
  if (game.done) {
    $("result-summary").textContent = summary(mode, game);
    const params = new URLSearchParams({ game: mode, result: summary(mode, game) });
    $("use-result").href = "/?" + params.toString() + "#challenge-booth";
  } else if (isSpot) {
    paintSpot();
  } else {
    paintColors();
  }
  progress();
  paintFeedback();
  updateNext();
  updateTimer();
}

function chooseMode(kind) {
  if (mode === kind) return;
  const previousGame = activeGame();
  pauseTimer(previousGame);
  if (mode === "spot") roundSpot().cursor = null;
  mode = kind;
  if (!roundComplete(activeGame())) startTimer(activeGame());
  renderGame();
}

function answerSpot(x, y, index) {
  const game = activeGame();
  if (game.done || roundComplete(game)) return;
  startTimer(game);
  const scene = scenes[game.round];
  const round = roundSpot();
  const id = scene.differences.find((key) => {
    const point = scenePoint(scene, key);
    return Math.hypot(x - point.x, y - point.y) <= point.radius;
  });
  if (!id) {
    round.misses++;
    round.miss = { x, y, index };
    clearTimeout(missTimeout);
    missTimeout = setTimeout(() => {
      round.miss = null;
      if (mode === "spot" && roundSpot() === round && !activeGame().done) paintSpot();
    }, 650);
    setFeedback("ตรงนี้ยังเหมือนกัน ลองมองส่วนอื่นดู", "bad");
  } else if (round.found.includes(id)) {
    setFeedback("เจอจุดนี้แล้ว ลองหาจุดอื่นดู");
  } else {
    round.miss = null;
    round.found.push(id);
    const complete = roundComplete(game);
    if (complete) pauseTimer(game);
    setFeedback(complete ? "เจอครบ 5 จุดแล้ว!" : "เจอจุดที่ " + round.found.length + " แล้ว!", "good");
  }
  paintSpot();
  progress();
  updateNext();
  if (roundComplete(game)) $("next-round").focus({ preventScroll: true });
}

function answerColor(option) {
  const game = activeGame();
  const question = game.questions[game.round];
  if (mode !== "color" || game.done || question.selected) return;
  startTimer(game);
  question.selected = option;
  pauseTimer(game);
  const correct = option === question.answer;
  setFeedback(correct ? "ถูกต้อง! คำตอบคือ" + colorNames[option] : "คำตอบคือ" + colorNames[question.answer], correct ? "good" : "bad");
  paintColors();
  progress();
  updateNext();
  $("next-round").focus({ preventScroll: true });
}

function hint() {
  const game = activeGame();
  if (mode !== "spot" || game.done || roundComplete(game)) return;
  const round = roundSpot();
  if (round.hints.length >= 2) return;
  const scene = scenes[game.round];
  const id = scene.differences.find((key) => !round.found.includes(key) && !round.hints.includes(key));
  if (!id) {
    setFeedback("ลองแตะตำแหน่งในวงสีเหลืองก่อน");
    return;
  }
  startTimer(game);
  round.hints.push(id);
  setFeedback("ลองมอง" + sceneDetails[id].hint);
  paintSpot();
  progress();
}

function nextRound() {
  const game = activeGame();
  if (game.done || !roundComplete(game)) return;
  const rounds = mode === "spot" ? scenes.length : colorQuestionsCount;
  if (game.round + 1 === rounds) {
    game.done = true;
    pauseTimer(game);
  } else {
    game.round++;
    game.feedback = "";
    game.tone = "";
    startTimer(game);
  }
  renderGame();
  if (game.done) $("result-heading").focus({ preventScroll: true });
  else if (mode === "color") $("choices").firstElementChild.focus({ preventScroll: true });
}

function restart() {
  games[mode] = freshGame(mode);
  startTimer(activeGame());
  renderGame();
  buttons[mode].focus({ preventScroll: true });
}

for (const [kind, button] of Object.entries(buttons)) button.addEventListener("click", () => chooseMode(kind));
canvases.forEach((canvas, index) => {
  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * pictureWidth / rect.width;
    const y = (event.clientY - rect.top) * pictureHeight / rect.height;
    roundSpot().cursor = null;
    answerSpot(x, y, index);
  });
  canvas.addEventListener("blur", () => {
    if (mode !== "spot" || !roundSpot().cursor) return;
    roundSpot().cursor = null;
    paintSpot();
  });
  canvas.addEventListener("keydown", (event) => {
    const moves = { ArrowUp: [0, -12], ArrowDown: [0, 12], ArrowLeft: [-12, 0], ArrowRight: [12, 0] };
    if (!Object.hasOwn(moves, event.key) && !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    const round = roundSpot();
    const cursor = round.cursor ?? { x: pictureWidth / 2, y: pictureHeight / 2, index };
    round.cursor = cursor;
    if (Object.hasOwn(moves, event.key)) {
      const [dx, dy] = moves[event.key];
      cursor.x = Math.max(8, Math.min(pictureWidth - 8, cursor.x + dx));
      cursor.y = Math.max(8, Math.min(pictureHeight - 8, cursor.y + dy));
      paintSpot();
    } else {
      answerSpot(cursor.x, cursor.y, index);
    }
  });
});
$("next-round").addEventListener("click", nextRound);
$("hint").addEventListener("click", hint);
$("restart").addEventListener("click", restart);
$("play-again").addEventListener("click", restart);

renderGame();
setInterval(updateTimer, 250);
