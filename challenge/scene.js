"use strict";

const pictureWidth = 480;
const pictureHeight = 340;

const sceneDetails = {
  bird: { x: 260, y: 53, radius: 24, hint: "บนท้องฟ้าตรงกลาง" },
  cloud: { x: 391, y: 54, radius: 28, hint: "เมฆก้อนเล็กบนท้องฟ้า" },
  flag: { x: 378, y: 137, radius: 24, hint: "เหนือเต็นท์" },
  window: { x: 295, y: 222, radius: 24, hint: "ผ้าเต็นท์ด้านข้าง" },
  log: { x: 80, y: 279, radius: 25, hint: "ขอนไม้ริมสนามหญ้า" },
  mug: { x: 184, y: 261, radius: 23, hint: "ของที่อยู่ข้างกองไฟ" },
  flowers: { x: 405, y: 279, radius: 25, hint: "กลุ่มดอกไม้ริมสนามหญ้า" },
  sun: { x: 127, y: 52, radius: 28, hint: "วงกลมสว่างบนท้องฟ้า" },
};

const scenes = [
  {
    name: "แคมป์ริมทะเลสาบ",
    differences: ["bird", "flag", "window", "mug", "flowers"],
    sky: "#f9dfaa", horizon: "#f4be8e", sun: "#fff7cc",
    farMountain: "#a98483", nearMountain: "#867c75", rockLight: "#c99a83", snow: "#fff1cf",
    water: "#80aaa5", ripples: "#c7ded0", field: "#a5a66b", hill: "#bac083",
    foreground: "#858d56", trees: "#425f55", midTrees: "#61756b", tent: "#e28b47", tentLight: "#fec679",
  },
  {
    name: "แคมป์ยามเย็น",
    mirror: true,
    differences: ["sun", "cloud", "flag", "log", "mug"],
    sky: "#efb596", horizon: "#e8a077", sun: "#ffe6aa",
    farMountain: "#a37080", nearMountain: "#80647b", rockLight: "#c8898d", snow: "#ffddac",
    water: "#a093aa", ripples: "#dfb6aa", field: "#a38a5e", hill: "#bca977",
    foreground: "#7c7757", trees: "#495851", midTrees: "#676671", tent: "#bd6554", tentLight: "#eea968",
  },
  {
    name: "แคมป์ใต้แสงจันทร์",
    night: true,
    differences: ["bird", "cloud", "window", "log", "flowers"],
    sky: "#6f7298", horizon: "#b292a5", sun: "#fff0be",
    farMountain: "#80768c", nearMountain: "#575b78", rockLight: "#9d849b", snow: "#ead5ce",
    water: "#66859b", ripples: "#a4bbc7", field: "#777c75", hill: "#989489",
    foreground: "#626d6c", trees: "#344e59", midTrees: "#566c75", tent: "#dd966b", tentLight: "#f1b785",
  },
];

function scenePoint(scene, id) {
  const detail = sceneDetails[id];
  return { ...detail, x: scene.mirror ? pictureWidth - detail.x : detail.x };
}

