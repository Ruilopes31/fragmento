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
// --- 6. EVENTOS E COMPARTILHAMENTO ---
btnSubmit.addEventListener('click', processarChute);
inputGuess.addEventListener('keypress', e => { if(e.key === 'Enter') processarChute(); });

btnNextLevel.addEventListener('click', () => { 
    nivelAtualIndex++; 
    carregarNivel(nivelAtualIndex); 
});

// LÓGICA DO BOTÃO COMPARTILHAR
btnShare.addEventListener('click', () => {
    const statusAtual = document.querySelector('.status-line').innerText;
    const msg = `🎮 ${statusAtual}\n🔥 STREAK: ${streak}\n📂 ARQUIVO: #${nivelAtualIndex + 1}\n\nConsegui hackear o sistema! Você consegue superar meu score? 💻⚡`;

    if (navigator.share) {
        navigator.share({
            title: 'SYS.FRAGMENTO | Relatório',
            text: msg,
            url: window.location.href
        }).catch(err => console.log('Erro ao compartilhar', err));
    } else {
        // Fallback: Copia para o teclado se não houver suporte nativo
        navigator.clipboard.writeText(msg).then(() => {
            const originalMsg = feedbackMsg.innerHTML;
            feedbackMsg.innerHTML = `<span style="color:#0088ff">📋 RELATÓRIO COPIADO!</span>`;
            setTimeout(() => { feedbackMsg.innerHTML = originalMsg; }, 2000);
        });
    }
});

// BOTÃO DE SACRIFÍCIO (REVELAR LETRA)
btnSacrifice.addEventListener('click', () => { 
    if(streak > 0) { 
        streak--; 
        localStorage.setItem('fragmentoStreak', streak); 
        streakCount.innerText = streak; 
        letrasReveladas++; 
        // Preenche o input com o início da resposta correta
        inputGuess.value = respostaCorreta.substring(0, letrasReveladas);
        tocarSom('tecla');
        atualizarRank();
        if(streak === 0) btnSacrifice.style.display = "none";
    }
});