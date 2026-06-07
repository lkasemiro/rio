/* ==========================================================
   ATLAS
   ACTIVITY.JS
========================================================== */

/* ==========================================================
   ESTADO GLOBAL
========================================================== */

let atividadeAtual = null;

/* ==========================================================
   ABRIR ATIVIDADE
========================================================== */

function abrirAtividade(chaveAtividade) {

    const dados = AtlasStorage.get();

    const atividade =
        dados.atividades[chaveAtividade];

    if (!atividade) return;

    atividadeAtual =
        chaveAtividade;

    /*
       Salva última atividade aberta
    */

    if (typeof salvarTelaAtual === "function") {

        salvarTelaAtual(
            chaveAtividade
        );

    }

    mostrarTelaAtividade();

    aplicarTemaAtividade(
        atividade
    );

    preencherCabecalho(
        atividade
    );

    carregarMetas(
        atividade
    );

    carregarTarefas(
        atividade
    );

    carregarProjetos(
        atividade
    );

    carregarNotas(
        atividade
    );

}

/* ==========================================================
   TROCA DE TELAS
========================================================== */

function mostrarTelaAtividade() {

    document
        .getElementById(
            "dashboardView"
        )
        .classList
        .remove("active");

    document
        .getElementById(
            "activityView"
        )
        .classList
        .add("active");

}

function voltarDashboard() {

    document
        .getElementById(
            "activityView"
        )
        .classList
        .remove("active");

    document
        .getElementById(
            "dashboardView"
        )
        .classList
        .add("active");

    atividadeAtual = null;

    if (typeof limparTelaAtual === "function") {

        limparTelaAtual();

    }

    atualizarDashboard();

}

/* ==========================================================
   TEMA
========================================================== */

function aplicarTemaAtividade(
    atividade
) {

    document
        .documentElement
        .style
        .setProperty(
            "--activity-color",
            atividade.cor
        );

}

/* ==========================================================
   CABEÇALHO
========================================================== */

function preencherCabecalho(
    atividade
) {

    document
        .getElementById(
            "activityNome"
        )
        .textContent =
        atividade.nome;

    document
        .getElementById(
            "activityCategoria"
        )
        .textContent =
        atividade.categoria;

    document
        .getElementById(
            "activityTempoTotal"
        )
        .textContent =
        formatarHoras(
            atividade.totalSegundos
        );

    document
        .getElementById(
            "activityTotalSessoes"
        )
        .textContent =
        atividade.totalSessoes;

}

/* ==========================================================
   METAS
========================================================== */

function carregarMetas(
    atividade
) {

    document
        .getElementById(
            "metaHoras"
        )
        .value =
        atividade.metaHorasSemana;

    document
        .getElementById(
            "metaTarefas"
        )
        .value =
        atividade.metaTarefasSemana;

}

function salvarMetas() {

    if (!atividadeAtual) return;

    const dados =
        AtlasStorage.get();

    const atividade =
        dados.atividades[
            atividadeAtual
        ];

    atividade.metaHorasSemana =
        Number(
            document
                .getElementById(
                    "metaHoras"
                )
                .value
        );

    atividade.metaTarefasSemana =
        Number(
            document
                .getElementById(
                    "metaTarefas"
                )
                .value
        );

    AtlasStorage.save(
        dados
    );

}

/* ==========================================================
   TAREFAS
========================================================== */

function carregarTarefas(
    atividade
) {

    const lista =
        document.getElementById(
            "listaTarefas"
        );

    lista.innerHTML = "";

    atividade.tarefas.forEach(
        tarefa => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "list-item";

            item.innerHTML = `
                <label style="display:flex;gap:10px;align-items:center;">
                    <input
                        type="checkbox"
                        ${tarefa.concluida ? "checked" : ""}
                    >

                    <span style="
                        ${tarefa.concluida
                            ? "text-decoration:line-through;opacity:.6;"
                            : ""}
                    ">
                        ${tarefa.texto}
                    </span>
                </label>
            `;

            const checkbox =
                item.querySelector(
                    "input"
                );

            checkbox.addEventListener(
                "change",
                () => {

                    alternarTarefa(
                        tarefa.id
                    );

                }
            );

            lista.appendChild(
                item
            );

        }
    );

}

