// --- 1. VARIÁVEIS GLOBAIS ---
let niveis = [];
let nivelAtualIndex = 0;
let respostaCorreta = "";
let tentativas = 5;
let streak = localStorage.getItem('fragmentoStreak') || 0; 

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
let letrasReveladas = 0; // Para saber quantas letras da dica já demos

streakCount.innerText = streak;

// --- 3. CARREGANDO O JSON E MONTANDO A TELA ---
// Essa função busca o arquivo JSON (Precisa do Live Server rodando!)
async function iniciarJogo() {
    try {
        const resposta = await fetch('niveis.json');
        niveis = await resposta.json();
        carregarNivel(nivelAtualIndex);
    } catch (erro) {
        mysteryBox.innerHTML = "<span class='alert'>ERRO CRÍTICO: FALHA AO CONECTAR COM BANCO DE DADOS TEMPORAL.</span>";
        console.error("Erro ao carregar o JSON:", erro);
    }
}

function carregarNivel(index) {
    // Reseta as variáveis para o novo nível
    letrasReveladas = 0; // Reseta as dicas
    // Mostra o botão de sacrifício apenas se ele tiver streak > 0
    btnSacrifice.style.display = streak > 0 ? "block" : "none";
    btnShare.style.display = "none";
    tentativas = 5;
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

    // A MÁGICA: Transforma [palavra] em <span class="censored">palavra</span>
    let textoFormatado = nivel.texto.replace(/\[(.*?)\]/g, '<span class="censored">$1</span>');
    mysteryBox.innerHTML = textoFormatado;
}

// --- 4. LÓGICA DE JOGO ---
function normalizarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

function processarChute() {
    if (tentativas <= 0) return;

    const chute = normalizarTexto(inputGuess.value);
    
    if (chute === "") {
        tocarSom('erro');
        darTremidaErro("DIGITE UM NOME.");
        return;
    }

    // 🔥 O EASTER EGG (CÓDIGO SECRETO) 🔥
    if (chute === "ILLUMINATI") {
        tocarSom('sucesso');
        document.body.style.backgroundColor = "#2b0000"; // Deixa a tela vermelha escura
        darTremidaErro("VOCÊ ESTÁ SENDO OBSERVADO...");
        inputGuess.value = "";
        return;
    }

    if (chute === normalizarTexto(respostaCorreta)) {
        vencerJogo();
    } else {
        errarChute();
    }
    inputGuess.value = "";
}
function errarChute() {
    tocarSom('erro'); // <--- SOM DE ERRO ADICIONADO AQUI
    tentativas--;
    attemptsCount.innerText = tentativas;
    darTremidaErro("ALVO INCORRETO. DESCRIPTOGRAFANDO DADOS...");

    // Pega as palavras censuradas do nível atual
    const censuredWords = Array.from(document.querySelectorAll('.censored'));
    const palavraParaRevelar = censuredWords.find(word => !word.classList.contains('revealed'));
    
    // Revela com Glitch!
    if (palavraParaRevelar) {
        revelarComGlitch(palavraParaRevelar);
    }

    if (tentativas === 0) perderJogo();
}

function vencerJogo() {
    feedbackMsg.innerText = `ACESSO AUTORIZADO: ${respostaCorreta} CONFIRMADO.`;
    feedbackMsg.style.color = "#00ff41";
    finalizarRodada(true);
}

function perderJogo() {
    feedbackMsg.innerText = `ACESSO NEGADO. O ALVO ERA ${respostaCorreta}.`;
    feedbackMsg.style.color = "#ff3333";
    finalizarRodada(false);
}

function finalizarRodada(venceu) {
    // <--- SOM DE SUCESSO OU ERRO DEFINITIVO ADICIONADO AQUI
    if (venceu) {
        tocarSom('sucesso');
    } else {
        tocarSom('erro');
    }

    btnShare.style.display = "block";
    inputGuess.disabled = true;
    btnSubmit.style.display = "none";
    
    // Revela tudo que sobrou
    const censuredWords = Array.from(document.querySelectorAll('.censored'));
    censuredWords.forEach(word => word.classList.add('revealed'));

    if (venceu) {
        streak++;
        localStorage.setItem('fragmentoStreak', streak);
    } else {
        streak = 0;
        localStorage.setItem('fragmentoStreak', streak);
    }
    streakCount.innerText = streak;

    // Se tiver mais níveis, mostra o botão de próximo nível
    if (nivelAtualIndex < niveis.length - 1) {
        btnNextLevel.style.display = "block";
    } else {
        feedbackMsg.innerText += " VOCÊ ZEROU O BANCO DE DADOS ATUAL!";
    }
}

function darTremidaErro(mensagem) {
    feedbackMsg.innerText = mensagem;
    feedbackMsg.style.color = "#ffaa00";
    inputGroup.classList.add('shake');
    setTimeout(() => inputGroup.classList.remove('shake'), 400);
}

// --- 5. EVENTOS ---
btnSubmit.addEventListener('click', processarChute);
inputGuess.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !inputGuess.disabled) processarChute(); });

// <--- SOM DE DIGITAÇÃO ADICIONADO AQUI
inputGuess.addEventListener('input', (e) => {
    tocarSom('tecla');
    e.target.value = e.target.value.toUpperCase();
});

btnNextLevel.addEventListener('click', () => {
    tocarSom('tecla'); // Toca um click ao passar de nível
    nivelAtualIndex++;
    carregarNivel(nivelAtualIndex);
});