function paintScene(canvas, scene, isAlternate) {
  const ctx = canvas.getContext("2d");
  const changed = (id) => isAlternate && scene.differences.includes(id);

  function shape(points, fill, stroke, width = 1.3) {
    ctx.beginPath();
    for (const [index, [x, y]] of points.entries()) {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    if (fill) {
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }

  function ellipse(x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function clouds(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(-34, 9);
    ctx.bezierCurveTo(-41, 6, -36, -3, -28, -4);
    ctx.bezierCurveTo(-25, -16, -13, -18, -5, -12);
    ctx.bezierCurveTo(2, -24, 21, -21, 25, -7);
    ctx.bezierCurveTo(37, -9, 43, 6, 32, 9);
    ctx.closePath();
    ctx.fillStyle = scene.night ? "#ded1dc95" : "#fff5dbd9";
    ctx.fill();
    ctx.restore();
  }

  function pine(x, y, height, spread, color, light) {
    const top = y - height;
    shape([[x, y + 4], [x, top + height * .42]], color, color, Math.max(1, height * .043));
    const half = spread / 2;
    shape([
      [x, top], [x + half * .48, top + height * .43], [x + half * .3, top + height * .41],
      [x + half * .77, top + height * .69], [x + half * .47, top + height * .67],
      [x + half, y - height * .09], [x + half * .37, y], [x - half * .39, y],
      [x - half, y - height * .08], [x - half * .5, top + height * .66],
      [x - half * .79, top + height * .67], [x - half * .31, top + height * .41],
      [x - half * .48, top + height * .43],
    ], color);
    if (light) shape([[x, top + 5], [x, y - 2], [x - half * .85, y - height * .1],
      [x - half * .28, top + height * .63], [x - half * .53, top + height * .64]], light);
  }

  let seed = 71291;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  ctx.save();
  ctx.clearRect(0, 0, pictureWidth, pictureHeight);
  if (scene.mirror) {
    ctx.translate(pictureWidth, 0);
    ctx.scale(-1, 1);
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const sky = ctx.createLinearGradient(0, 0, 0, 184);
  sky.addColorStop(0, scene.sky);
  sky.addColorStop(1, scene.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, pictureWidth, pictureHeight);

  ellipse(127, 52, 30, 30, scene.night ? "#f7dba732" : "#fff8cf49");
  ellipse(127, 52, 22, 22, changed("sun") ? "#f5a46f" : scene.sun);
  if (scene.night) {
    ellipse(134, 46, 18, 18, "#827c9d");
    for (const [x, y] of [[35, 31], [74, 57], [188, 31], [221, 62], [290, 25], [320, 61], [414, 29], [448, 63]]) {
      shape([[x - 3, y], [x + 3, y]], null, "#fff4c8cf", 1.4);
      shape([[x, y - 3], [x, y + 3]], null, "#fff4c8cf", 1.4);
    }
  }
  clouds(57, 80, .78);
  clouds(314, 79, .62);
  if (!changed("cloud")) clouds(391, 55, .72);
  if (!changed("bird")) {
    shape([[244, 56], [250, 53], [256, 57], [261, 52], [267, 52]], null, "#564c47", 2);
    shape([[261, 46], [266, 43], [270, 45], [273, 41], [278, 40]], null, "#564c47", 1.6);
  }

  shape([[0, 162], [52, 126], [89, 146], [153, 82], [191, 124], [246, 150], [290, 109],
    [328, 127], [369, 92], [416, 135], [480, 117], [480, 208], [0, 208]], scene.farMountain);
  shape([[91, 145], [153, 82], [146, 118], [172, 141], [136, 128]], scene.rockLight);
  shape([[106, 130], [153, 82], [187, 120], [165, 107], [153, 110], [144, 103], [132, 119]], scene.snow);
  shape([[324, 130], [369, 92], [410, 130], [389, 120], [369, 110], [356, 120], [348, 116]], scene.snow);
  shape([[0, 156], [65, 129], [118, 167], [184, 147], [220, 106], [267, 144],
    [302, 156], [347, 142], [396, 165], [480, 139], [480, 209], [0, 209]], scene.nearMountain);
  shape([[181, 149], [220, 106], [211, 139], [230, 159], [204, 153], [171, 169]], scene.rockLight);
  shape([[187, 142], [220, 106], [254, 133], [232, 125], [220, 129], [212, 122], [200, 136]], scene.snow);
  shape([[26, 145], [65, 129], [91, 147], [69, 140], [57, 143], [48, 140]], scene.rockLight);

  for (let x = 1; x < pictureWidth; x += 9) {
    const height = 9 + random() * 23;
    pine(x, 194 + random() * 6, height, height * .52, scene.midTrees);
  }
  ctx.fillStyle = scene.water;
  ctx.fillRect(0, 193, pictureWidth, 69);
  for (let i = 0; i < 32; i++) {
    const x = random() * pictureWidth;
    const y = 198 + random() * 49;
    shape([[x, y], [Math.min(480, x + 4 + random() * 33), y]], null, scene.ripples, .7 + random() * .65);
  }
  shape([[0, 228], [61, 223], [134, 239], [193, 242], [254, 226], [308, 228], [394, 212], [480, 220],
    [480, 340], [0, 340]], scene.hill);
  shape([[0, 249], [66, 244], [143, 257], [217, 264], [278, 257], [357, 239], [480, 230],
    [480, 340], [0, 340]], scene.field);
  shape([[0, 311], [57, 305], [122, 317], [198, 314], [263, 302], [356, 321], [480, 310],
    [480, 340], [0, 340]], scene.foreground);

  pine(17, 258, 113, 61, scene.trees, "#ffffff17");
  pine(48, 233, 83, 45, scene.trees, "#ffffff19");
  pine(79, 226, 55, 34, scene.midTrees, "#ffffff15");
  pine(461, 244, 122, 69, scene.trees, "#ffffff17");
  pine(421, 226, 72, 43, scene.trees, "#ffffff1c");
  pine(481, 257, 93, 56, scene.midTrees, "#ffffff18");

  // เงาและเส้นเชือกช่วยให้สิ่งของแยกจากฉากหลัง
  ellipse(325, 271, 82, 13, "#31272138");
  shape([[245, 258], [224, 273], [222, 273]], null, "#ece1b1", 1.6);
  shape([[369, 166], [432, 265]], null, "#ece1b1", 1.6);
  shape([[428, 265], [436, 265]], null, "#5e5441", 2);
  shape([[224, 273], [220, 274]], null, "#5e5441", 2);
  const outline = "#754f38";
  shape([[236, 264], [282, 180], [366, 163], [412, 251], [335, 274]], scene.tent, outline, 2);
  shape([[282, 180], [366, 163], [335, 274]], scene.tentLight, outline, 1.4);
  shape([[366, 163], [412, 251], [335, 274]], "#9d543c", outline, 1.8);
  shape([[371, 185], [397, 247], [347, 264]], "#604135", outline, 1.4);
  shape([[371, 185], [372, 254], [347, 264]], "#ad6844");
  shape([[236, 264], [282, 180], [335, 274]], scene.tent, outline, 1.8);
  shape([[242, 258], [282, 187], [327, 266]], null, "#f0b971", 1.4);
  if (!changed("window")) {
    shape([[281, 232], [284, 215], [305, 217], [310, 234]], "#657d72", outline, 1.6);
    shape([[294, 217], [295, 233]], null, "#c9ccaa", 1.2);
  }
  shape([[366, 164], [366, 130]], null, outline, 2);
  shape([[366, 130], [390, 137], [366, 145]], changed("flag") ? "#f6d170" : "#c65842", outline, 1.2);

  ellipse(80, 287, 27, 6, "#35292133");
  shape([[61, 271], [88, 265], [103, 275], [97, 283], [70, 291], [57, 283]], changed("log") ? "#b28150" : "#79604c", "#634e3e", 1.5);
  ellipse(63, 281, 9, 10, "#c59767");
  ellipse(63, 281, 5, 6, "#a7764d");
  ellipse(63, 281, 2, 3, "#c59767");
  shape([[74, 279], [95, 274]], null, "#493d3690", 1.1);

  ellipse(157, 285, 39, 10, "#56463739");
  for (const [x, y, size, color] of [[127, 282, 8, "#949080"], [138, 289, 7, "#77766b"], [153, 290, 8, "#b5a08a"], [171, 286, 7, "#958c78"], [181, 282, 7, "#726d60"]]) {
    ellipse(x, y, size, 4, color);
  }
  shape([[139, 283], [166, 274]], null, "#69483a", 5);
  shape([[143, 273], [165, 283]], null, "#9c634a", 5);
  shape([[143, 278], [139, 264], [145, 270], [149, 255], [156, 244], [157, 260], [164, 252], [171, 273], [161, 281]],
    "#ec8243", "#a66440", 1.2);
  shape([[148, 277], [148, 268], [153, 269], [156, 258], [161, 272], [166, 270], [162, 279]], "#ffdb78");
  if (!changed("mug")) {
    ellipse(189, 260, 6, 5, "#e8dec0");
    ellipse(189, 260, 3, 3, scene.field);
    shape([[177, 255], [188, 255], [187, 268], [179, 267]], "#e8dec0", "#5d6259", 1.3);
    shape([[178, 256], [187, 256]], null, "#647f77", 2.2);
  }

  for (const [x, y, height] of [[396, 282, 13], [405, 284, 18], [415, 284, 10]]) {
    shape([[x, y], [x, y - height]], null, scene.trees, 1.8);
    shape([[x, y - 3], [x + 5, y - 7]], null, scene.trees, 1.5);
    ellipse(x, y - height, 4.6, 4.1, changed("flowers") ? "#f9e5ad" : "#b1667b");
    ellipse(x, y - height, 1.5, 1.5, "#e6a351");
  }
  for (let i = 0; i < 92; i++) {
    const x = random() * pictureWidth;
    const y = 234 + random() * 107;
    if ((x > 222 && x < 433 && y < 285) || (x > 113 && x < 201 && y < 296)) continue;
    const h = 1 + random() * 4;
    shape([[x - 3, y - h], [x, y], [x + 2, y - h * 1.3]], null, i % 4 ? "#394e3b45" : "#fdf0b695", 1);
  }

  // ลายกระดาษใช้ค่าเดิมทั้งสองภาพ จึงไม่เพิ่มคำตอบโดยบังเอิญ
  for (let i = 0; i < 6300; i++) {
    const x = random() * pictureWidth;
    const y = random() * pictureHeight;
    ctx.fillStyle = i % 2 ? "#201f190d" : "#fff8ec20";
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}
