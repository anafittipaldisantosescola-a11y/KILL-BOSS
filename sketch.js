// DEFESA ESPACIAL (SIMULAÇÃO FPS) - p5.js
// NOVO RECURSO: Radar Tático de Submarino, Chefões mais fortes E AGORA Chefões ATACAM!

// === Variáveis Globais ===
let imgMonstro;
let imgFundo;
let imgBoss;
let imgResgate; // NOVA IMAGEM PARA A FASE FINAL

// --- Fundos Dinâmicos Padrão (Fases Normais) ---
const FUNDOS_DINAMICOS_FASE = [
    [0, 0, 50],     // Ciclo 1: Azul Escuro (Padrão)
    [50, 0, 0],     // Ciclo 2: Vermelho Escuro (Padrão)
    [0, 50, 0],     // Ciclo 3: Verde Escuro (Padrão)
    [50, 50, 0],    // Ciclo 4: Amarelo/Ouro Escuro (Padrão)
    [0, 50, 50],    // Ciclo 5: Ciano Escuro (Padrão)
    [50, 0, 50],    // Ciclo 6: Magenta Escuro (Padrão)
    [20, 20, 20]    // Ciclo 7: Cinza Quase Preto (Padrão)
];

// --- Fundos Boss Fight (Mais Dramáticos) ---
const FUNDOS_DINAMICOS_BOSS = [
    [100, 0, 0],    // Fundo 1 (BOSS): Vermelho Alarme
    [20, 0, 40],    // Fundo 2 (BOSS): Roxo Sombrio
    [100, 50, 0],   // Fundo 3 (BOSS): Laranja Crítico
    [5, 5, 5]       // Fundo 4 (BOSS): Vazio da Morte
];

let corFundoAtual = FUNDOS_DINAMICOS_FASE[0]; 
let estadoJogo = 'MENU';

// --- FASES E PROGRESSO ---
const MAX_FASES = 250; // Total de fases para completar o jogo
let faseAtual = 1;     // Fase atual do jogador
const PONTOS_POR_FASE = 500; // Pontos necessários para avançar a dificuldade
const NIVEL_BOSS = 10;
let bossAtivo = false;
let bossCiclosCompletos = 0; 
const PONTUACAO_FINAL = 9007199254740991; 

// --- Câmera / Posição do Jogador no Mundo ---
let jogadorX = 0;
let jogadorY = 0;
let anguloVisao = 0;
let velocidadeMovimento = 4;
let jogadorVida = 3;
let jogadorVidaMaxima = 3;

// --- Dificuldade e Monstros ---
let monstros = [];
let monstroTamanho = 40;
let velocidadeMonstro = 1.0;
let intervaloMonstro = 100;
let contadorMonstro = 0;
const vidaBaseMonstro = 1;

// --- Combate (Tiros do Jogador) ---
let tiros = [];
let tiroTamanho = 5;
let velocidadeTiro = 15;
let ultimoTiroTempo = 0;
let intervaloTiro = 100;
let danoBaseTiro = 15;
let chanceCritico = 0;
let raioExplosao = 0;

// === NOVO: Projéteis dos Inimigos (Ataque do Chefão) ===
let projeteisInimigos = [];
let velocidadeProjetilInimigo = 5;
let danoProjetilInimigo = 1; 
// =========================================================

// --- Placar e High Score ---
let pontuacao = 0;
let moeda = 0;
let highScore = 0;

// --- LOJA / CHAT ---
let custoVida = 100;
let custoVelocidade = 150;
let custoIntervaloTiro = 200;
let custoVelocidadeTiro = 250;
let custoDanoBase = 300;
let custoChanceCritico = 400;
let custoRaioExplosao = 500;
let inputChat;
const CODIGO_MODO = 'CODIGO';
let sensibilidadeTeclado = 0.1; 

// --- Radar ---
let radarAngulo = 0;
const RADAR_RAIO = 100;
const MAX_DISTANCIA_RADAR = 600; 

// === CÓDIGOS DE MESTRE ===
const MASTER_KEY_SKIP = 'ABRIRFASE249'; 
// =========================

// ===================================
// === FUNÇÕES ESSENCIAIS DO p5.js ===
// ===================================

function preload() {
    try {
        // Tente carregar imagens reais. Se falhar, usa placeholders.
        imgFundo = loadImage('9gus5pd7tl9z.gif');
        imgMonstro = loadImage('monster-boss.gif');
        imgBoss = loadImage('monster-boss.gif');
        imgResgate = loadImage('009653dded11b874ef899d0579bc67449b7d657dr1-465-600_hq.gif'); 
    } catch(e) {
         console.error("Erro ao carregar imagens. Usando placeholders.");
         // Placeholders de 1x1 para evitar erros de renderização
         imgFundo = { width: 1, height: 1, loadPixels: () => {}, updatePixels: () => {} };
         imgMonstro = { width: 1, height: 1, loadPixels: () => {}, updatePixels: () => {} };
         imgBoss = { width: 1, height: 1, loadPixels: () => {}, updatePixels: () => {} };
         imgResgate = { width: 1, height: 1, loadPixels: () => {}, updatePixels: () => {} };
    }
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    
    imageMode(CENTER);
    angleMode(RADIANS);
    frameRate(30);

    let savedHighScore = getItem('highScore');
    if (savedHighScore !== null) {
        highScore = parseInt(savedHighScore);
    }

    inputChat = createInput('');
    inputChat.position(width / 2 - 150, height - 30);
    inputChat.size(300);
    inputChat.attribute('placeholder', 'Digite o código aqui...');
    inputChat.hide();
    inputChat.changed(processarCodigo);
    
    canvas.elt.addEventListener('click', () => {
        if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
            requestPointerLock();
        }
    });
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    inputChat.position(width / 2 - 150, height - 30);
}


