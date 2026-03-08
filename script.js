// --- 1. VARIÁVEIS GLOBAIS ---
let niveis = [];
let nivelAtualIndex = 0;
let respostaCorreta = "";
let tentativas = 5;
let streak = localStorage.getItem('fragmentoStreak') || 0; 
let letrasReveladas = 0;

// --- 2. MAPEAMENTO DO DOM ---
const inputGuess = document.getElementById('guess-input');
const btnSubmit = document.getElementById('submit-btn');
const btnNextLevel = document.getElementById('next-level-btn');
const attemptsCount = document.getElementById('attempts-count');
const feedbackMsg = document.getElementById('feedback-message');
const streakCount = document.getElementById('streak-count');
const inputGroup = document.querySelector('.input-group');
const mysteryBox = document.getElementById('mystery-text');
const levelDisplay = document.getElementById('level-display');
const btnShare = document.getElementById('share-btn');
const btnSacrifice = document.getElementById('sacrifice-btn');
const statusElement = document.querySelector('.status-line span'); // Para o Rank

streakCount.innerText = streak;

// --- 3. SISTEMA DE RANK (PATENTES) ---
function atualizarRank() {
    // Essa função lê o streak e muda o texto de status
    if (streak <= 2) feedbackMsg.dataset.rank = "SCRIPT KIDDIE";
    else if (streak <= 5) feedbackMsg.dataset.rank = "INVASOR DE SISTEMAS";
    else if (streak <= 9) feedbackMsg.dataset.rank = "CYBER MERCENÁRIO";
    else feedbackMsg.dataset.rank = "FANTASMA DIGITAL";
    
    // Atualiza o texto visual de status no topo
    const statusLabel = document.querySelector('.status-line');
    if(statusLabel) {
        statusLabel.innerHTML = `STATUS: <span class="highlight">${feedbackMsg.dataset.rank}</span>`;
    }
}

// --- 4. FUNÇÕES DE CARREGAMENTO ---
async function iniciarJogo() {
    try {
        const resposta = await fetch('niveis.json');
        niveis = await resposta.json();
        carregarNivel(nivelAtualIndex);
    } catch (erro) {
        mysteryBox.innerHTML = "<span class='alert'>ERRO CRÍTICO: CONEXÃO FALHOU.</span>";
    }
}

function carregarNivel(index) {
    letrasReveladas = 0;
    tentativas = 5;
    
    // Limpa efeitos de emergência
    document.body.style.animation = "none";
    
    // CHAMADA DO RANK: Atualiza o título ao começar o nível
    atualizarRank();

    btnSacrifice.style.display = streak > 0 ? "block" : "none";
    btnShare.style.display = "none";
    attemptsCount.innerText = tentativas;
    feedbackMsg.innerText = "";
    inputGuess.disabled = false;
    btnSubmit.style.display = "block";
    btnNextLevel.style.display = "none";
    inputGuess.value = "";
    inputGuess.focus();

    const nivel = niveis[index];
    respostaCorreta = nivel.alvo;
    levelDisplay.innerText = nivel.id;

    let textoFormatado = nivel.texto.replace(/\[(.*?)\]/g, '<span class="censored">$1</span>');
    mysteryBox.innerHTML = textoFormatado;
}

// --- 5. LÓGICA DE JOGO ---
function normalizarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

function processarChute() {
    if (tentativas <= 0) return;
    const chute = normalizarTexto(inputGuess.value);
    
    if (chute === "ILLUMINATI") {
        tocarSom('sucesso');
        document.body.style.backgroundColor = "#2b0000";
        darTremidaErro("ELES ESTÃO VENDO...");
        return;
    }

    if (chute === "") {
        tocarSom('erro');
        darTremidaErro("DIGITE UM NOME.");
        return;
    }

    if (chute === normalizarTexto(respostaCorreta)) vencerJogo();
    else errarChute();
    inputGuess.value = "";
}

