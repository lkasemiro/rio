/* ==========================================================
   ATLAS
   MARATHON.JS
========================================================== */

let maratonaAtual = null;

/* ==========================================================
   DASHBOARD
========================================================== */

function renderizarMaratonas() {

    const container =
        document.getElementById(
            "marathonsGrid"
        );

    if (!container) return;

    const dados =
        AtlasStorage.get();

    container.innerHTML = "";

    Object.entries(
        dados.maratonas || {}
    ).forEach(([id, maratona]) => {

        const progresso =
            calcularProgressoMaratona(
                maratona
            );

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "activity-card";

        card.style.borderLeft =
            `6px solid ${maratona.cor}`;

        card.innerHTML = `
            <h3>${maratona.nome}</h3>

            <p>
                Meta:
                ${maratona.metaHoras}h
            </p>

            <p>
                Progresso:
                ${progresso.toFixed(1)}%
            </p>

            <div
                style="
                    width:100%;
                    height:8px;
                    background:#222;
                    border-radius:20px;
                    overflow:hidden;
                    margin-top:10px;
                "
            >
                <div
                    style="
                        width:${progresso}%;
                        height:100%;
                        background:${maratona.cor};
                    "
                ></div>
            </div>
        `;

        card.addEventListener(
            "click",
            () => abrirMaratona(id)
        );

        container.appendChild(
            card
        );

    });

}

/* ==========================================================
   ABRIR
========================================================== */

function abrirMaratona(id) {

    const dados =
        AtlasStorage.get();

    const maratona =
        dados.maratonas[id];

    if (!maratona) return;

    maratonaAtual = id;

    dados.ui.maratonaSelecionada =
        id;

    AtlasStorage.save(
        dados
    );

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
        .remove("active");

    document
        .getElementById(
            "marathonView"
        )
        .classList
        .add("active");

    preencherMaratona();

}

/* ==========================================================
   FECHAR
========================================================== */

function voltarDashboardMaratona() {

    document
        .getElementById(
            "marathonView"
        )
        .classList
        .remove("active");

    document
        .getElementById(
            "dashboardView"
        )
        .classList
        .add("active");

    maratonaAtual = null;

    atualizarDashboard();

}

/* ==========================================================
   PREENCHER
========================================================== */

function preencherMaratona() {

    if (!maratonaAtual) return;

    const dados =
        AtlasStorage.get();

    const maratona =
        dados.maratonas[
            maratonaAtual
        ];

    const realizado =
        horasRealizadasMaratona(
            maratona
        );

    const faltam =
        Math.max(
            0,
            maratona.metaHoras -
            realizado
        );

    const progresso =
        calcularProgressoMaratona(
            maratona
        );

    document.getElementById(
        "marathonNome"
    ).textContent =
        maratona.nome;

    document.getElementById(
        "marathonPrazo"
    ).textContent =
        `Prazo: ${maratona.prazo}`;

    document.getElementById(
        "marathonMeta"
    ).textContent =
        maratona.metaHoras + "h";

    document.getElementById(
        "marathonRealizado"
    ).textContent =
        realizado.toFixed(1) + "h";

    document.getElementById(
        "marathonFaltam"
    ).textContent =
        faltam.toFixed(1) + "h";

    document.getElementById(
        "marathonProgress"
    ).value =
        progresso;

    carregarTextos();
    carregarListas();
    carregarDuvidas();
    carregarFormulas();
    carregarDiario();

}

/* ==========================================================
   PROGRESSO
========================================================== */

function horasRealizadasMaratona(
    maratona
) {

    const dados =
        AtlasStorage.get();

    const atividade =
        dados.atividades[
            maratona
                .atividadeVinculada
        ];

    if (!atividade)
        return 0;

    return (
        atividade.totalSegundos /
        3600
    );

}

function calcularProgressoMaratona(
    maratona
) {

    const horas =
        horasRealizadasMaratona(
            maratona
        );

    return Math.min(
        100,
        (horas /
            maratona.metaHoras) *
            100
    );

}

/* ==========================================================
   TEXTOS
========================================================== */