function resetarEstadoFase() {
    // Reseta apenas o estado de JOGANDO (Monstros, Posição)
    jogadorX = 0;
    jogadorY = 0;
    anguloVisao = 0;
    monstros = [];
    tiros = [];
    projeteisInimigos = []; // NOVO: Limpa projéteis inimigos
    bossAtivo = false;
    contadorMonstro = 0;
}


function reiniciarJogo() {
    // Reseta o estado da fase
    resetarEstadoFase();
    
    // Reseta progresso e estatísticas (Hard Reset)
    jogadorVida = 3;
    jogadorVidaMaxima = 3;
    pontuacao = 0;
    moeda = 0;
    faseAtual = 1; // REINICIA FASE
    bossCiclosCompletos = 0; 
    
    // Resetar Dificuldade e Upgrades
    velocidadeMonstro = 1.0;
    intervaloMonstro = 100;
    velocidadeMovimento = 4;
    intervaloTiro = 100;
    velocidadeTiro = 15;
    danoBaseTiro = 15;
    chanceCritico = 0;
    raioExplosao = 0;
    
    // Resetar custos da loja
    custoVida = 100;
    custoVelocidade = 150;
    custoIntervaloTiro = 200;
    custoVelocidadeTiro = 250;
    custoDanoBase = 300;
    custoChanceCritico = 400;
    custoRaioExplosao = 500;
    
    inputChat.hide();
    
    estadoJogo = 'JOGANDO';
}


function draw() {
    // ⭐️ LÓGICA DO FUNDO DINÂMICO POR FASE
    if (estadoJogo === 'JOGANDO' || estadoJogo === 'PAUSE_FIM_FASE') {
        // Fases normais (FUNDO PADRÃO)
        let indiceCor = floor((faseAtual - 1) / NIVEL_BOSS) % FUNDOS_DINAMICOS_FASE.length;
        corFundoAtual = FUNDOS_DINAMICOS_FASE[indiceCor];
    } else if (estadoJogo === 'BOSS_FIGHT') {
        // FASE DE CHEFÃO (FUNDO DRAMÁTICO)
        let indiceCorBoss = bossCiclosCompletos % FUNDOS_DINAMICOS_BOSS.length;
        corFundoAtual = FUNDOS_DINAMICOS_BOSS[indiceCorBoss];
        
        // Brilho sutil para Boss
        let r = corFundoAtual[0] + sin(frameCount * 0.1) * 10;
        let g = corFundoAtual[1] + sin(frameCount * 0.1) * 10;
        let b = corFundoAtual[2] + sin(frameCount * 0.1) * 10;
        corFundoAtual = [r, g, b];
    }

    // Aplica o fundo (se não for Menu ou Resgate)
    if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT' || estadoJogo === 'PAUSE_FIM_FASE') {
        if (imgFundo.width > 1) { 
             tint(corFundoAtual[0], corFundoAtual[1], corFundoAtual[2], 150); // Aplica a cor como um filtro
             image(imgFundo, width / 2, height / 2, width, height); 
             noTint();
        } else {
             background(corFundoAtual[0], corFundoAtual[1], corFundoAtual[2]);
        }
    } else if (estadoJogo !== 'RESGATE_PRINCESA') {
        if (imgFundo.width > 1) { 
            image(imgFundo, width / 2, height / 2, width, height); 
        } else {
            background(0);
        }
    }
    // ⭐️ FIM DA LÓGICA DO FUNDO DINÂMICO
    
    if (estadoJogo === 'MENU') {
        desenharMenuInicialFPS();
        return;
    }

    if (estadoJogo === 'LOJA') {
        desenharLojaFPS();
        return;
    }
    
    if (estadoJogo === CODIGO_MODO) {
        desenharModoCodigoFPS();
        return;
    }
    
    if (estadoJogo === 'MAPA_DE_FASES') { 
        desenharTelaMapaDeFases();
        return;
    }
    
    if (estadoJogo === 'RESGATE_PRINCESA') { 
        desenharTelaResgatePrincesa();
        return;
    }


    if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
        moverJogadorFPS();
        
        // ROTAÇÃO POR TECLADO
        if (keyIsDown(LEFT_ARROW)) {
            anguloVisao -= sensibilidadeTeclado;
        }
        if (keyIsDown(RIGHT_ARROW)) {
            anguloVisao += sensibilidadeTeclado;
        }

        gerarMonstrosFPS();
        gerenciarMonstrosFPS();
        gerenciarTirosFPS();
        gerenciarProjéteisInimigos(); // NOVO: Gerencia projéteis inimigos
        
        verificarColisoesTiroMonstroFPS();
        verificarColisoesMonstroJogadorFPS();
        verificarColisoesProjetilInimigoJogador(); // NOVO: Colisão de projéteis inimigos

        desenharMonstrosFPS();
        desenharTirosFPS();
        desenharProjéteisInimigos(); // NOVO: Desenha projéteis inimigos
        
        desenharMira();
        desenharPlacarFPS();
        desenharRadar(); 
        
    } else if (estadoJogo === 'GAMEOVER') {
        desenharGameOverFPS();
    } else if (estadoJogo === 'VITORIA') { 
        estadoJogo = 'RESGATE_PRINCESA'; 
    } else if (estadoJogo === 'PAUSE_FIM_FASE') {
        desenharTelaFimFase();
    }
}


// =================================================================
// === FUNÇÕES NOVAS PARA O ATAQUE DOS CHEFÕES (Projéteis Inimigos) ===
// =================================================================

/**
 * Cria um novo projétil inimigo direcionado ao jogador.
 * É usado apenas por Chefões na função gerenciarProjéteisInimigos().
 */
function atirarProjetil(x, y, velocidade, tamanho, dano) {
    let dirX = jogadorX - x;
    let dirY = jogadorY - y;
    let magnitude = dist(0, 0, dirX, dirY);
    
    // Normaliza e aplica velocidade
    let vx = (dirX / magnitude) * velocidade;
    let vy = (dirY / magnitude) * velocidade;
    
    let novoProjetil = {
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        tamanho: tamanho,
        dano: dano
    };
    projeteisInimigos.push(novoProjetil);
}

