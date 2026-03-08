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
    // O /\[(.*?)\]/g é uma Regex que acha tudo entre colchetes
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
        darTremidaErro("DIGITE UM NOME.");
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
    tentativas--;
    attemptsCount.innerText = tentativas;
    darTremidaErro("ALVO INCORRETO. DESCRIPTOGRAFANDO DADOS...");

    // Pega as palavras censuradas do nível atual
    const censuredWords = Array.from(document.querySelectorAll('.censored'));
    const palavraParaRevelar = censuredWords.find(word => !word.classList.contains('revealed'));
    
    // ATUALIZAÇÃO AQUI: Em vez de só adicionar a classe, chamamos o Glitch!
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

btnNextLevel.addEventListener('click', () => {
    nivelAtualIndex++;
    carregarNivel(nivelAtualIndex);
});

// Inicia o jogo ao carregar o script
iniciarJogo();

// --- 6. EFEITOS VISUAIS (GLITCH) ---
const caracteresGlitch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?;:";

function revelarComGlitch(elementoHTML) {
    // 1. Salva a palavra original (ex: "elefantes") e revela o fundo
    const palavraOriginal = elementoHTML.innerText;
    elementoHTML.classList.add('revealed');
    
    let iteracao = 0;
    
    // 2. Inicia um loop rápido (a cada 30 milissegundos)
    const intervaloGlitch = setInterval(() => {
        elementoHTML.innerText = palavraOriginal
            .split("")
            .map((letra, index) => {
                // Se o índice for menor que a iteração, mostra a letra certa
                if (index < iteracao) {
                    return palavraOriginal[index];
                }
                // Senão, joga um caractere maluco no lugar
                return caracteresGlitch[Math.floor(Math.random() * caracteresGlitch.length)];
            })
            .join("");

        // 3. Quando revelar toda a palavra, para a animação
        if (iteracao >= palavraOriginal.length) {
            clearInterval(intervaloGlitch);
            elementoHTML.innerText = palavraOriginal; // Garante que terminou certinho
        }

        // Aumentar esse número deixa a revelação mais rápida. Diminuir deixa mais demorada.
        iteracao += 1 / 3; 
    }, 30);
}


// --- 7. MOTOR DE VIRALIDADE (COMPARTILHAMENTO NATIVO/MAGNÉTICO) ---
btnShare.addEventListener('click', async () => {
    const nivelId = levelDisplay.innerText;
    const erros = 5 - tentativas;
    let quadradinhos = "";
    
    // Monta os quadradinhos
    if (tentativas === 0 && !inputGuess.disabled === false) { 
        quadradinhos = "🟥🟥🟥🟥🟥";
    } else {
        for(let i=0; i < erros; i++) quadradinhos += "🟥";
        quadradinhos += "🟩";
        for(let i=0; i < (4 - erros); i++) quadradinhos += "⬛";
    }
    
    // O texto oficial com o seu link real
    const textoCompartilhar = `SYS.FRAGMENTO | Arquivo #${nivelId}\nStatus: RESOLVIDO\nOfensiva: 🔥 ${streak}\n${quadradinhos}\n\nJogue em: https://ruilopes31.github.io/fragmento`;
    
    // A MÁGICA: Verifica se o aparelho suporta o compartilhamento magnético (celulares)
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'SYS.FRAGMENTO',
                text: textoCompartilhar
            });
            // O celular vai abrir a gaveta de apps sozinho!
        } catch (err) {
            console.log('Compartilhamento cancelado pelo usuário.');
        }
    } else {
        // PLANO B: Se estiver no PC, apenas copia o texto para a área de transferência
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
        // Cobra o preço (Tira 1 ponto de ofensiva)
        streak--;
        localStorage.setItem('fragmentoStreak', streak);
        streakCount.innerText = streak;
        
        // Pega a próxima letra do alvo
        letrasReveladas++;
        const dica = respostaCorreta.substring(0, letrasReveladas);
        
        // Coloca a dica direto na caixa de texto
        inputGuess.value = dica;
        
        darTremidaErro(`DICA COMPRADA: O ALVO COMEÇA COM "${dica}". FOGUINHO CONSUMIDO.`);
        
        // Se o foguinho zerou, esconde o botão de sacrifício
        if (streak === 0) {
            btnSacrifice.style.display = "none";
        }
    }
});