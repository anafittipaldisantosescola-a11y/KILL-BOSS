// DEFESA ESPACIAL (SIMULAÇÃO FPS) - p5.js
// FUNÇÕES INCLUÍDAS:
// 1. AUMENTO DE DANO DE +150 A CADA NÍVEL DE CHEFE (MÚLTIPLO DE 10).
// 2. SISTEMA DE MAIOR PONTUAÇÃO (HIGH SCORE) USANDO LOCAL STORAGE.
// 3. CHAT/INPUT PARA CÓDIGOS (TECLA T para abrir, TECLA 0 para fechar).
// 4. LOJA: ENTRAR com TECLA 1, SAIR com TECLA L.

// === Variáveis Globais ===
let imgMonstro;
let imgFundo;
let imgBoss; 
let estadoJogo = 'MENU'; 
let telaLargura = 600;
let telaAltura = 400;

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

// --- Combate ---
let tiros = [];
let tiroTamanho = 5;
let velocidadeTiro = 15; 
let ultimoTiroTempo = 0;
let intervaloTiro = 100; 
let danoBaseTiro = 15; 
let chanceCritico = 0; 
let raioExplosao = 0; 

// --- NÍVEL E BOSS --- 
const PONTOS_POR_NIVEL = 500;
const NIVEL_BOSS = 10;
let bossAtivo = false;

// --- Placar e High Score ---
let pontuacao = 0;
let moeda = 0;
let highScore = 0; 

// --- LOJA (Custo inicial) --- 
let custoVida = 100;
let custoVelocidade = 150;
let custoIntervaloTiro = 200; 
let custoVelocidadeTiro = 250; 
let custoDanoBase = 300; 
let custoChanceCritico = 400; 
let custoRaioExplosao = 500; 

// --- Chat para Códigos ---
let inputChat; 
const CODIGO_MODO = 'CODIGO'; 


// ===================================
// === FUNÇÕES ESSENCIAIS DO p5.js ===
// ===================================

function preload() {
    try {
        // NOTA: Para rodar, você precisará ter as imagens "9gus5pd7tl9z.gif" e "monster-boss.gif"
        // no mesmo diretório do seu sketch.js, ou usar imagens de exemplo do p5.js.
        imgFundo = loadImage('9gus5pd7tl9z.gif');
        imgMonstro = loadImage('monster-boss.gif'); 
        imgBoss = loadImage('monster-boss.gif'); 
    } catch(e) {
         console.error("Erro ao carregar imagens. Verifique os caminhos.");
    }
}

function setup() {
    createCanvas(telaLargura, telaAltura);
    imageMode(CENTER);
    angleMode(RADIANS); 
    
    frameRate(30); 
    
    // Carrega a maior pontuação (High Score) salva na Local Storage
    let savedHighScore = getItem('highScore');
    if (savedHighScore !== null) {
        highScore = parseInt(savedHighScore); 
    }
    
    // Configuração do Campo de Entrada
    inputChat = createInput('');
    inputChat.position(width / 2 - 150, height - 30); 
    inputChat.size(300);
    inputChat.attribute('placeholder', 'Digite o código aqui...');
    inputChat.hide(); 
    
    // Quando o usuário apertar ENTER no campo, chamamos processarCodigo
    inputChat.changed(processarCodigo); 
    
    canvas.addEventListener('click', () => {
        if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
            requestPointerLock();
        }
    });
}

function reiniciarJogo() {
    jogadorX = 0;
    jogadorY = 0;
    anguloVisao = 0;
    jogadorVida = 3;
    jogadorVidaMaxima = 3; 
    monstros = [];
    tiros = [];
    pontuacao = 0;
    moeda = 0;      
    bossAtivo = false;
    
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
    
    // Esconder o chat se estiver visível
    inputChat.hide();
    
    estadoJogo = 'JOGANDO';
}


function draw() {
    image(imgFundo, width / 2, height / 2, width, height);

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

    if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
        moverJogadorFPS();
        gerarMonstrosFPS(); 
        gerenciarMonstrosFPS();
        gerenciarTirosFPS();
        verificarColisoesTiroMonstroFPS();
        verificarColisoesMonstroJogadorFPS();

        desenharMonstrosFPS(); 
        desenharTirosFPS();
        desenharMira(); 
        desenharPlacarFPS();
        
    } else if (estadoJogo === 'GAMEOVER') {
        desenharGameOverFPS();
    }
}