/**
 * Gerencia o movimento dos projéteis inimigos e o ataque dos Chefões.
 */
function gerenciarProjéteisInimigos() {
    // 1. Lógica de Ataque dos Chefões
    if (estadoJogo === 'BOSS_FIGHT' && frameCount % 30 === 0) { // Ataque a cada 30 frames (1 segundo)
        for (let monstro of monstros) {
            if (monstro.isBoss) {
                // Chefões atiram projéteis grandes, mas lentos
                atirarProjetil(
                    monstro.x, 
                    monstro.y, 
                    velocidadeProjetilInimigo * 0.8, // Velocidade reduzida
                    monstroTamanho * 0.8,           // Tamanho maior
                    danoProjetilInimigo
                );
            }
        }
    }

    // 2. Movimento dos Projéteis
    for (let i = projeteisInimigos.length - 1; i >= 0; i--) {
        projeteisInimigos[i].x += projeteisInimigos[i].vx;
        projeteisInimigos[i].y += projeteisInimigos[i].vy;

        let d = dist(projeteisInimigos[i].x, projeteisInimigos[i].y, jogadorX, jogadorY);
        // Remove projéteis que saíram muito do mapa (para otimização)
        if (d > 1000) {
            projeteisInimigos.splice(i, 1);
        }
    }
}

/**
 * Verifica se um projétil inimigo atingiu o jogador.
 */
function verificarColisoesProjetilInimigoJogador() {
    let raioJogador = 10;
    
    for (let i = projeteisInimigos.length - 1; i >= 0; i--) {
        let projetil = projeteisInimigos[i];
        let d = dist(jogadorX, jogadorY, projetil.x, projetil.y);
        
        if (d < raioJogador + projetil.tamanho / 2) {
            jogadorVida -= projetil.dano;
            projeteisInimigos.splice(i, 1);
            
            if (jogadorVida <= 0) {
                estadoJogo = 'GAMEOVER';
                document.exitPointerLock();
            }
        }
    }
}

/**
 * Desenha os projéteis inimigos na perspectiva 3D (FPS).
 */
function desenharProjéteisInimigos() {
    // Ordena para desenhar os mais distantes primeiro (para perspectiva correta)
    projeteisInimigos.sort((a, b) => {
        let distA = dist(a.x, a.y, jogadorX, jogadorY);
        let distB = dist(b.x, b.y, jogadorX, jogadorY);
        return distB - distA; 
    });

    for (let projetil of projeteisInimigos) {
        let relX = projetil.x - jogadorX;
        let relY = projetil.y - jogadorY;

        let rotX = relX * cos(-anguloVisao) - relY * sin(-anguloVisao);
        let rotY = relX * sin(-anguloVisao) + relY * cos(-anguloVisao);
        
        // Não desenha se estiver atrás da câmera
        if (rotX < 10) continue;
        
        let escala = 1 / rotX * 150;
        let tamanhoNaTela = projetil.tamanho * escala;
        let projX = rotY * escala * 2 + width / 2;
        let projY = height / 2;

        if (projX > -tamanhoNaTela && projX < width + tamanhoNaTela) {
            fill(255, 0, 0, 200); // Projéteis vermelhos
            noStroke();
            ellipse(projX, projY, tamanhoNaTela, tamanhoNaTela);
        }
    }
}

// =================================================================
// === FIM DAS FUNÇÕES NOVAS ===
// =================================================================


function keyPressed() {
    if ((estadoJogo === 'MENU' || estadoJogo === 'GAMEOVER' || estadoJogo === 'RESGATE_PRINCESA') && (key === 'e' || key === 'E')) {
        reiniciarJogo();
        return;
    }
    
    // ATIRAR COM A BARRA DE ESPAÇO
    if (key === ' ') {
        if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
            atirarFPS();
        }
        return false; 
    }

    // [1] LOJA
    if (key === '1') {
        if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
            estadoJogo = 'LOJA';
            document.exitPointerLock();
        }
        inputChat.hide();
        return;
    }
    
    // [M] MAPA DE FASES
    if (key === 'M' || key === 'm') {
        if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
            estadoJogo = 'MAPA_DE_FASES';
            document.exitPointerLock();
            return;
        } else if (estadoJogo === 'MAPA_DE_FASES') {
            estadoJogo = bossAtivo ? 'BOSS_FIGHT' : 'JOGANDO';
            requestPointerLock();
            return;
        }
    }


    // [L] FECHAR LOJA
    if (key === 'L' || key === 'l') {
        if (estadoJogo === 'LOJA') {
            estadoJogo = bossAtivo ? 'BOSS_FIGHT' : 'JOGANDO';
        }
        return;
    }
    
    // [T] CÓDIGO
    if (key === 'T' || key === 't') {
        if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
            estadoJogo = CODIGO_MODO;
            inputChat.show();
            inputChat.elt.focus();
            document.exitPointerLock();
        }
        return;
    }
    
    // [0] FECHAR CÓDIGO
    if (key === '0') {
        if (estadoJogo === CODIGO_MODO) {
            estadoJogo = bossAtivo ? 'BOSS_FIGHT' : 'JOGANDO';
            inputChat.hide();
            requestPointerLock();
        }
        return;
    }
    
    if (estadoJogo === 'LOJA') {
        comprarItemFPS(key);
        return;
    }
}

