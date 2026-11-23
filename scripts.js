let drawnHistory = [];
let isSpinning = false;
let audioCtx = null;

function handleLogoFallback() {
    const img = document.getElementById("logo-img");
    const fallback = document.getElementById("logo-fallback");
    if (img && fallback) {
        img.classList.add("hidden");
        fallback.classList.remove("hidden");
    }
}

function setRange(minVal, maxVal) {
    document.getElementById("min").value = minVal;
    document.getElementById("max").value = maxVal;
    document.getElementById("error-message").textContent = "";
}

function getAudioContext() {
    if (!document.getElementById("sound-enabled")?.checked) return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTickSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
}

function playWinSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const startTime = ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.22);
    });
}

function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#00FF66", "#00E676", "#7CFFAB", "#00C853", "#FFFFFF"];
    const particles = Array.from({ length: 85 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height * 0.4,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: Math.random() * 4 + 2.5,
        vx: (Math.random() - 0.5) * 3,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10
    }));

    let frames = 0;
    function animate() {
        frames++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
            p.y += p.vy;
            p.x += p.vx;
            p.rot += p.vRot;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        if (frames < 110) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    animate();
}

function generateNumber() {
    if (isSpinning) return;

    const minInput = document.querySelector(".input-min").value;
    const maxInput = document.querySelector(".input-max").value;
    const quantity = parseInt(document.getElementById("quantity").value, 10) || 1;
    const noRepeat = document.getElementById("no-repeat").checked;
    const errorMsg = document.getElementById("error-message");
    const resultBox = document.getElementById("result-box");
    const resultDisplay = document.getElementById("result-display");
    const resultLabel = document.getElementById("result-label");
    const drawButton = document.getElementById("draw-button");

    errorMsg.textContent = "";

    if (minInput === "" || maxInput === "") {
        errorMsg.textContent = "Preencha os valores mínimo e máximo.";
        return;
    }

    const min = Math.ceil(Number(minInput));
    const max = Math.floor(Number(maxInput));

    if (min >= max) {
        errorMsg.textContent = "O valor mínimo deve ser menor que o máximo.";
        return;
    }

    const totalPossible = max - min + 1;
    const drawnInRange = drawnHistory.filter((num) => num >= min && num <= max);
    const availableCount = noRepeat ? totalPossible - drawnInRange.length : totalPossible;

    if (noRepeat && availableCount <= 0) {
        errorMsg.textContent = "Todos os números desse intervalo já foram sorteados! Limpe o histórico.";
        return;
    }

    if (noRepeat && quantity > availableCount) {
        errorMsg.textContent = `Restam apenas ${availableCount} número(s) disponível(is) nesse intervalo.`;
        return;
    }

    const finalNumbers = [];
    for (let i = 0; i < quantity; i++) {
        let candidate;
        do {
            candidate = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (noRepeat && (drawnHistory.includes(candidate) || finalNumbers.includes(candidate)));
        finalNumbers.push(candidate);
    }

    isSpinning = true;
    drawButton.disabled = true;
    resultBox.classList.remove("hidden");
    resultLabel.textContent = quantity > 1 ? `Números sorteados (${quantity}):` : "Número sorteado:";

    let spins = 0;
    const maxSpins = 16;
    const interval = setInterval(() => {
        playTickSound();
        if (quantity === 1) {
            resultDisplay.textContent = Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
            const tempBalls = Array.from({ length: quantity }, () =>
                Math.floor(Math.random() * (max - min + 1)) + min
            );
            resultDisplay.innerHTML = tempBalls
                .map((n) => `<span class="multi-ball">${n}</span>`)
                .join("");
        }
        spins++;

        if (spins >= maxSpins) {
            clearInterval(interval);
            if (quantity === 1) {
                resultDisplay.textContent = finalNumbers[0];
            } else {
                resultDisplay.innerHTML = finalNumbers
                    .map((n) => `<span class="multi-ball">${n}</span>`)
                    .join("");
            }
            addToHistory(finalNumbers);
            playWinSound();
            launchConfetti();
            isSpinning = false;
            drawButton.disabled = false;
        }
    }, 45);
}

function addToHistory(numbers) {
    for (let i = numbers.length - 1; i >= 0; i--) {
        drawnHistory.unshift(numbers[i]);
    }
    renderHistory();
}

function renderHistory() {
    const historyContainer = document.getElementById("history-container");
    const historyList = document.getElementById("history-list");
    const historyCount = document.getElementById("history-count");

    if (drawnHistory.length === 0) {
        historyContainer.classList.add("hidden");
        return;
    }

    historyContainer.classList.remove("hidden");
    historyCount.textContent = drawnHistory.length;
    historyList.innerHTML = "";

    drawnHistory.forEach((num, idx) => {
        const li = document.createElement("li");
        li.textContent = idx === 0 ? `★ ${num}` : num;
        historyList.appendChild(li);
    });
}

function clearHistory() {
    drawnHistory = [];
    document.getElementById("error-message").textContent = "";
    document.getElementById("result-box").classList.add("hidden");
    renderHistory();
}

function copyResult() {
    const resultDisplay = document.getElementById("result-display");
    const balls = resultDisplay.querySelectorAll(".multi-ball");
    const textToCopy = balls.length > 0
        ? Array.from(balls).map((b) => b.textContent).join(", ")
        : resultDisplay.textContent.trim();

    const copyBtn = document.getElementById("copy-btn");
    if (navigator.clipboard && textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const prev = copyBtn.textContent;
            copyBtn.textContent = "Copiado!";
            setTimeout(() => {
                copyBtn.textContent = prev;
            }, 1500);
        });
    }
}

document.querySelectorAll("input[type='number']").forEach((input) => {
    input.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            generateNumber();
        }
    });
});

window.addEventListener("resize", () => {
    const canvas = document.getElementById("confetti-canvas");
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});
