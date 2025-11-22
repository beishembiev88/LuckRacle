// ----- STEP / UI LOGIC -----
function setActiveStep(step) {
  // cards
  document.querySelectorAll(".card").forEach((card) => {
    const s = Number(card.getAttribute("data-step"));
    card.classList.toggle("hidden", s !== step);
  });

  // progress
  document.querySelectorAll(".progress-step").forEach((el) => {
    const s = Number(el.getAttribute("data-step"));
    el.classList.toggle("active", s === step);
  });
}

// Western zodiac from DOB (simple)
function getZodiacFromDOB(dobStr) {
  if (!dobStr) return "";
  const date = new Date(dobStr + "T00:00:00");
  const d = date.getDate();
  const m = date.getMonth() + 1;

  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "Aries";
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "Taurus";
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "Gemini";
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "Cancer";
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "Leo";
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "Virgo";
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "Libra";
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "Scorpio";
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "Sagittarius";
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "Capricorn";
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "Aquarius";
  if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return "Pisces";
  return "";
}

// Chinese zodiac by year
function getChineseZodiac(year) {
  if (!year) return "";
  const animals = [
    "Rat",
    "Ox",
    "Tiger",
    "Rabbit",
    "Dragon",
    "Snake",
    "Horse",
    "Goat",
    "Monkey",
    "Rooster",
    "Dog",
    "Pig",
  ];
  const baseYear = 2020; // Rat year
  const index = ((year - baseYear) % 12 + 12) % 12;
  return animals[index];
}

// life path from DOB (simple numerology)
function lifePathFromDOB(dobStr) {
  if (!dobStr) return null;
  const digits = dobStr.replace(/-/g, "").split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum
      .toString()
      .split("")
      .map(Number)
      .reduce((a, b) => a + b, 0);
  }
  return sum;
}

// Simple seeded RNG
function makeSeededRNG(seedString) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
  }
  return function (max) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    return (hash % max) + 1;
  };
}

// MAIN GENERATOR: 5 main numbers (1-70) + 1 mega (1-25)
function generateLuckyNumbers({ dob, zodiac, style, favNumber, extraSalt }) {
  const baseString =
    (dob || "") +
    "|" +
    (zodiac || "") +
    "|" +
    (style || "") +
    "|" +
    (favNumber || "") +
    "|" +
    (extraSalt || "");
  const rng = makeSeededRNG(baseString);

  const mainSet = new Set();
  while (mainSet.size < 5) {
    let n = rng(70);

    // tweak based on style
    if (style === "safe" && n > 55) n -= 13;
    if (style === "wild" && n < 15) n += 12;

    // light bias towards favorite number
    if (favNumber && Math.random() < 0.27) {
      const parsed = parseInt(favNumber, 10);
      if (!Number.isNaN(parsed)) n = parsed;
    }

    // bounds
    if (n < 1) n = 1;
    if (n > 70) n = 70;

    mainSet.add(n);
  }

  const mainNumbers = Array.from(mainSet).sort((a, b) => a - b);

  let mega = rng(25);
  // avoid mega == favNumber exactly
  if (favNumber && mega === parseInt(favNumber, 10)) {
    mega = ((mega + 7 - 1) % 25) + 1;
  }

  return { mainNumbers, mega };
}

// HISTORY helpers
const HISTORY_KEY = "luckracleHistory";

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors
  }
}

function addToHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  const trimmed = history.slice(0, 10); // keep last 10
  saveHistory(trimmed);
  return trimmed;
}

function formatDateTime(date) {
  try {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date.toString();
  }
}

function renderHistory(listEl) {
  const history = loadHistory();
  listEl.innerHTML = "";
  if (!history.length) {
    const p = document.createElement("p");
    p.className = "history-hint";
    p.textContent = "No history yet. Generate a set to see recent picks here.";
    listEl.appendChild(p);
    return;
  }

  history.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";

    const main = document.createElement("div");
    main.className = "history-main";
    main.textContent = `${item.numbers.join(" - ")} | Mega: ${item.mega}`;

    const meta = document.createElement("div");
    meta.className = "history-meta";
    const parts = [];
    if (item.dob) parts.push(item.dob);
    if (item.zodiac) parts.push(item.zodiac);
    if (item.cZodiac) parts.push(item.cZodiac);
    if (item.style) parts.push(item.style);
    const metaText = parts.join(" · ");
    meta.textContent = `${formatDateTime(new Date(item.timestamp))}${
      metaText ? " · " + metaText : ""
    }`;

    row.appendChild(main);
    row.appendChild(meta);
    listEl.appendChild(row);
  });
}