function mouseClicked() {
    if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
        atirarFPS();
    }
    
    // LÓGICA DO BOTÃO CONTINUAR (PAUSE_FIM_FASE)
    if (estadoJogo === 'PAUSE_FIM_FASE') {
        let btnW = 200;
        let btnH = 50;
        let btnX = width / 2 - btnW / 2;
        let btnY = height / 2 + 100;
        
        if (mouseX > btnX && mouseX < btnX + btnW &&
            mouseY > btnY && mouseY < btnY + btnH) {
            
            faseAtual++;
            estadoJogo = 'JOGANDO';
            requestPointerLock();
        }
        return;
    }

    // === SELEÇÃO DE FASES CONCLUÍDAS NO MAPA ===
    if (estadoJogo === 'MAPA_DE_FASES') {
        const espacamento = 25;
        const faseTamanho = 15;
        const fasesPorLinha = floor((width - 60) / espacamento); 
        
        let startX = (width - fasesPorLinha * espacamento) / 2 + faseTamanho / 2;
        let startY = 100;

        for (let i = 1; i < faseAtual; i++) { // Percorre APENAS fases JÁ CONCLUÍDAS (i < faseAtual)
            let linha = floor((i - 1) / fasesPorLinha);
            let coluna = (i - 1) % fasesPorLinha;
            
            let x = startX + coluna * espacamento;
            let y = startY + linha * espacamento;
            
            let d = dist(mouseX, mouseY, x, y);
            
            if (d < faseTamanho / 2) {
                // CLICOU EM UMA FASE JÁ CONCLUÍDA
                faseAtual = i;
                resetarEstadoFase(); // Limpa monstros, posição E PROJÉTEIS
                
                // Recalcula a dificuldade e o status de Boss
                bossCiclosCompletos = floor((faseAtual - 1) / NIVEL_BOSS);
                
                estadoJogo = 'JOGANDO';
                requestPointerLock();
                return;
            }
        }
    }
}


// ===================================
// === FUNÇÕES DE JOGO (MOVIMENTO, COMBATE, BOSS, FASES) ===
// ===================================

function gerenciarFimFase() {
    // 1. Aumenta a contagem de ciclos (usado para escalonar a dificuldade e spawnar o próximo boss)
    bossCiclosCompletos++; 
    
    // 2. Aplica os bônus de fase (Progresso de dificuldade)
    pontuacao += 15000;
    moeda += 5000;
    velocidadeMonstro *= 1.1;
    intervaloMonstro = max(50, intervaloMonstro - 10);
    
    // Zera monstros e projéteis para o próximo loop 
    monstros = [];
    projeteisInimigos = []; // Garante que não haja projéteis na próxima fase

    // 3. Verifica se a fase é a última (FASE 250).
    if (faseAtual === MAX_FASES) {
        pontuacao = PONTUACAO_FINAL;
        // Transição imediata para a tela de resgate/final
        estadoJogo = 'RESGATE_PRINCESA'; 
        document.exitPointerLock();
        return;
    }
    
    // 4. Se não for a última, pausa o jogo para o botão 'Continuar'.
    estadoJogo = 'PAUSE_FIM_FASE';
    document.exitPointerLock();
}


function verificarColisoesTiroMonstroFPS() {
    for (let i = tiros.length - 1; i >= 0; i--) {
        for (let j = monstros.length - 1; j >= 0; j--) {
            let tiro = tiros[i];
            let monstro = monstros[j];
            
            let d = dist(tiro.x, tiro.y, monstro.x, monstro.y);

            if (d < tiroTamanho / 2 + monstro.tamanho / 2) {
                let danoCausado = tiro.dano;
                let pontosBase = danoCausado;
                let ganhoMoeda = 50;
                
                if (random(1) < chanceCritico) {
                    danoCausado *= 2;
                    pontosBase *= 2;
                    ganhoMoeda *= 2;
                }
                
                pontuacao += pontosBase;
                moeda += ganhoMoeda;
                monstro.vida -= danoCausado;

                if (monstro.vida <= 0) {
                    monstros.splice(j, 1);
                    
                    if (monstro.isBoss) {
                        pontuacao += 5000;
                        moeda += 1000;
                        
                        if (!monstros.some(m => m.isBoss)) {
                            bossAtivo = false;
                            gerenciarFimFase(); // PAUSA E PREPARA PRÓXIMA FASE
                            return; 
                        }
                        break;
                    }
                }
                
                tiros.splice(i, 1);
                break;
            }
        }
    }
}


function calcularNivel() {
    let scoreLimitado = min(pontuacao, PONTUACAO_FINAL);
    return floor(scoreLimitado / PONTOS_POR_FASE) + 1;
}

function moverJogadorFPS() {
    let sensibilidadeMouse = 0.005;
    
    if (document.pointerLockElement === canvas.elt) {
        let deltaX = movedX;
        anguloVisao += deltaX * sensibilidadeMouse;
    }

    let dirX = cos(anguloVisao);
    let dirY = sin(anguloVisao);
    let vel = velocidadeMovimento;

    if (keyIsDown(87)) { // W
        jogadorX += dirX * vel;
        jogadorY += dirY * vel;
    } else if (keyIsDown(83)) { // S
        jogadorX -= dirX * vel;
        jogadorY -= dirY * vel;
    }

    if (keyIsDown(65)) { // A
        jogadorX += dirY * vel;
        jogadorY -= dirX * vel;
    } else if (keyIsDown(68)) { // D
        jogadorX -= dirY * vel;
        jogadorY += dirX * vel;
    }
}