function keyPressed() {
    if ((estadoJogo === 'MENU' || estadoJogo === 'GAMEOVER') && (key === 'e' || key === 'E')) {
        reiniciarJogo();
        return;
    }
    
    // NOVO: Lógica para ABRIR a LOJA com a tecla 1
    if (key === '1') {
        if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
            estadoJogo = 'LOJA';
            document.exitPointerLock(); 
        }
        inputChat.hide(); // Garante que o chat esteja escondido
        return;
    }

    // Lógica para FECHAR a LOJA com a tecla L (mantida a tecla anterior)
    if (key === 'L' || key === 'l') {
        if (estadoJogo === 'LOJA') {
            estadoJogo = bossAtivo ? 'BOSS_FIGHT' : 'JOGANDO';
        }
        return;
    }
    
    // Lógica para ABRIR o modo de CÓDIGO com a tecla T
    if (key === 'T' || key === 't') {
        if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
            estadoJogo = CODIGO_MODO;
            inputChat.show();
            inputChat.elt.focus(); // Coloca o cursor no campo
            document.exitPointerLock(); 
        }
        return;
    }
    
    // Lógica para FECHAR o modo de CÓDIGO com a tecla 0 (ZERO)
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

function mousePressed() {
    if (estadoJogo === 'JOGANDO' || estadoJogo === 'BOSS_FIGHT') {
        atirarFPS();
    }
}


// ===================================
// === FUNÇÕES DE JOGO (MOVIMENTO, COMBATE, BOSS) ===
// ===================================

function calcularNivel() {
    return floor(pontuacao / PONTOS_POR_NIVEL) + 1;
}

function gerarMonstrosFPS() {
    let nivelAtual = calcularNivel();
    let deveTerBoss = nivelAtual % NIVEL_BOSS === 0 && nivelAtual > 0;

    if (deveTerBoss && !bossAtivo) {
        
        // BÔNUS AO ATINGIR O NÍVEL DE CHEFE (NÍVEL 10, 20, 30...)
        jogadorVida += 5;
        jogadorVidaMaxima += 5; 
        
        // --- AUMENTO DE DANO DE +150 ---
        danoBaseTiro += 150; 
        
        estadoJogo = 'BOSS_FIGHT';
        bossAtivo = true;
        monstros = [];
        contadorMonstro = 0;

        const NUM_BOSSES = 3; 
        let ciclo = floor((nivelAtual - 1) / NIVEL_BOSS);
        let vidaBoss = 300 + (ciclo * 200) + (nivelAtual - NIVEL_BOSS) * 100;

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
                            
                            // *** LÓGICA DE CONTINUAÇÃO APÓS CHEFE ***
                            bossAtivo = false;
                            estadoJogo = 'JOGANDO'; 
                            
                            pontuacao += 15000; 
                            moeda += 5000; 

                            velocidadeMonstro *= 1.1; 
                            intervaloMonstro = max(50, intervaloMonstro - 10);
                            
                            let proximoNivelBoss = ((floor(calcularNivel() / NIVEL_BOSS) + 1) * NIVEL_BOSS);
                            let pontosParaProximoCiclo = (proximoNivelBoss - 1) * PONTOS_POR_NIVEL;
                            pontuacao = max(pontuacao, pontosParaProximoCiclo);
                            
                            // *****************************************
                        }
                        break; 
                    }
                }
                
                if (raioExplosao > 0) {
                     if (monstro.isBoss && !monstros.some(m => m.isBoss)) {
                        bossAtivo = false; estadoJogo = 'JOGANDO'; pontuacao += 15000; moeda += 5000;
                        velocidadeMonstro *= 1.1; intervaloMonstro = max(50, intervaloMonstro - 10);
                        let proximoNivelBoss = ((floor(calcularNivel() / NIVEL_BOSS) + 1) * NIVEL_BOSS);
                        let pontosParaProximoCiclo = (proximoNivelBoss - 1) * PONTOS_POR_NIVEL;
                        pontuacao = max(pontuacao, pontosParaProximoCiclo);
                    }
                }
                
                tiros.splice(i, 1); 
                break;
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