function carregarTextos() {

    const lista =
        document.getElementById(
            "listaTextos"
        );

    lista.innerHTML = "";

    const maratona =
        AtlasStorage.get()
            .maratonas[
                maratonaAtual
            ];

    maratona.textos.forEach(
        texto => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "list-item";

            div.innerHTML = `
                <label>
                    <input
                        type="checkbox"
                        ${texto.concluido ? "checked" : ""}
                    >
                    ${texto.titulo}
                </label>
            `;

            div.querySelector(
                "input"
            ).addEventListener(
                "change",
                () => {

                    texto.concluido =
                        !texto.concluido;

                    salvarMaratona(
                        maratona
                    );

                }
            );

            lista.appendChild(div);

        });

}

/* ==========================================================
   LISTAS
========================================================== */

function carregarListas() {

    const lista =
        document.getElementById(
            "listaListas"
        );

    lista.innerHTML = "";

    const maratona =
        AtlasStorage.get()
            .maratonas[
                maratonaAtual
            ];

    maratona.listas.forEach(
        item => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "list-item";

            div.innerHTML = `

                <label>

                    <input
                        type="checkbox"
                        ${item.concluido ? "checked" : ""}
                    >

                    <strong>
                        ${item.titulo}
                    </strong>

                </label>

                <div class="lista-score">

                    <input
                        type="number"
                        class="lista-acertos"
                        placeholder="Acertos"
                        value="${item.acertos || 0}"
                    >

                    <input
                        type="number"
                        class="lista-total"
                        placeholder="Questões"
                        value="${item.totalQuestoes || 0}"
                    >

                    <input
                        type="number"
                        class="lista-nota"
                        placeholder="Nota"
                        step="0.1"
                        min="0"
                        max="10"
                        value="${item.nota ?? ''}"
                    >

                </div>

            `;

            const checkbox =
                div.querySelector(
                    'input[type="checkbox"]'
                );

            checkbox.addEventListener(
                "change",
                () => {

                    item.concluido =
                        checkbox.checked;

                    salvarMaratona(
                        maratona
                    );

                }
            );

            const acertosInput =
                div.querySelector(
                    ".lista-acertos"
                );

            const totalInput =
                div.querySelector(
                    ".lista-total"
                );

            const notaInput =
                div.querySelector(
                    ".lista-nota"
                );

            function salvarDesempenho() {

                item.acertos =
                    Number(
                        acertosInput.value
                    ) || 0;

                item.totalQuestoes =
                    Number(
                        totalInput.value
                    ) || 0;

                item.nota =
                    notaInput.value === ""
                        ? null
                        : Number(
                            notaInput.value
                        );

                salvarMaratona(
                    maratona
                );

            }

            acertosInput.addEventListener(
                "change",
                salvarDesempenho
            );

            totalInput.addEventListener(
                "change",
                salvarDesempenho
            );

            notaInput.addEventListener(
                "change",
                salvarDesempenho
            );

            lista.appendChild(
                div
            );

        }

    );

}

/* ==========================================================
   DÚVIDAS
========================================================== */

function carregarDuvidas() {

    const lista =
        document.getElementById(
            "listaDuvidas"
        );

    lista.innerHTML = "";

    const maratona =
        AtlasStorage.get()
            .maratonas[
                maratonaAtual
            ];

    maratona.duvidas.forEach(
        item => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "list-item";

            div.textContent =
                item.texto;

            lista.appendChild(div);

        });

}

/* ==========================================================
   FORMULAS
========================================================== */

function carregarFormulas() {

    const lista =
        document.getElementById(
            "listaFormulas"
        );

    lista.innerHTML = "";

    const maratona =
        AtlasStorage.get()
            .maratonas[
                maratonaAtual
            ];

    maratona.formulas.forEach(
        item => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "list-item";

            div.textContent =
                item.texto;

            lista.appendChild(div);

        });

}

/* ==========================================================
   DIÁRIO
========================================================== */