function errarChute() {
    tocarSom('erro');
    tentativas--;
    attemptsCount.innerText = tentativas;

    // MODO EMERGÊNCIA: Tela pulsa vermelho se tiver só 1 vida
    if (tentativas === 1) {
        document.body.style.animation = "pulse-red 0.5s infinite";
        feedbackMsg.innerText = "⚠️ SISTEMA CRÍTICO!";
    }

    darTremidaErro("ALVO INCORRETO.");

    const censuredWords = Array.from(document.querySelectorAll('.censored'));
    const palavraParaRevelar = censuredWords.find(word => !word.classList.contains('revealed'));
    if (palavraParaRevelar) revelarComGlitch(palavraParaRevelar);

    if (tentativas === 0) perderJogo();
}

function vencerJogo() {
    feedbackMsg.innerText = `ACESSO AUTORIZADO: ${respostaCorreta}.`;
    finalizarRodada(true);
}

function perderJogo() {
    feedbackMsg.innerText = `ACESSO NEGADO. O ALVO ERA ${respostaCorreta}.`;
    finalizarRodada(false);
}

function finalizarRodada(venceu) {
    if (venceu) {
        tocarSom('sucesso');
        streak++;
    } else {
        tocarSom('erro');
        streak = 0;
        document.body.style.animation = "none";
    }
    
    localStorage.setItem('fragmentoStreak', streak);
    streakCount.innerText = streak;
    
    // CHAMADA DO RANK: Atualiza o título após ganhar ou perder pontos
    atualizarRank();

    btnShare.style.display = "block";
    inputGuess.disabled = true;
    btnSubmit.style.display = "none";
    
    const censuredWords = Array.from(document.querySelectorAll('.censored'));
    censuredWords.forEach(word => word.classList.add('revealed'));

    if (nivelAtualIndex < niveis.length - 1) {
        btnNextLevel.style.display = "block";
    }
}

function darTremidaErro(mensagem) {
    feedbackMsg.innerText = mensagem;
    inputGroup.classList.add('shake');
    setTimeout(() => inputGroup.classList.remove('shake'), 400);
}

// --- 6. EVENTOS E AUDIO ---
btnSubmit.addEventListener('click', processarChute);
inputGuess.addEventListener('keypress', (e) => { if (e.key === 'Enter') processarChute(); });
inputGuess.addEventListener('input', () => { tocarSom('tecla'); });
btnNextLevel.addEventListener('click', () => { nivelAtualIndex++; carregarNivel(nivelAtualIndex); });

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function tocarSom(tipo) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g); g.connect(audioCtx.destination);
    if (tipo === 'tecla') { osc.type = 'square'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05); osc.start(); osc.stop(audioCtx.currentTime + 0.05); }
    else if (tipo === 'erro') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); osc.start(); osc.stop(audioCtx.currentTime + 0.3); }
    else if (tipo === 'sucesso') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime); osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.1); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); osc.start(); osc.stop(audioCtx.currentTime + 0.3); }
}

function revelarComGlitch(el) {
    const orig = el.innerText; el.classList.add('revealed');
    let i = 0;
    const int = setInterval(() => {
        el.innerText = orig.split("").map((l, idx) => idx < i ? orig[idx] : "X#$%"[Math.floor(Math.random()*4)]).join("");
        if (i >= orig.length) clearInterval(int);
        i += 1/3;
    }, 30);
}

// --- 7. EFEITO MATRIX ---
const canvas = document.getElementById('matrix-canvas');
if(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const chars = "01".split("");
    const drops = [];
    for (let x = 0; x < canvas.width/15; x++) drops[x] = 1;
    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#0F0"; ctx.font = "15px monospace";
        drops.forEach((y, i) => {
            ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*15, y*15);
            if (y*15 > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
    }
    setInterval(draw, 50);
}

btnShare.addEventListener('click', () => { /* ... sua logica de share ... */ });
btnSacrifice.addEventListener('click', () => { 
    if(streak > 0) { 
        streak--; localStorage.setItem('fragmentoStreak', streak); 
        streakCount.innerText = streak; 
        letrasReveladas++; 
        inputGuess.value = respostaCorreta.substring(0, letrasReveladas);
        tocarSom('tecla');
        atualizarRank();
    }
});

iniciarJogo();