function gerarMonstrosFPS() {
    let nivelAtual = calcularNivel();
    const limiteNivelBoss = (bossCiclosCompletos * NIVEL_BOSS) + NIVEL_BOSS;
    let deveTerBoss = nivelAtual >= limiteNivelBoss; 

    if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
        
        if (deveTerBoss && !bossAtivo) {
            
            jogadorVida += 5;
            jogadorVidaMaxima += 5;
            danoBaseTiro += 150;
            
            estadoJogo = 'BOSS_FIGHT';
            bossAtivo = true;
            monstros = [];
            contadorMonstro = 0;

            const NUM_BOSSES = 3;
            let ciclo = bossCiclosCompletos; 
            
            // ** NOVO: Aumento da Vida do Chefão mais acentuado **
            let vidaBoss = 5000 + (ciclo * 1000) + (ciclo * ciclo * 50); // Vida base de 5000 + escalonamento
            // ****************************************************

            for (let i = 0; i < NUM_BOSSES; i++) {
                let distancia = 400 + i * 50;
                let angulo = random(TWO_PI);
                
                let x = jogadorX + cos(angulo) * distancia;
                let y = jogadorY + sin(angulo) * distancia;

                let novoBoss = {
                    x: x,
                    y: y,
                    tamanho: monstroTamanho * 2.5,
                    vida: vidaBoss,
                    vidaMaxima: vidaBoss,
                    velocidade: velocidadeMonstro * 0.8,
                    isBoss: true,
                    id: i
                };
                monstros.push(novoBoss);
            }

        } else if (!bossAtivo && estadoJogo === 'JOGANDO') {
            contadorMonstro++;
            if (contadorMonstro > intervaloMonstro) {
                let distanciaMin = 300;
                let angulo = random(TWO_PI);
                
                let x = jogadorX + cos(angulo) * distanciaMin + random(-50, 50);
                let y = jogadorY + sin(angulo) * distanciaMin + random(-50, 50);

                let vidaMonstro = vidaBaseMonstro + floor(pontuacao / 200);

                let novoMonstro = {
                    x: x,
                    y: y,
                    tamanho: monstroTamanho,
                    vida: vidaMonstro,
                    vidaMaxima: vidaMonstro,
                    velocidade: velocidadeMonstro,
                    isBoss: false
                };
                monstros.push(novoMonstro);
                contadorMonstro = 0;
            }
        }
    }
}

function gerenciarMonstrosFPS() {
    for (let monstro of monstros) {
        let dirX = jogadorX - monstro.x;
        let dirY = jogadorY - monstro.y;
        let magnitude = dist(0, 0, dirX, dirY);

        if (magnitude > 0) {
            monstro.x += (dirX / magnitude) * monstro.velocidade;
            monstro.y += (dirY / magnitude) * monstro.velocidade;
        }
    }
}

function atirarFPS() {
    if (millis() - ultimoTiroTempo > intervaloTiro) {
        let dirX = cos(anguloVisao);
        let dirY = sin(anguloVisao);
        
        let novoTiro = {
            x: jogadorX,
            y: jogadorY,
            vx: dirX * velocidadeTiro,
            vy: dirY * velocidadeTiro,
            dano: danoBaseTiro
        };
        tiros.push(novoTiro);
        ultimoTiroTempo = millis();
    }
}

function gerenciarTirosFPS() {
    for (let i = tiros.length - 1; i >= 0; i--) {
        tiros[i].x += tiros[i].vx;
        tiros[i].y += tiros[i].vy;

        let d = dist(tiros[i].x, tiros[i].y, jogadorX, jogadorY);
        if (d > 1000) {
            tiros.splice(i, 1);
        }
    }
}

function verificarColisoesMonstroJogadorFPS() {
    for (let i = monstros.length - 1; i >= 0; i--) {
        let monstro = monstros[i];
        
        let d = dist(jogadorX, jogadorY, monstro.x, monstro.y);
        let raioJogador = 10;
        
        if (d < raioJogador + monstro.tamanho / 2) {
            jogadorVida--;
            monstros.splice(i, 1);
            
            if (jogadorVida <= 0) {
                estadoJogo = 'GAMEOVER';
                document.exitPointerLock();
            }
        }
    }
}
function desenharMonstrosFPS() {
    monstros.sort((a, b) => {
        let distA = dist(a.x, a.y, jogadorX, jogadorY);
        let distB = dist(b.x, b.y, jogadorX, jogadorY);
        return distB - distA;
    });

    for (let monstro of monstros) {
        let relX = monstro.x - jogadorX;
        let relY = monstro.y - jogadorY;

        let rotX = relX * cos(-anguloVisao) - relY * sin(-anguloVisao);
        let rotY = relX * sin(-anguloVisao) + relY * cos(-anguloVisao);
        
        if (rotX < 10) continue;
        
        let distancia = rotX;
        let escala = 1 / distancia * 150;
        let tamanhoNaTela = monstro.tamanho * escala;
        
        let projX = rotY * escala * 2 + width / 2;
        let projY = height / 2;

        if (projX > -tamanhoNaTela && projX < width + tamanhoNaTela) {
            
            let imagemParaUsar = monstro.isBoss ? imgBoss : imgMonstro;

            if (monstro.isBoss) {
                let r = monstro.id === 0 ? 255 : 100;
                let g = monstro.id === 1 ? 255 : 100;
                let b = monstro.id === 2 ? 255 : 100;
                tint(r, g, b);
            }
            
            image(imagemParaUsar, projX, projY, tamanhoNaTela, tamanhoNaTela);
            noTint();

            let vidaAtual = monstro.vida;
            let vidaMaxima = monstro.vidaMaxima;
            let percentVida = vidaAtual / vidaMaxima;

            if (vidaAtual < vidaMaxima) {
                let barraLargura = tamanhoNaTela * 0.8;
                let barraAltura = monstro.isBoss ? 8 * escala : 3 * escala;
                let barraX = projX - barraLargura / 2;
                let barraY = projY - tamanhoNaTela / 2 - barraAltura * 2;

                fill(50, 50, 50, 150);
                rect(barraX, barraY, barraLargura, barraAltura);
                
                fill(255, 0, 0);
                rect(barraX, barraY, barraLargura * percentVida, barraAltura);
                
                if (monstro.isBoss) {
                    fill(255, 255, 0);
                    textSize(12 * escala);
                    textAlign(CENTER, BOTTOM);
                    text(`CHEFE ${monstro.id + 1} HP: ${floor(vidaAtual)}/${floor(vidaMaxima)}`, projX, barraY);
                }
            }
        }
    }
}