// DOM wiring
document.addEventListener("DOMContentLoaded", () => {
  const step1Next = document.getElementById("to-step-2");
  const generateBtn = document.getElementById("generate-btn");
  const regenerateBtn = document.getElementById("regenerate-btn");
  const shareBtn = document.getElementById("share-btn");

  const nameInput = document.getElementById("name");
  const dobInput = document.getElementById("dob");
  const tobInput = document.getElementById("tob");
  const locInput = document.getElementById("location");
  const zodiacInput = document.getElementById("zodiac");
  const favNumberInput = document.getElementById("fav-number");
  const favColorInput = document.getElementById("fav-color");
  const historyListEl = document.getElementById("history-list");

  // Auto-fill zodiac
  dobInput.addEventListener("change", () => {
    const z = getZodiacFromDOB(dobInput.value);
    if (z) zodiacInput.value = z;
  });

  // Step 1 -> Step 2
  step1Next.addEventListener("click", () => {
    if (!dobInput.value) {
      alert("Please enter your date of birth – it’s required.");
      return;
    }
    setActiveStep(2);
  });

  // Back buttons (Step 2 & 3)
  document.querySelectorAll("[data-nav='back']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = document.querySelector(".card:not(.hidden)");
      const step = Number(current.getAttribute("data-step"));
      const prev = Math.max(1, step - 1);
      setActiveStep(prev);
    });
  });

  function collectStyle() {
    const checked = document.querySelector("input[name='style']:checked");
    return checked ? checked.value : "balanced";
  }

  function animateBalls(mainNumbers, mega) {
    const ids = ["n1", "n2", "n3", "n4", "n5"];
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      el.textContent = mainNumbers[i];
      el.classList.remove("pop");
      // force reflow
      void el.offsetWidth;
      el.classList.add("pop");
    });

    const megaEl = document.getElementById("mega");
    megaEl.textContent = mega;
    megaEl.classList.remove("pop");
    void megaEl.offsetWidth;
    megaEl.classList.add("pop");
  }

  function renderNumbers(andSaveHistory = true) {
    const name = nameInput.value.trim();
    const dob = dobInput.value;
    const tob = tobInput.value;
    const location = locInput.value.trim();
    const zodiac = zodiacInput.value.trim();
    const style = collectStyle();
    const favNumber = favNumberInput.value.trim();
    const favColor = favColorInput.value.trim();

    const extraSalt = `${tob}|${location}|${favColor}`;

    const { mainNumbers, mega } = generateLuckyNumbers({
      dob,
      zodiac,
      style,
      favNumber,
      extraSalt,
    });

    animateBalls(mainNumbers, mega);

    const greetingEl = document.getElementById("greeting");
    greetingEl.textContent = name
      ? `${name}, here’s a combo tuned to your date of birth and vibe.`
      : "Here’s a combo tuned to your date of birth and vibe.";

    const explanationsEl = document.getElementById("explanations");
    explanationsEl.innerHTML = "";

    const lp = lifePathFromDOB(dob);
    const dobYear = dob ? new Date(dob + "T00:00:00").getFullYear() : null;
    const cZodiac = dobYear ? getChineseZodiac(dobYear) : "";

    if (lp) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = `Life path ${lp}: your numbers are nudged around that kind of energy.`;
      explanationsEl.appendChild(chip);
    }

    if (zodiac) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = `Western zodiac: ${zodiac}. Your sign’s usual traits influence how spread-out the numbers are.`;
      explanationsEl.appendChild(chip);
    }

    if (cZodiac) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = `Chinese zodiac: ${cZodiac}. This adds another layer to the “signature” seed.`;
      explanationsEl.appendChild(chip);
    }

    const styleChip = document.createElement("div");
    styleChip.className = "chip";
    styleChip.textContent =
      style === "safe"
        ? "Safe & steady: gently biased toward more centered, less extreme values."
        : style === "wild"
        ? "All-in lucky: a bit more weight on very low or very high numbers."
        : "Balanced: mix of low, mid, and higher values.";
    explanationsEl.appendChild(styleChip);

    if (favNumber) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = `Favorite number ${favNumber}: lightly considered without forcing it into every position.`;
      explanationsEl.appendChild(chip);
    }

    if (favColor) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = `Lucky color ${favColor} is folded into your personal “seed” for this set.`;
      explanationsEl.appendChild(chip);
    }

    if (andSaveHistory) {
      const historyEntry = {
        timestamp: Date.now(),
        numbers: mainNumbers,
        mega,
        dob,
        zodiac,
        cZodiac,
        style,
      };
      const updated = addToHistory(historyEntry);
      renderHistory(historyListEl, updated);
    }
  }

  // Generate & go to step 3
  generateBtn.addEventListener("click", () => {
    if (!dobInput.value) {
      alert("Please enter your date of birth first.");
      return;
    }
    renderNumbers(true);
    setActiveStep(3);
  });

  // Regenerate with same inputs
  regenerateBtn.addEventListener("click", () => {
    renderNumbers(true);
  });

  // Share / copy numbers
  shareBtn.addEventListener("click", async () => {
    const nums = [
      document.getElementById("n1").textContent,
      document.getElementById("n2").textContent,
      document.getElementById("n3").textContent,
      document.getElementById("n4").textContent,
      document.getElementById("n5").textContent,
    ];
    const mega = document.getElementById("mega").textContent;
    if (nums.includes("--") || mega === "--") {
      alert("Generate numbers first, then share.");
      return;
    }

    const text = `LuckRacle Mega Millions numbers: ${nums.join(
      " - "
    )}  | Mega Ball: ${mega}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My LuckRacle numbers",
          text,
          url: window.location.href,
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert("Numbers copied to clipboard!");
      } else {
        alert(text);
      }
    } catch {
      // fallback to copy
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          alert("Numbers copied to clipboard!");
        } else {
          alert(text);
        }
      } catch {
        alert(text);
      }
    }
  });

  // Initial state
  setActiveStep(1);
  renderHistory(historyListEl);
});