function adicionarTarefa() {

    if (!atividadeAtual) return;

    const input =
        document.getElementById(
            "novaTarefa"
        );

    const texto =
        input.value.trim();

    if (!texto) return;

    const dados =
        AtlasStorage.get();

    dados
        .atividades[
            atividadeAtual
        ]
        .tarefas
        .push({

            id: gerarId(),

            texto,

            concluida: false,

            criadaEm:
                agoraISO()

        });

    AtlasStorage.save(
        dados
    );

    input.value = "";

    abrirAtividade(
        atividadeAtual
    );

    atualizarDashboard();

}

function alternarTarefa(
    id
) {

    const dados =
        AtlasStorage.get();

    const tarefas =
        dados
            .atividades[
                atividadeAtual
            ]
            .tarefas;

    const tarefa =
        tarefas.find(
            t => t.id === id
        );

    if (!tarefa) return;

    tarefa.concluida =
        !tarefa.concluida;

    AtlasStorage.save(
        dados
    );

    abrirAtividade(
        atividadeAtual
    );

    atualizarDashboard();

}

/* ==========================================================
   PROJETOS
========================================================== */

function carregarProjetos(
    atividade
) {

    const lista =
        document.getElementById(
            "listaProjetos"
        );

    lista.innerHTML = "";

    atividade.projetos.forEach(
        projeto => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "list-item";

            item.innerHTML = `
                <strong>
                    ${projeto.nome}
                </strong>

                <br>

                <small>
                    Status:
                    ${projeto.status}
                </small>
            `;

            lista.appendChild(
                item
            );

        }
    );

}

function adicionarProjeto() {

    if (!atividadeAtual) return;

    const input =
        document.getElementById(
            "novoProjeto"
        );

    const nome =
        input.value.trim();

    if (!nome) return;

    const dados =
        AtlasStorage.get();

    dados
        .atividades[
            atividadeAtual
        ]
        .projetos
        .push({

            id: gerarId(),

            nome,

            descricao: "",

            status: "ativo",

            criadoEm:
                agoraISO()

        });

    AtlasStorage.save(
        dados
    );

    input.value = "";

    abrirAtividade(
        atividadeAtual
    );

}

/* ==========================================================
   NOTAS
========================================================== */

function carregarNotas(
    atividade
) {

    const lista =
        document.getElementById(
            "listaNotas"
        );

    lista.innerHTML = "";

    const notasOrdenadas =
        [...atividade.notas]
            .reverse();

    notasOrdenadas.forEach(
        nota => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "list-item";

            item.innerHTML = `
                <small style="opacity:.7;">
                    ${formatarData(
                        nota.data
                    )}
                </small>

                <p style="margin-top:10px;">
                    ${nota.texto}
                </p>
            `;

            lista.appendChild(
                item
            );

        }
    );

}

function adicionarNota() {

    if (!atividadeAtual) return;

    const textarea =
        document.getElementById(
            "novaNota"
        );

    const texto =
        textarea.value.trim();

    if (!texto) return;

    const dados =
        AtlasStorage.get();

    dados
        .atividades[
            atividadeAtual
        ]
        .notas
        .push({

            id: gerarId(),

            data:
                agoraISO(),

            texto

        });

    AtlasStorage.save(
        dados
    );

    textarea.value = "";

    abrirAtividade(
        atividadeAtual
    );

}

/* ==========================================================
   UTILITÁRIOS
========================================================== */

function formatarData(
    dataISO
) {

    return new Date(
        dataISO
    ).toLocaleString(
        "pt-BR"
    );

}

/* ==========================================================
   EVENTOS
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById(
                "btnVoltar"
            )
            ?.addEventListener(
                "click",
                voltarDashboard
            );

        document
            .getElementById(
                "btnAdicionarTarefa"
            )
            ?.addEventListener(
                "click",
                adicionarTarefa
            );

        document
            .getElementById(
                "btnAdicionarProjeto"
            )
            ?.addEventListener(
                "click",
                adicionarProjeto
            );

        document
            .getElementById(
                "btnSalvarNota"
            )
            ?.addEventListener(
                "click",
                adicionarNota
            );

        document
            .getElementById(
                "metaHoras"
            )
            ?.addEventListener(
                "change",
                salvarMetas
            );

        document
            .getElementById(
                "metaTarefas"
            )
            ?.addEventListener(
                "change",
                salvarMetas
            );

    }
);