function desenharTirosFPS() {
    for (let tiro of tiros) {
        let relX = tiro.x - jogadorX;
        let relY = tiro.y - jogadorY;

        let rotX = relX * cos(-anguloVisao) - relY * sin(-anguloVisao);
        let rotY = relX * sin(-anguloVisao) + relY * cos(-anguloVisao);
        
        if (rotX < 10) continue;
        
        let escala = 1 / rotX * 150;
        let tamanhoNaTela = tiroTamanho * escala;
        let projX = rotY * escala * 2 + width / 2;
        let projY = height / 2;

        if (projX > -tamanhoNaTela && projX < width + tamanhoNaTela) {
            fill(255, 255, 0);
            noStroke();
            ellipse(projX, projY, tamanhoNaTela, tamanhoNaTela);
        }
    }
}
function desenharMira() {
    stroke(255, 0, 0);
    strokeWeight(2);
    line(width / 2 - 10, height / 2, width / 2 + 10, height / 2);
    line(width / 2, height / 2 - 10, width / 2, height / 2 + 10);
    noStroke();
    fill(255, 0, 0);
    ellipse(width/2, height/2, 4, 4);
}


function desenharPlacarFPS() {
    if (pontuacao > highScore) {
        highScore = pontuacao;
        storeItem('highScore', highScore);
    }
    
    fill(255);
    textSize(18);
    textAlign(LEFT, TOP);
    let nivel = calcularNivel();
    text(`Nível: ${nivel}`, 10, 10);

    // --- BARRA DE VIDA DO JOGADOR ---
    let barraLargura = 180;
    let barraAltura = 20;
    let margemY = 40;
    
    fill(50);
    rect(10, margemY, barraLargura, barraAltura);

    let percentVida = jogadorVida / jogadorVidaMaxima;
    let vidaLargura = barraLargura * percentVida;
    
    if (percentVida > 0.5) {
        fill(0, 200, 0);
    } else if (percentVida > 0.2) {
        fill(255, 200, 0);
    } else {
        fill(200, 0, 0);
    }
    
    rect(10, margemY, vidaLargura, barraAltura);

    fill(255);
    textAlign(CENTER, CENTER);
    text(`VIDA: ${jogadorVida} / ${jogadorVidaMaxima}`, 10 + barraLargura/2, margemY + barraAltura/2);
    // ------------------------------------------------
    
    textAlign(LEFT, TOP);
    text("Score: " + pontuacao, 10, 85);
    text("Moeda: " + moeda, 10, 110);
    
    // Exibe a maior pontuação
    fill(255, 255, 0);
    text("Maior Score: " + highScore, 10, 135);
    
    fill(255);
    text("[1] Loja | [T] Código | [M] Mapa", 10, 160); // Atualizado
    text("Mira: [Mouse] ou [Setas] | Tiro: [Clique] ou [Espaço]", 10, 185); 
    text(`Dano Base: ${danoBaseTiro}`, 10, 210);

    // --- MAPA DE FASES (Barra) ---
    desenharMapaDeFasesBarra();
    
    if (bossAtivo) {
        fill(255, 0, 0);
        textSize(30);
        textAlign(CENTER, TOP);
        text("3 CHEFÕES ATIVOS!", width / 2, 10);
        
        let bossesRestantes = monstros.filter(m => m.isBoss).length;
        fill(255, 255, 0);
        textSize(20);
        text(`Restantes: ${bossesRestantes}`, width / 2, 45);
        
    } else {
        let nivelParaBoss = (bossCiclosCompletos * NIVEL_BOSS) + NIVEL_BOSS;
        if (nivel === nivelParaBoss - 1) {
             fill(255, 255, 0);
             textSize(20);
             textAlign(CENTER, TOP);
             text("BOSS CHEFÃO NO PRÓXIMO NÍVEL!", width / 2, 10);
        }
    }
}

function desenharMapaDeFasesBarra() {
    const mapaY = height - 50;
    const mapaW = width - 40;
    const mapaH = 20;
    const mapaX = 20;
    
    // Fundo da barra
    fill(50, 50, 50);
    rect(mapaX, mapaY, mapaW, mapaH, 5);
    
    // Barra de progresso da fase
    let progresso = faseAtual / MAX_FASES;
    let progressoW = mapaW * progresso;
    fill(0, 255, 0); 
    rect(mapaX, mapaY, progressoW, mapaH, 5);
    
    // Texto de Fase
    fill(255);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(`FASE ${faseAtual} / ${MAX_FASES}`, mapaX + mapaW / 2, mapaY + mapaH / 2);
    
    // Ponto de Chegada (Última Fase)
    fill(255, 255, 0);
    rect(mapaX + mapaW - 5, mapaY - 10, 10, 40);
    
    if (faseAtual === MAX_FASES) {
        fill(255, 0, 0);
        textSize(16);
        textAlign(CENTER, BOTTOM);
        text("FINAL", mapaX + mapaW - 5, mapaY - 20);
    }
}

