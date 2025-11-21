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

// zodiac from DOB (simple Western)
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

// life-path style sum of DOB
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

// Simple seeded RNG based on user data
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
  const baseString = `${dob || ""}|${zodiac || ""}|${style || ""}|${favNumber || ""}|${extraSalt || ""}`;
  const rng = makeSeededRNG(baseString);

  const mainSet = new Set();
  while (mainSet.size < 5) {
    let n = rng(70);

    // tweak based on style
    if (style === "safe" && n > 55) n -= 13;
    if (style === "wild" && n < 15) n += 12;

    // light bias towards favorite number
    if (favNumber && Math.random() < 0.25) {
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

document.addEventListener("DOMContentLoaded", () => {
  const step1Next = document.getElementById("to-step-2");
  const generateBtn = document.getElementById("generate-btn");
  const regenerateBtn = document.getElementById("regenerate-btn");
  const copyBtn = document.getElementById("copy-btn");

  const nameInput = document.getElementById("name");
  const dobInput = document.getElementById("dob");
  const tobInput = document.getElementById("tob");
  const locInput = document.getElementById("location");
  const zodiacInput = document.getElementById("zodiac");
  const favNumberInput = document.getElementById("fav-number");
  const favColorInput = document.getElementById("fav-color");

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

  // Back buttons
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

  function renderNumbers() {
    const name = nameInput.value.trim();
    const dob = dobInput.value;
    const tob = tobInput.value;
    const location = locInput.value.trim();
    const zodiac = zodiacInput.value.trim();
    const style = collectStyle();
    const favNumber = favNumberInput.value.trim();
    const favColor = favColorInput.value.trim();

    // Use more info in seed
    const extraSalt = `${tob}|${location}|${favColor}`;

    const { mainNumbers, mega } = generateLuckyNumbers({
      dob,
      zodiac,
      style,
      favNumber,
      extraSalt,
    });

    ["n1", "n2", "n3", "n4", "n5"].forEach((id, i) => {
      document.getElementById(id).textContent = mainNumbers[i];
    });
    document.getElementById("mega").textContent = mega;

    const greetingEl = document.getElementById("greeting");
    greetingEl.textContent = name
      ? `${name}, here’s a combo tuned to your date of birth and vibe.`
      : "Here’s a combo tuned to your date of birth and vibe.";

    const explanationsEl = document.getElementById("explanations");
    explanationsEl.innerHTML = "";

    const lp = lifePathFromDOB(dob);
    if (lp) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = `Life path ${lp}: we nudged your numbers around that energy.`;
      explanationsEl.appendChild(chip);
    }

    if (zodiac) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = `Zodiac sign: ${zodiac}. Your sign’s typical traits influenced the spread.`;
      explanationsEl.appendChild(chip);
    }

    const styleChip = document.createElement("div");
    styleChip.className = "chip";
    styleChip.textContent =
      style === "safe"
        ? "Safe & steady: slightly more centered main numbers."
        : style === "wild"
        ? "All-in lucky: slightly more low/high extremes."
        : "Balanced: mix of low, mid, and higher values.";
    explanationsEl.appendChild(styleChip);

    if (favNumber) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = `We gently considered your favorite number ${favNumber} without forcing it into every combo.`;
      explanationsEl.appendChild(chip);
    }

    if (favColor) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = `Lucky color ${favColor} is baked into your “signature” seed for this set.`;
      explanationsEl.appendChild(chip);
    }
  }

  // Generate & go to step 3
  generateBtn.addEventListener("click", () => {
    if (!dobInput.value) {
      alert("Please enter your date of birth first.");
      return;
    }
    renderNumbers();
    setActiveStep(3);
  });

  // Regenerate with same inputs
  regenerateBtn.addEventListener("click", () => {
    renderNumbers();
  });

  // Copy numbers to clipboard
  copyBtn.addEventListener("click", () => {
    const nums = [
      document.getElementById("n1").textContent,
      document.getElementById("n2").textContent,
      document.getElementById("n3").textContent,
      document.getElementById("n4").textContent,
      document.getElementById("n5").textContent,
    ];
    const mega = document.getElementById("mega").textContent;
    const text = `Mega Millions lucky numbers: ${nums.join(
      " - "
    )} | Mega Ball: ${mega}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => alert("Numbers copied to clipboard!"))
        .catch(() => alert("Could not copy automatically, sorry."));
    } else {
      // fallback
      alert(text);
    }
  });

  // Start on step 1
  setActiveStep(1);
});