function carregarDiario() {

    const lista =
        document.getElementById(
            "listaDiario"
        );

    lista.innerHTML = "";

    const maratona =
        AtlasStorage.get()
            .maratonas[
                maratonaAtual
            ];

    [...maratona.diario]
        .reverse()
        .forEach(item => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "list-item";

            div.innerHTML = `
                <small>
                    ${new Date(
                        item.data
                    ).toLocaleString("pt-BR")}
                </small>

                <p>
                    ${item.texto}
                </p>
            `;

            lista.appendChild(div);

        });

}

/* ==========================================================
   SALVAR
========================================================== */

function salvarMaratona(
    maratona
) {

    const dados =
        AtlasStorage.get();

    dados.maratonas[
        maratonaAtual
    ] = maratona;

    AtlasStorage.save(
        dados
    );

}

/* ==========================================================
   ADICIONAR
========================================================== */

function adicionarTexto() {

    const valor =
        document
            .getElementById(
                "novoTexto"
            )
            .value
            .trim();

    if (!valor) return;

    const dados =
        AtlasStorage.get();

    dados.maratonas[
        maratonaAtual
    ].textos.push({

        id: gerarId(),

        titulo: valor,

        concluido: false

    });

    AtlasStorage.save(
        dados
    );

    document.getElementById(
        "novoTexto"
    ).value = "";

    preencherMaratona();

}

function adicionarLista() {

    if (!maratonaAtual) return;

    const input =
        document.getElementById(
            "novaLista"
        );

    const valor =
        input.value.trim();

    if (!valor) return;

    const dados =
        AtlasStorage.get();

    dados.maratonas[
        maratonaAtual
    ].listas.push({

        id: gerarId(),

        titulo: valor,

        concluido: false,

        acertos: 0,

        totalQuestoes: 0,

        nota: null,

        tempoEstudo: 0,

        observacoes: "",

        criadaEm:
            agoraISO()

    });

    AtlasStorage.save(
        dados
    );

    input.value = "";

    preencherMaratona();

}
function adicionarDuvida() {

    const valor =
        document
            .getElementById(
                "novaDuvida"
            )
            .value
            .trim();

    if (!valor) return;

    const dados =
        AtlasStorage.get();

    dados.maratonas[
        maratonaAtual
    ].duvidas.push({

        id: gerarId(),

        texto: valor

    });

    AtlasStorage.save(
        dados
    );

    document.getElementById(
        "novaDuvida"
    ).value = "";

    preencherMaratona();

}

function adicionarFormula() {

    const valor =
        document
            .getElementById(
                "novaFormula"
            )
            .value
            .trim();

    if (!valor) return;

    const dados =
        AtlasStorage.get();

    dados.maratonas[
        maratonaAtual
    ].formulas.push({

        id: gerarId(),

        texto: valor

    });

    AtlasStorage.save(
        dados
    );

    document.getElementById(
        "novaFormula"
    ).value = "";

    preencherMaratona();

}

function adicionarRegistro() {

    const valor =
        document
            .getElementById(
                "novoRegistro"
            )
            .value
            .trim();

    if (!valor) return;

    const dados =
        AtlasStorage.get();

    dados.maratonas[
        maratonaAtual
    ].diario.push({

        id: gerarId(),

        data: agoraISO(),

        texto: valor

    });

    AtlasStorage.save(
        dados
    );

    document.getElementById(
        "novoRegistro"
    ).value = "";

    preencherMaratona();

}

/* ==========================================================
   EVENTOS
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById(
                "btnVoltarMarathon"
            )
            ?.addEventListener(
                "click",
                voltarDashboardMaratona
            );

        document
            .getElementById(
                "btnAdicionarTexto"
            )
            ?.addEventListener(
                "click",
                adicionarTexto
            );

        document
            .getElementById(
                "btnAdicionarLista"
            )
            ?.addEventListener(
                "click",
                adicionarLista
            );

        document
            .getElementById(
                "btnAdicionarDuvida"
            )
            ?.addEventListener(
                "click",
                adicionarDuvida
            );

        document
            .getElementById(
                "btnAdicionarFormula"
            )
            ?.addEventListener(
                "click",
                adicionarFormula
            );

        document
            .getElementById(
                "btnAdicionarRegistro"
            )
            ?.addEventListener(
                "click",
                adicionarRegistro
            );

    }
);