// === TELA DO MAPA DE FASES COM SELEÇÃO ===
function desenharTelaMapaDeFases() {
    background(10, 10, 30, 240); // Fundo escuro
    
    fill(255, 255, 0);
    textSize(48);
    textAlign(CENTER, TOP);
    text("MAPA DE FASES (250 MISSÕES)", width / 2, 20);
    
    fill(255);
    textSize(18);
    text("[M] para voltar ao jogo. Clique em fases concluídas para refazê-las.", width / 2, height - 30);
    
    const espacamento = 25;
    const faseTamanho = 15;
    const fasesPorLinha = floor((width - 60) / espacamento); 
    
    let startX = (width - fasesPorLinha * espacamento) / 2 + faseTamanho / 2;
    let startY = 100;
    
    for (let i = 1; i <= MAX_FASES; i++) {
        let linha = floor((i - 1) / fasesPorLinha);
        let coluna = (i - 1) % fasesPorLinha;
        
        let x = startX + coluna * espacamento;
        let y = startY + linha * espacamento;
        
        // 1. Cor do Ponto
        if (i < faseAtual) {
            // FASES CONCLUÍDAS (Verde Escuro - Botão Clicável)
            let d = dist(mouseX, mouseY, x, y);
            if (d < faseTamanho / 2 && estadoJogo === 'MAPA_DE_FASES') {
                fill(0, 200, 0); // Verde mais claro ao passar o mouse
            } else {
                fill(0, 150, 0); // Verde Escuro
            }
        } else if (i === faseAtual) {
            fill(255, 255, 0); // Fase Atual (Amarelo)
        } else {
            fill(50); // Fases Bloqueadas (Cinza)
        }
        
        // 2. Desenha o Ponto (Círculo)
        ellipse(x, y, faseTamanho, faseTamanho);
        
        // 3. Desenha a borda ou ícone para fases importantes
        if (i % NIVEL_BOSS === 0) { // Fases Chefão
            stroke(255, 0, 0);
            strokeWeight(3);
            ellipse(x, y, faseTamanho + 4, faseTamanho + 4);
            noStroke();
        } else if (i === MAX_FASES) { // Última Fase
             stroke(255, 100, 0);
             strokeWeight(4);
             ellipse(x, y, faseTamanho + 6, faseTamanho + 6);
             noStroke();
        }
        
        // 4. Desenha o número da fase atual
        if (i === faseAtual) {
            fill(0);
            textSize(10);
            textAlign(CENTER, CENTER);
            text(i, x, y + 1);
        }
    }
    
    // Legenda
    fill(255);
    textSize(14);
    textAlign(LEFT, BOTTOM);
    text("🟢 Completa (Clicável)", 50, height - 70);
    text("🟡 Atual", 250, height - 70);
    text("⚫ Bloqueada", 350, height - 70);
    fill(255, 0, 0);
    text("🔴 Chefão", 500, height - 70);
}


function desenharLojaFPS() {
    background(20, 20, 50, 220);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(40);
    text("LOJA DE UPGRADES", width / 2, 50);

    textSize(24);
    text("Moeda Disponível: " + moeda, width / 2, 120);

    let startY = 180;
    let col1X = width / 4;
    let col2X = width * 3 / 4;
    let offset = 35;

    fill(150, 200, 255);
    textAlign(LEFT, TOP);
    textSize(18);
    text("JOGADOR:", col1X - 50, startY);
    fill(255);
    text(`[Q] +1 Vida (Custo: ${custoVida})`, col1X - 50, startY + offset);
    text(`[W] +0.5 Velocidade (Custo: ${custoVelocidade})`, col1X - 50, startY + offset * 2);

    fill(255, 200, 0);
    text("ARMAS:", col2X - 50, startY);
    fill(255);
    text(`[E] +10ms Taxa de Disparo (Custo: ${custoIntervaloTiro})`, col2X - 50, startY + offset);
    text(`[R] +5 Velocidade Projétil (Custo: ${custoVelocidadeTiro})`, col2X - 50, startY + offset * 2);
    text(`[T] +15 Dano Base (Custo: ${custoDanoBase})`, col2X - 50, startY + offset * 3);
    text(`[Y] +5% Chance Crítico (Custo: ${custoChanceCritico})`, col2X - 50, startY + offset * 4);
    text(`[U] +10 Raio Expl. (Custo: ${custoRaioExplosao})`, col2X - 50, startY + offset * 5);


    fill(255, 255, 0);
    textAlign(CENTER, BOTTOM);
    textSize(18);
    text("[L] Fechar Loja e Voltar ao Jogo", width / 2, height - 30);
}

function comprarItemFPS(key) {
    key = key.toUpperCase();
    
    let custo = 0;
    let itemComprado = false;
    
    if (key === 'Q' && moeda >= custoVida) {
        custo = custoVida;
        jogadorVidaMaxima += 1;
        jogadorVida += 1;
        custoVida = floor(custoVida * 1.5);
        itemComprado = true;
    } else if (key === 'W' && moeda >= custoVelocidade) {
        custo = custoVelocidade;
        velocidadeMovimento += 0.5;
        custoVelocidade = floor(custoVelocidade * 1.5);
        itemComprado = true;
    } else if (key === 'E' && moeda >= custoIntervaloTiro) {
        custo = custoIntervaloTiro;
        intervaloTiro = max(50, intervaloTiro - 10);
        custoIntervaloTiro = floor(custoIntervaloTiro * 1.5);
        itemComprado = true;
    } else if (key === 'R' && moeda >= custoVelocidadeTiro) {
        custo = custoVelocidadeTiro;
        velocidadeTiro += 5;
        custoVelocidadeTiro = floor(custoVelocidadeTiro * 1.5);
        itemComprado = true;
    } else if (key === 'T' && moeda >= custoDanoBase) {
        custo = custoDanoBase;
        danoBaseTiro += 15;
        custoDanoBase = floor(custoDanoBase * 1.5);
        itemComprado = true;
    } else if (key === 'Y' && moeda >= custoChanceCritico) {
        custo = custoChanceCritico;
        chanceCritico = min(0.9, chanceCritico + 0.05); // Max 90%
        custoChanceCritico = floor(custoChanceCritico * 1.5);
        itemComprado = true;
    } else if (key === 'U' && moeda >= custoRaioExplosao) {
        custo = custoRaioExplosao;
        raioExplosao += 10;
        custoRaioExplosao = floor(custoRaioExplosao * 1.5);
        itemComprado = true;
    }
    
    if (itemComprado) {
        moeda -= custo;
    } else if (key !== 'L') {
        console.log("Moedas insuficientes ou tecla inválida.");
    }
}