function moverJogadorFPS() {
    let sensibilidadeMouse = 0.005; 
    let deltaX = (document.pointerLockElement === canvas) ? movedX : mouseX - pmouseX;
    anguloVisao += deltaX * sensibilidadeMouse;

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
            }
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

function desenharPlacarFPS() {
    // Verifica e salva o High Score antes de desenhar
    if (pontuacao > highScore) {
        highScore = pontuacao;
        storeItem('highScore', highScore); // Salva o novo recorde
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
    text("[1] Loja | [T] Código", 10, 160); // LOJA MUDADA AQUI
    text(`Dano Base: ${danoBaseTiro}`, 10, 185); 


    
    if (nivel % NIVEL_BOSS === 0 && bossAtivo) {
        fill(255, 0, 0);
        textSize(30);
        textAlign(CENTER, TOP);
        text("3 CHEFÕES ATIVOS!", width / 2, 10);
        
        let bossesRestantes = monstros.filter(m => m.isBoss).length;
        fill(255, 255, 0);
        textSize(20);
        text(`Restantes: ${bossesRestantes}`, width / 2, 45);
        
    } else if (nivel % NIVEL_BOSS === NIVEL_BOSS - 1) {
        fill(255, 255, 0);
        textSize(20);
        textAlign(CENTER, TOP);
        text("BOSS CHEFÃO NO PRÓXIMO NÍVEL!", width / 2, 10);
    }
}

function comprarItemFPS(chave) {
    chave = chave.toUpperCase();
    
    if (chave === 'Q') { // Vida
        if (moeda >= custoVida) {
            moeda -= custoVida; 
            jogadorVida++; 
            jogadorVidaMaxima++; 
            custoVida = round(custoVida * 1.5);
        }
    } else if (chave === 'W') { // Velocidade de Movimento
        if (moeda >= custoVelocidade) {
            moeda -= custoVelocidade; 
            velocidadeMovimento += 0.5; 
            custoVelocidade = round(custoVelocidade * 1.5);
        }
    } else if (chave === 'E') { // Taxa de Disparo (Intervalo de Tiro)
        if (moeda >= custoIntervaloTiro && intervaloTiro > 20) {
            moeda -= custoIntervaloTiro; 
            intervaloTiro = max(20, intervaloTiro - 10); 
            custoIntervaloTiro = round(custoIntervaloTiro * 1.7);
        }
    } else if (chave === 'R') { // Velocidade do Projétil
        if (moeda >= custoVelocidadeTiro) {
            moeda -= custoVelocidadeTiro; 
            velocidadeTiro += 5; 
            custoVelocidadeTiro = round(custoVelocidadeTiro * 1.6);
        }
    } else if (chave === 'T') { // Dano Base do Tiro
        if (moeda >= custoDanoBase) {
            moeda -= custoDanoBase; 
            danoBaseTiro += 15; 
            custoDanoBase = round(custoDanoBase * 1.8);
        }
    } else if (chave === 'Y') { // Chance de Crítico
        if (moeda >= custoChanceCritico && chanceCritico < 0.5) {
            moeda -= custoChanceCritico; 
            chanceCritico += 0.05; 
            custoChanceCritico = round(custoChanceCritico * 1.9);
        }
    } else if (chave === 'U') { // Raio de Explosão
        if (moeda >= custoRaioExplosao) {
            moeda -= custoRaioExplosao; 
            raioExplosao = max(raioExplosao + 10, 30); 
            custoRaioExplosao = round(custoRaioExplosao * 2.0);
        }
    }
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
    let col1X = 100; 
    let col2X = 350; 
    let offset = 35; 

    fill(150, 200, 255); 
    textAlign(LEFT, TOP);
    textSize(18);
    text("JOGADOR:", col1X, startY);
    fill(255);
    text(`[Q] +1 Vida (Custo: ${custoVida})`, col1X, startY + offset);
    text(`[W] +0.5 Velocidade (Custo: ${custoVelocidade})`, col1X, startY + offset * 2);

    fill(255, 200, 0); 
    text("ARMAS:", col2X, startY);
    fill(255);
    text(`[E] +10ms Taxa de Disparo (Custo: ${custoIntervaloTiro})`, col2X, startY + offset);
    text(`[R] +5 Velocidade Projétil (Custo: ${custoVelocidadeTiro})`, col2X, startY + offset * 2);
    text(`[T] +15 Dano Base (Custo: ${custoDanoBase})`, col2X, startY + offset * 3); 
    text(`[Y] +5% Chance Crítico (Custo: ${custoChanceCritico})`, col2X, startY + offset * 4);
    text(`[U] +10 Raio Explosão (Custo: ${custoRaioExplosao})`, col2X, startY + offset * 5);


    fill(255, 255, 0);
    textAlign(CENTER, BOTTOM);
    textSize(18);
    text("[L] Fechar Loja e Voltar ao Jogo", width / 2, height - 30); // L para fechar
}

function desenharMenuInicialFPS() {
    image(imgFundo, width / 2, height / 2, width, height);
    fill(255, 255, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("DEFESA ESPACIAL (1ª Pessoa)", width / 2, height / 2 - 80);

    fill(255);
    textSize(24);
    text("Pressione E para Jogar", width / 2, height / 2);

    fill(150, 200, 255);
    textSize(16);
    text("Mover: [W, A, S, D] | Mirar: [Mouse]", width / 2, height / 2 + 50);
    text("Atirar: [Clique do Mouse] | Travar o mouse: clique na tela", width / 2, height / 2 + 80);
    text("Loja: [1] | Códigos: [T] | Sair do Chat: [0]", width / 2, height / 2 + 100); // 1 PARA LOJA
    
    // Exibe o High Score no Menu
    fill(255, 255, 0);
    text(`Maior Pontuação: ${highScore}`, width / 2, height / 2 + 130);
}

function desenharGameOverFPS() {
    background(50, 0, 0);
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2 - 50);
    textSize(28);
    text("Pontuação Final: " + pontuacao, width / 2, height / 2);
    
    // Exibe o maior recorde salvo
    fill(255, 255, 0);
    text("Maior Pontuação: " + highScore, width / 2, height / 2 + 40); 
    
    fill(255);
    textSize(18);
    text("Pressione E para jogar novamente", width / 2, height / 2 + 80);
}

// ===================================
// === FUNÇÕES DE CHAT/CÓDIGO ===
// ===================================

function desenharModoCodigoFPS() {
    // Desenha uma sobreposição para focar no chat
    fill(0, 0, 0, 200); 
    rect(0, 0, width, height);
    
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("MODO CÓDIGO", width / 2, height / 2 - 50);
    
    textSize(18);
    text("Pressione ENTER para aplicar o código.", width / 2, height / 2);
    text("[0] para voltar ao jogo.", width / 2, height / 2 + 30);
}

function processarCodigo() {
    let codigo = inputChat.value().toUpperCase().trim();
    inputChat.value(''); // Limpa o campo após a tentativa
    
    let mensagem = "Código inválido!";
    let codigoValido = false;

    if (codigo === 'VIDAINFINITA') {
        jogadorVidaMaxima += 999;
        jogadorVida = jogadorVidaMaxima;
        mensagem = "Vida Infinita ATIVADA! (+999 Vida Máxima)";
        codigoValido = true;
    } else if (codigo === 'MOEDADUPLA') {
        moeda += 2000;
        mensagem = "2000 Moedas Recebidas!";
        codigoValido = true;
    } else if (codigo === 'DANOMAXIMO') {
        danoBaseTiro += 5000;
        mensagem = "Dano +5000. Seus tiros estão potentes!";
        codigoValido = true;
    } else if (codigo === 'NIVELBOSS') {
        pontuacao = PONTOS_POR_NIVEL * (floor(calcularNivel() / NIVEL_BOSS) * NIVEL_BOSS - 1);
        mensagem = "Próximo nível será Boss!";
        codigoValido = true;
    }

    if (codigoValido) {
        console.log(`CÓDIGO ACEITO: ${mensagem}`);
    } else {
        console.log(`CÓDIGO RECUSADO: ${mensagem}`);
    }

    // Volta ao jogo e esconde o chat
    estadoJogo = bossAtivo ? 'BOSS_FIGHT' : 'JOGANDO';
    inputChat.hide();
    requestPointerLock();
}