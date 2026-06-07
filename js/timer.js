/* ==========================================================
   ATLAS
   TIMER.JS

   Cronômetro global persistente

   Regras:

   - Apenas uma atividade ativa
   - Salva no localStorage
   - Continua após fechar navegador
   - Registra sessões completas
========================================================== */

let timerInterval = null;

/* ==========================================================
   INICIALIZAÇÃO
========================================================== */

function inicializarTimer() {

    verificarSessaoAtiva();

    conectarEventosTimer();

}

/* ==========================================================
   EVENTOS
========================================================== */

function conectarEventosTimer() {

    document
        .getElementById("btnIniciar")
        ?.addEventListener(
            "click",
            iniciarTimer
        );

    document
        .getElementById("btnPausar")
        ?.addEventListener(
            "click",
            pausarTimer
        );

    document
        .getElementById("btnEncerrar")
        ?.addEventListener(
            "click",
            encerrarTimer
        );

}

/* ==========================================================
   INICIAR
========================================================== */

function iniciarTimer() {

    if (!atividadeAtual) {

        alert(
            "Selecione uma atividade."
        );

        return;

    }

    const dados =
        AtlasStorage.get();

    const timer =
        dados.timer;

    /*
       Já existe atividade rodando
    */

    if (
        timer.atividadeAtiva &&
        timer.atividadeAtiva !== atividadeAtual
    ) {

        const confirmar =
            confirm(
                "Existe outra atividade em execução. Encerrar e iniciar esta?"
            );

        if (!confirmar) return;

        finalizarSessaoAtual(dados);

    }

    /*
       Retomar atividade pausada
    */

    if (
        timer.atividadeAtiva === atividadeAtual &&
        !timer.pausado
    ) {

        return;

    }

    timer.atividadeAtiva =
        atividadeAtual;

    timer.inicioSessao =
        agoraISO();

    timer.pausado =
        false;

    AtlasStorage.save(dados);

    iniciarAtualizacaoVisual();

}

/* ==========================================================
   PAUSAR
========================================================== */

function pausarTimer() {

    const dados =
        AtlasStorage.get();

    const timer =
        dados.timer;

    if (
        !timer.atividadeAtiva
    ) return;

    finalizarSessaoAtual(
        dados
    );

    timer.atividadeAtiva =
        null;

    timer.inicioSessao =
        null;

    timer.pausado =
        true;

    AtlasStorage.save(dados);

    pararAtualizacaoVisual();

    atualizarDisplay(
        "00:00:00"
    );

    atualizarDashboard();

    if (atividadeAtual) {

        abrirAtividade(
            atividadeAtual
        );

    }

}

/* ==========================================================
   ENCERRAR
========================================================== */

function encerrarTimer() {

    const dados =
        AtlasStorage.get();

    const timer =
        dados.timer;

    if (
        !timer.atividadeAtiva
    ) return;

    finalizarSessaoAtual(
        dados
    );

    timer.atividadeAtiva =
        null;

    timer.inicioSessao =
        null;

    timer.pausado =
        true;

    AtlasStorage.save(dados);

    pararAtualizacaoVisual();

    atualizarDisplay(
        "00:00:00"
    );

    atualizarDashboard();

    if (atividadeAtual) {

        abrirAtividade(
            atividadeAtual
        );

    }

}

/* ==========================================================
   FINALIZAR SESSÃO
========================================================== */

function finalizarSessaoAtual(dados) {

    const timer =
        dados.timer;

    if (
        !timer.atividadeAtiva ||
        !timer.inicioSessao
    ) return;

    const atividade =
        dados.atividades[
            timer.atividadeAtiva
        ];

    const inicio =
        new Date(
            timer.inicioSessao
        );

    const fim =
        new Date();

    const duracaoSegundos =
        Math.floor(
            (fim - inicio) / 1000
        );

    if (
        duracaoSegundos <= 0
    ) return;

    atividade.totalSegundos +=
        duracaoSegundos;

    atividade.totalSessoes += 1;

    atividade.ultimoAcesso =
        agoraISO();

    atividade.sessoes.push({

        id: gerarId(),

        inicio:
            inicio.toISOString(),

        fim:
            fim.toISOString(),

        duracaoSegundos,

        data:
            inicio
                .toISOString()
                .split("T")[0]

    });

}

/* ==========================================================
   RECUPERAÇÃO
========================================================== */

function verificarSessaoAtiva() {

    const dados =
        AtlasStorage.get();

    if (
        !dados ||
        !dados.timer
    ) {

        atualizarDisplay(
            "00:00:00"
        );

        return;

    }

    const timer =
        dados.timer;

    if (
        !timer.atividadeAtiva ||
        timer.pausado
    ) {

        atualizarDisplay(
            "00:00:00"
        );

        return;

    }

    iniciarAtualizacaoVisual();

}

/* ==========================================================
   LOOP VISUAL
========================================================== */

function iniciarAtualizacaoVisual() {

    pararAtualizacaoVisual();

    atualizarTimerVisual();

    timerInterval =
        setInterval(
            atualizarTimerVisual,
            1000
        );

}

function pararAtualizacaoVisual() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }

}

/* ==========================================================
   DISPLAY
========================================================== */

function atualizarTimerVisual() {

    const dados =
        AtlasStorage.get();

    const timer =
        dados.timer;

    if (
        !timer.inicioSessao
    ) {

        atualizarDisplay(
            "00:00:00"
        );

        return;

    }

    const inicio =
        new Date(
            timer.inicioSessao
        );

    const agora =
        new Date();

    const segundos =
        Math.floor(
            (agora - inicio) / 1000
        );

    atualizarDisplay(
        formatarTempo(
            segundos
        )
    );

}

function atualizarDisplay(texto) {

    const elemento =
        document.getElementById(
            "timerDisplay"
        );

    if (!elemento) return;

    elemento.textContent =
        texto;

}

/* ==========================================================
   FORMATADOR
========================================================== */

function formatarTempo(segundos) {

    const horas =
        Math.floor(
            segundos / 3600
        );

    const minutos =
        Math.floor(
            (segundos % 3600) / 60
        );

    const segundosRestantes =
        segundos % 60;

    return [
        horas,
        minutos,
        segundosRestantes
    ]
        .map(
            n =>
                String(n)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join(":");

}

/* ==========================================================
   STATUS
========================================================== */

function existeTimerAtivo() {

    const dados =
        AtlasStorage.get();

    return Boolean(
        dados.timer.atividadeAtiva
    );

}

function obterAtividadeAtiva() {

    const dados =
        AtlasStorage.get();

    return dados.timer.atividadeAtiva;

}

/* ==========================================================
   DEBUG
========================================================== */

function encerrarTimerForcado() {

    const dados =
        AtlasStorage.get();

    dados.timer = {

        atividadeAtiva: null,

        inicioSessao: null,

        pausado: true

    };

    AtlasStorage.save(dados);

    pararAtualizacaoVisual();

    atualizarDisplay(
        "00:00:00"
    );

}

/* ==========================================================
   AUTO START
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    inicializarTimer
);