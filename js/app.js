/* ==========================================================
   ATLAS
   APP.JS
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    iniciarAtlas
);

/* ==========================================================
   INICIALIZAÇÃO
========================================================== */

function iniciarAtlas() {

    console.log(
        "Atlas iniciado."
    );

    atualizarDashboard();

    conectarEventosGlobais();

    restaurarUltimaTela();

}

/* ==========================================================
   EVENTOS GLOBAIS
========================================================== */

function conectarEventosGlobais() {

    const btnExportar =
        document.getElementById(
            "btnExportar"
        );

    if (btnExportar) {

        btnExportar.addEventListener(
            "click",
            exportarJSON
        );

    }

}

/* ==========================================================
   EXPORTAÇÃO
========================================================== */

function exportarJSON() {

    AtlasStorage.exportJSON();

    const dados =
        AtlasStorage.get();

    dados.configuracoes
        .ultimaExportacao =
        agoraISO();

    AtlasStorage.save(dados);

    alert(
        "Backup exportado com sucesso."
    );

}

/* ==========================================================
   RESTAURAÇÃO
========================================================== */

function restaurarUltimaTela() {

    const dados =
        AtlasStorage.get();

    const atividade =
        dados.ui
            .atividadeSelecionada;

    if (
        atividade &&
        dados.atividades[
            atividade
        ]
    ) {

        abrirAtividade(
            atividade
        );

    }

}

/* ==========================================================
   SALVAR TELA ATUAL
========================================================== */

function salvarTelaAtual(
    chaveAtividade
) {

    const dados =
        AtlasStorage.get();

    if (!dados.ui) {

        dados.ui = {

            atividadeSelecionada:
                null

        };

    }

    dados.ui
        .atividadeSelecionada =
        chaveAtividade;

    AtlasStorage.save(
        dados
    );

}

function limparTelaAtual() {

    const dados =
        AtlasStorage.get();

    if (!dados.ui) {

        dados.ui = {};

    }

    dados.ui
        .atividadeSelecionada =
        null;

    AtlasStorage.save(
        dados
    );

}

/* ==========================================================
   INFORMAÇÕES GLOBAIS
========================================================== */

function obterResumoGlobal() {

    const dados =
        AtlasStorage.get();

    let horas = 0;
    let sessoes = 0;
    let tarefas = 0;
    let notas = 0;
    let projetos = 0;

    Object.values(
        dados.atividades
    ).forEach(atividade => {

        horas +=
            atividade.totalSegundos;

        sessoes +=
            atividade.totalSessoes;

        tarefas +=
            atividade.tarefas.length;

        notas +=
            atividade.notas.length;

        projetos +=
            atividade.projetos.length;

    });

    return {

        horas,
        sessoes,
        tarefas,
        notas,
        projetos

    };

}

/* ==========================================================
   DEBUG
========================================================== */

function limparAtlas() {

    const confirmar =
        confirm(
            "Apagar todos os dados?"
        );

    if (!confirmar) return;

    AtlasStorage.reset();

    location.reload();

}

function mostrarBanco() {

    console.log(
        AtlasStorage.get()
    );

}