let niveis = [];
let nivelAtualIndex = 0;
let respostaCorreta = "";
let tentativas = 5;
let streak = parseInt(localStorage.getItem('fragmentoStreak')) || 0;
let letrasReveladas = 0;

const inputGuess = document.getElementById('guess-input');
const btnSubmit = document.getElementById('submit-btn');
const btnNextLevel = document.getElementById('next-level-btn');
const attemptsCount = document.getElementById('attempts-count');
const feedbackMsg = document.getElementById('feedback-message');
const streakCount = document.getElementById('streak-count');
const mysteryBox = document.getElementById('mystery-text');
const levelDisplay = document.getElementById('level-display');
const btnShare = document.getElementById('share-btn');
const btnSacrifice = document.getElementById('sacrifice-btn');

streakCount.innerText = streak;

function atualizarRank() {
    const statusLabel = document.querySelector('.status-line');
    if (statusLabel) {
        let rank = "SCRIPT KIDDIE";
        if (streak > 9) rank = "FANTASMA DIGITAL";
        else if (streak > 5) rank = "CYBER MERCENÁRIO";
        else if (streak > 2) rank = "INVASOR DE SISTEMAS";
        statusLabel.innerHTML = `STATUS: <span style="color:#fff">${rank}</span>`;
    }
}

async function iniciarJogo() {
    try {
        const res = await fetch('niveis.json');
        niveis = await res.json();
        carregarNivel(nivelAtualIndex);
    } catch (e) { mysteryBox.innerText = "ERRO AO CARREGAR NÍVEIS."; }
}

function carregarNivel(idx) {
    tentativas = 5;
    letrasReveladas = 0;
    document.body.style.animation = "none";
    atualizarRank();
    
    const n = niveis[idx];
    respostaCorreta = n.alvo;
    levelDisplay.innerText = n.id;
    mysteryBox.innerHTML = n.texto.replace(/\[(.*?)\]/g, '<span class="censored">$1</span>');
    
    attemptsCount.innerText = tentativas;
    feedbackMsg.innerText = "";
    inputGuess.disabled = false;
    inputGuess.value = "";
    btnSubmit.style.display = "block";
    btnNextLevel.style.display = "none";
    btnShare.style.display = "none";
    btnSacrifice.style.display = streak > 0 ? "block" : "none";
}

function processarChute() {
    const chute = inputGuess.value.toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!chute) return;

    if (chute === respostaCorreta.toUpperCase()) {
        vencer();
    } else {
        errar();
    }
    inputGuess.value = "";
}

function vencer() {
    feedbackMsg.innerHTML = `<span style="color:#00ff41">ACESSO AUTORIZADO: ${respostaCorreta}</span>`;
    streak++;
    finalizar(true);
}

function errar() {
    tentativas--;
    attemptsCount.innerText = tentativas;
    tocarSom('erro');
    
    if (tentativas === 1) document.body.style.animation = "pulse-red 0.8s infinite";
    
    const censurados = document.querySelectorAll('.censored:not(.revealed)');
    if (censurados.length > 0) revelarComGlitch(censurados[0]);

    if (tentativas <= 0) {
        feedbackMsg.innerHTML = `<span style="color:red">SISTEMA BLOQUEADO. ALVO: ${respostaCorreta}</span>`;
        streak = 0;
        finalizar(false);
    } else {
        document.querySelector('.container').classList.add('shake');
        setTimeout(() => document.querySelector('.container').classList.remove('shake'), 400);
    }
}

function finalizar(venceu) {
    localStorage.setItem('fragmentoStreak', streak);
    streakCount.innerText = streak;
    atualizarRank();
    inputGuess.disabled = true;
    btnSubmit.style.display = "none";
    btnShare.style.display = "block";
    if (venceu && nivelAtualIndex < niveis.length - 1) btnNextLevel.style.display = "block";
    document.querySelectorAll('.censored').forEach(el => el.classList.add('revealed'));
}

function revelarComGlitch(el) {
    const original = el.innerText;
    el.classList.add('revealed');
    let i = 0;
    const interval = setInterval(() => {
        el.innerText = original.split('').map((char, idx) => idx < i ? original[idx] : "!@#$%^&*"[Math.floor(Math.random()*8)]).join('');
        if (i >= original.length) clearInterval(interval);
        i += 0.5;
    }, 50);
}

// Eventos
btnSubmit.addEventListener('click', processarChute);
inputGuess.addEventListener('keypress', e => { if(e.key === 'Enter') processarChute(); });
btnNextLevel.addEventListener('click', () => { nivelAtualIndex++; carregarNivel(nivelAtualIndex); });

// Matrix Effect
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width/15)).fill(1);
function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0F0"; ctx.font = "15px monospace";
    drops.forEach((y, i) => {
        ctx.fillText(Math.floor(Math.random()*2), i*15, y*15);
        if (y*15 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}
setInterval(drawMatrix, 50);

function tocarSom(t) {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.frequency.value = t === 'erro' ? 100 : 400;
    osc.start(); g.gain.exponentialRampToValueAtTime(0.00001, ac.currentTime + 0.2);
    osc.stop(ac.currentTime + 0.2);
}

iniciarJogo();