// Inicia o jogo ao carregar o script
iniciarJogo();

// --- 6. EFEITOS VISUAIS (GLITCH) ---
const caracteresGlitch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?;:";

function revelarComGlitch(elementoHTML) {
    const palavraOriginal = elementoHTML.innerText;
    elementoHTML.classList.add('revealed');
    
    let iteracao = 0;
    
    const intervaloGlitch = setInterval(() => {
        elementoHTML.innerText = palavraOriginal
            .split("")
            .map((letra, index) => {
                if (index < iteracao) {
                    return palavraOriginal[index];
                }
                return caracteresGlitch[Math.floor(Math.random() * caracteresGlitch.length)];
            })
            .join("");

        if (iteracao >= palavraOriginal.length) {
            clearInterval(intervaloGlitch);
            elementoHTML.innerText = palavraOriginal; 
        }

        iteracao += 1 / 3; 
    }, 30);
}

// --- 7. MOTOR DE VIRALIDADE (COMPARTILHAMENTO NATIVO/MAGNÉTICO) ---
btnShare.addEventListener('click', async () => {
    const nivelId = levelDisplay.innerText;
    const erros = 5 - tentativas;
    let quadradinhos = "";
    
    if (tentativas === 0 && !inputGuess.disabled === false) { 
        quadradinhos = "🟥🟥🟥🟥🟥";
    } else {
        for(let i=0; i < erros; i++) quadradinhos += "🟥";
        quadradinhos += "🟩";
        for(let i=0; i < (4 - erros); i++) quadradinhos += "⬛";
    }
    
    const textoCompartilhar = `SYS.FRAGMENTO | Arquivo #${nivelId}\nStatus: RESOLVIDO\nOfensiva: 🔥 ${streak}\n${quadradinhos}\n\nJogue em: https://ruilopes31.github.io/fragmento`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'SYS.FRAGMENTO',
                text: textoCompartilhar
            });
        } catch (err) {
            console.log('Compartilhamento cancelado pelo usuário.');
        }
    } else {
        navigator.clipboard.writeText(textoCompartilhar).then(() => {
            const textoOriginal = btnShare.innerText;
            btnShare.innerText = "CÓDIGO COPIADO! COLE NO WHATSAPP.";
            setTimeout(() => btnShare.innerText = textoOriginal, 3000);
        });
    }
});

// --- 8. MECÂNICA DE SACRIFÍCIO (AVERSÃO À PERDA) ---
btnSacrifice.addEventListener('click', () => {
    if (streak > 0) {
        tocarSom('tecla'); // Toca som ao sacrificar
        streak--;
        localStorage.setItem('fragmentoStreak', streak);
        streakCount.innerText = streak;
        
        letrasReveladas++;
        const dica = respostaCorreta.substring(0, letrasReveladas);
        
        inputGuess.value = dica;
        
        darTremidaErro(`DICA COMPRADA: O ALVO COMEÇA COM "${dica}". FOGUINHO CONSUMIDO.`);
        
        if (streak === 0) {
            btnSacrifice.style.display = "none";
        }
    }
});

// --- 9. MOTOR DE ÁUDIO (SINTETIZADOR RETRO) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function tocarSom(tipo) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const agora = audioCtx.currentTime;
    
    if (tipo === 'tecla') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, agora);
        gainNode.gain.setValueAtTime(0.1, agora);
        gainNode.gain.exponentialRampToValueAtTime(0.01, agora + 0.05);
        oscillator.start(agora);
        oscillator.stop(agora + 0.05);
        
    } else if (tipo === 'erro') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, agora);
        gainNode.gain.setValueAtTime(0.3, agora);
        gainNode.gain.exponentialRampToValueAtTime(0.01, agora + 0.3);
        oscillator.start(agora);
        oscillator.stop(agora + 0.3);
        
    } else if (tipo === 'sucesso') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, agora);
        oscillator.frequency.setValueAtTime(900, agora + 0.1);
        gainNode.gain.setValueAtTime(0.2, agora);
        gainNode.gain.exponentialRampToValueAtTime(0.01, agora + 0.3);
        oscillator.start(agora);
        oscillator.stop(agora + 0.3);
    }
}


// --- 10. EFEITO MATRIX NO FUNDO ---
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');

// Faz o canvas ocupar a tela toda
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*".split("");
const tamanhoFonte = 16;
const colunas = canvas.width / tamanhoFonte;

// Um array que guarda a posição Y de cada gota de código
const gotas = [];
for (let x = 0; x < colunas; x++) gotas[x] = 1;

function desenharMatrix() {
    // Pinta um fundo preto semi-transparente para dar o rastro
    ctx.fillStyle = "rgba(10, 10, 10, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff41"; // Verde hacker
    ctx.font = tamanhoFonte + "px monospace";

    for (let i = 0; i < gotas.length; i++) {
        // Pega uma letra aleatória
        const texto = letras[Math.floor(Math.random() * letras.length)];
        
        // Desenha a letra na tela
        ctx.fillText(texto, i * tamanhoFonte, gotas[i] * tamanhoFonte);

        // Se a gota chegou no fundo da tela (e um fator aleatório), volta pro topo
        if (gotas[i] * tamanhoFonte > canvas.height && Math.random() > 0.975) {
            gotas[i] = 0;
        }
        gotas[i]++; // Move a gota para baixo
    }
}
// Roda a animação a cada 50 milissegundos
setInterval(desenharMatrix, 50);