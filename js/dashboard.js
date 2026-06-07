/* ==========================================================
   ATLAS
   DASHBOARD.JS

   Responsável por:

   - Renderizar cards das atividades
   - Atualizar indicadores
   - Criar gráfico donut
========================================================== */

let atlasChart = null;

/* ==========================================================
   DASHBOARD PRINCIPAL
========================================================== */

function atualizarDashboard() {

    const dados = AtlasStorage.get();

    renderizarCards(dados);

    atualizarResumo(dados);

    renderizarGrafico(dados);

}

/* ==========================================================
   RESUMO SUPERIOR
========================================================== */

function atualizarResumo(dados) {

    let totalSegundos = 0;
    let totalSessoes = 0;
    let totalTarefas = 0;

    Object.values(dados.atividades).forEach(atividade => {

        totalSegundos += atividade.totalSegundos;

        totalSessoes += atividade.totalSessoes;

        totalTarefas += atividade.tarefas.length;

    });

    const totalHoras = formatarHoras(totalSegundos);

    document.getElementById("totalHoras").textContent =
        totalHoras;

    document.getElementById("resumoHoras").textContent =
        totalHoras;

    document.getElementById("resumoSessoes").textContent =
        totalSessoes;

    document.getElementById("resumoTarefas").textContent =
        totalTarefas;

}

/* ==========================================================
   CARDS DAS ATIVIDADES
========================================================== */

function renderizarCards(dados) {

    const grid =
        document.getElementById("activitiesGrid");

    if (!grid) return;

    grid.innerHTML = "";

    Object.entries(dados.atividades).forEach(

        ([chave, atividade]) => {

            const card =
                document.createElement("div");

            card.className =
                "activity-card";

            card.style.borderLeftColor =
                atividade.cor;

            card.innerHTML = `
                <h3>${atividade.nome}</h3>

                <div class="hours">
                    ${formatarHoras(
                        atividade.totalSegundos
                    )}
                </div>

                <div class="category">
                    ${atividade.categoria}
                </div>
            `;

            card.addEventListener("click", () => {

                abrirAtividade(chave);

            });

            grid.appendChild(card);

        }

    );

}

/* ==========================================================
   GRÁFICO DONUT
========================================================== */

function renderizarGrafico(dados) {

    const canvas =
        document.getElementById("atlasChart");

    if (!canvas) return;

    const labels = [];
    const valores = [];
    const cores = [];

    Object.values(dados.atividades).forEach(

        atividade => {

            labels.push(
                atividade.nome
            );

            valores.push(
                atividade.totalSegundos
            );

            cores.push(
                atividade.cor
            );

        }

    );

    const total =
        valores.reduce(
            (a, b) => a + b,
            0
        );

    /*
       Se não houver dados,
       exibir setores iguais.
    */

    const dadosGrafico =
        total === 0
            ? new Array(valores.length).fill(1)
            : valores;

    if (atlasChart) {

        atlasChart.destroy();

    }

    atlasChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels,

            datasets: [

                {

                    data: dadosGrafico,

                    backgroundColor: cores,

                    borderWidth: 0,

                    hoverOffset: 12

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: true,

            cutout: "72%",

            plugins: {

                legend: {

                    display: false

                },

                tooltip: {

                    callbacks: {

                        label(context) {

                            if (total === 0) {

                                return "0h";

                            }

                            const segundos =
                                context.raw;

                            return formatarHoras(
                                segundos
                            );

                        }

                    }

                }

            }

        }

    });

}

/* ==========================================================
   FORMATADORES
========================================================== */

function formatarHoras(segundos) {

    const horas =
        segundos / 3600;

    return `${horas.toFixed(1)}h`;

}

function formatarDuracao(segundos) {

    const horas =
        Math.floor(segundos / 3600);

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
    .map(n => String(n).padStart(2, "0"))
    .join(":");

}

/* ==========================================================
   ESTATÍSTICAS
========================================================== */

function obterTotalHoras() {

    const dados =
        AtlasStorage.get();

    let total = 0;

    Object.values(dados.atividades)
        .forEach(atividade => {

            total +=
                atividade.totalSegundos;

        });

    return total;

}

function obterTotalSessoes() {

    const dados =
        AtlasStorage.get();

    let total = 0;

    Object.values(dados.atividades)
        .forEach(atividade => {

            total +=
                atividade.totalSessoes;

        });

    return total;

}

/* ==========================================================
   DEBUG
========================================================== */

/*
Executar no console:

simularDashboard()

para testar o gráfico.
*/

function simularDashboard() {

    const dados =
        AtlasStorage.get();

    dados.atividades.dma_cedae.totalSegundos =
        180 * 3600;

    dados.atividades.estatistica.totalSegundos =
        95 * 3600;

    dados.atividades.sig.totalSegundos =
        70 * 3600;

    dados.atividades.calculo.totalSegundos =
        30 * 3600;

    dados.atividades.portfolio.totalSegundos =
        45 * 3600;

    dados.atividades.hobbies.totalSegundos =
        20 * 3600;

    dados.atividades.domesticas.totalSegundos =
        12 * 3600;

    AtlasStorage.save(dados);

    atualizarDashboard();

    console.log(
        "Dados simulados carregados."
    );

}

/*
Resetar tudo
*/

function resetarAtlas() {

    AtlasStorage.reset();

    atualizarDashboard();

}