function desenharMenuInicialFPS() {
    image(imgFundo, width / 2, height / 2, width, height);
    if (imgFundo.width <= 1) { background(0); }
    
    fill(255, 255, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("DEFESA ESPACIAL (1ª Pessoa)", width / 2, height / 2 - 80);

    fill(255);
    textSize(24);
    text("Pressione E para Jogar", width / 2, height / 2);

    fill(150, 200, 255);
    textSize(16);
    text("Mover: [W, A, S, D]", width / 2, height / 2 + 50);
    text("Mirar: [Mouse] ou [Setas Esquerda/Direita]", width / 2, height / 2 + 80);
    text("Atirar: [Clique do Mouse] ou [Barra de Espaço]", width / 2, height / 2 + 100);
    text("Loja: [1] | Códigos: [T] | Mapa: [M]", width / 2, height / 2 + 120);
    
    fill(255, 255, 0);
    text(`Maior Pontuação: ${highScore}`, width / 2, height / 2 + 150);
}

function desenharGameOverFPS() {
    background(50, 0, 0);
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2 - 50);

    textSize(24);
    text(`Sua Pontuação: ${pontuacao}`, width / 2, height / 2 + 10);
    text(`Fase Alcançada: ${faseAtual}`, width / 2, height / 2 + 40);

    fill(255, 255, 0);
    text("Pressione E para Tentar Novamente", width / 2, height / 2 + 100);
}

function desenharTelaResgatePrincesa() {
    background(0, 0, 0);
    image(imgResgate, width / 2, height / 2, width, height);
    
    fill(255, 255, 0);
    textSize(50);
    textAlign(CENTER, CENTER);
    text("PARABÉNS! MISSÃO CUMPRIDA!", width / 2, 50);
    text("A PRINCESA FOI RESGATADA!", width / 2, 120);
    
    fill(255);
    textSize(24);
    text("Você completou as 250 missões!", width / 2, height - 100);
    fill(255, 255, 0);
    text("Pressione E para Voltar ao Menu Principal (Reiniciar Jogo)", width / 2, height - 30);
}


function desenharTelaFimFase() {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    fill(255, 255, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text(`FASE ${faseAtual} CONCLUÍDA!`, width / 2, height / 2 - 50);
    
    fill(255);
    textSize(24);
    text(`Bônus Recebidos: +15000 Pontos, +5000 Moedas.`, width / 2, height / 2 + 10);
    text(`Ataque Aumentado: +150 Dano Base.`, width / 2, height / 2 + 40);

    // Botão Continuar
    let btnW = 200;
    let btnH = 50;
    let btnX = width / 2 - btnW / 2;
    let btnY = height / 2 + 100;
    
    fill(0, 150, 0);
    rect(btnX, btnY, btnW, btnH, 10);
    fill(255);
    textSize(24);
    text("CONTINUAR >>", width / 2, btnY + btnH / 2);
}


function desenharModoCodigoFPS() {
    background(0, 0, 50, 220);
    fill(255, 255, 0);
    textSize(48);
    textAlign(CENTER, TOP);
    text("MODO CÓDIGO", width / 2, 50);

    fill(255);
    textSize(20);
    text("Digite o Código de Mestre (Case Sensitive)", width / 2, 120);

    fill(150, 200, 255);
    textSize(16);
    textAlign(LEFT, TOP);
    text(`Exemplo de Código: ${MASTER_KEY_SKIP}`, width / 2 - 150, 200);

    fill(255, 255, 0);
    textAlign(CENTER, BOTTOM);
    textSize(18);
    text("[0] Fechar e Voltar ao Jogo", width / 2, height - 60);
}


function processarCodigo() {
    let codigo = inputChat.value();
    inputChat.value('');
    
    if (codigo === 'MASTERKEYSKIP') {
        faseAtual = MAX_FASES;
        resetarEstadoFase();
        estadoJogo = 'JOGANDO'; 
        inputChat.hide();
        requestPointerLock();
        console.log("Código de Mestre APLICADO: Fase Final!");
    } else if (codigo === 'DINHEIRO') {
        moeda += 50000;
        console.log("Código APLICADO: +50000 Moedas!");
    } else {
        console.log("Código Inválido.");
    }
}


function desenharRadar() {
    const centerX = RADAR_RAIO + 20; 
    const centerY = height - RADAR_RAIO - 20; 
    
    // Fundo do Radar
    fill(0, 50, 0, 150); 
    ellipse(centerX, centerY, RADAR_RAIO * 2, RADAR_RAIO * 2);

    // Linhas de Referência
    stroke(0, 150, 0, 100);
    strokeWeight(1);
    line(centerX - RADAR_RAIO, centerY, centerX + RADAR_RAIO, centerY);
    line(centerX, centerY - RADAR_RAIO, centerX, centerY + RADAR_RAIO);
    noFill();
    ellipse(centerX, centerY, RADAR_RAIO, RADAR_RAIO); 

    // Desenha Monstros
    for (let monstro of monstros) {
        let relX = monstro.x - jogadorX;
        let relY = monstro.y - jogadorY;
        
        let distanciaReal = dist(0, 0, relX, relY);
        
        if (distanciaReal > MAX_DISTANCIA_RADAR) {
            continue;
        }

        let fatorEscala = RADAR_RAIO / MAX_DISTANCIA_RADAR;
        let radarX = centerX + relX * fatorEscala;
        let radarY = centerY + relY * fatorEscala;
        
        if (monstro.isBoss) {
            fill(255, 0, 0); // Boss em vermelho
        } else {
            fill(0, 255, 0); // Monstro normal em verde
        }
        
        noStroke();
        ellipse(radarX, radarY, 6, 6);
    }
    
    // Varredura do Radar (Animação)
    radarAngulo += 0.05; 
    
    push();
    translate(centerX, centerY);
    rotate(radarAngulo);

    stroke(0, 255, 0, 180);
    strokeWeight(3);
    line(0, 0, RADAR_RAIO, 0); 

    pop();
    
    // Indicador da Posição da Câmera
    push();
    translate(centerX, centerY);
    rotate(anguloVisao + HALF_PI); 

    fill(255, 255, 255, 150); 
    noStroke();
    triangle(0, -RADAR_RAIO - 5, -10, -RADAR_RAIO + 5, 10, -RADAR_RAIO + 5);

    pop();
    
    // Texto do Radar
    fill(255);
    textSize(14);
    textAlign(LEFT, TOP);
    text(`RADAR (Alcance: ${MAX_DISTANCIA_RADAR}m)`, 20, height - 15);
}