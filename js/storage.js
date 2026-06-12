/* ==========================================================
   ATLAS
   STORAGE.JS
========================================================== */

const STORAGE_KEY = "atlas";

/* ==========================================================
   MODELO DE ATIVIDADE
========================================================== */

function criarAtividade({
    nome,
    categoria,
    cor,
    metaHorasSemana,
    metaTarefasSemana
}) {

    return {

        nome,
        categoria,
        cor,

        criadaEm: new Date().toISOString(),

        totalSegundos: 0,
        totalSessoes: 0,

        ultimoAcesso: null,

        metaHorasSemana,
        metaTarefasSemana,

        tarefas: [],
        projetos: [],
        notas: [],
        sessoes: []

    };

};
/* ==========================================================
   BANCO PADRÃO
========================================================== */

const DEFAULT_DATA = {

    versao: "1.1.0",

    criadoEm: new Date().toISOString(),

    configuracoes: {
        tema: "dark",
        ultimaExportacao: null
    },

    ui: {
        atividadeSelecionada: null,
        maratonaSelecionada: null
    },

    timer: {
        atividadeAtiva: null,
        inicioSessao: null,
        pausado: true
    },

    atividades: {

        dma_cedae: criarAtividade({
            nome: "DMA-CEDAE",
            categoria: "Profissional",
            cor: "#005BAC",
            metaHorasSemana: 20,
            metaTarefasSemana: 5
        }),

        estatistica: criarAtividade({
            nome: "Estatística",
            categoria: "Acadêmico",
            cor: "#7B1FA2",
            metaHorasSemana: 10,
            metaTarefasSemana: 3
        }),

        sig: criarAtividade({
            nome: "SIG",
            categoria: "Acadêmico",
            cor: "#2E7D32",
            metaHorasSemana: 8,
            metaTarefasSemana: 3
        }),

        calculo: criarAtividade({
            nome: "Cálculo",
            categoria: "Acadêmico",
            cor: "#D84315",
            metaHorasSemana: 6,
            metaTarefasSemana: 2
        }),

        portfolio: criarAtividade({
            nome: "Portfólio",
            categoria: "Profissional",
            cor: "#00897B",
            metaHorasSemana: 5,
            metaTarefasSemana: 2
        }),

        hobbies: criarAtividade({
            nome: "Hobbies",
            categoria: "Pessoal",
            cor: "#F9A825",
            metaHorasSemana: 3,
            metaTarefasSemana: 0
        }),

        domesticas: criarAtividade({
            nome: "Domésticas",
            categoria: "Pessoal",
            cor: "#6D4C41",
            metaHorasSemana: 4,
            metaTarefasSemana: 0
        }),

        tabagismo: criarAtividade({
            nome: "Vícios",
            categoria: "Pessoal",
            cor: "#000000",
            metaHorasSemana: 0,
            metaTarefasSemana: 0
        }),

        rooting: criarAtividade({
            nome: "Rooting",
            categoria: "Pessoal",
            cor: "#C0115A",
            metaHorasSemana: 0,
            metaTarefasSemana: 0
        })

    },

    maratonas: {

        estatistica_p2: {

            id: "estatistica_p2",

            nome: "P2 Estatística",

            atividadeVinculada: "estatistica",

            cor: "#7B1FA2",

            inicio: dataHoje(),

            prazo: "2026-06-17",

            metaHoras: 40,

            metaDiaria: 8,

            concluida: false,

            textos: [],
            listas: [],
            duvidas: [],
            formulas: [],
            macetes: [],
            diario: [],
            metasDiarias: []

        },

        sig_p2: {

            id: "sig_p2",

            nome: "P2 SIG",

            atividadeVinculada: "sig",

            cor: "#2E7D32",

            inicio: dataHoje(),

            prazo: "2026-06-16",

            metaHoras: 20,

            metaDiaria: 4,

            concluida: false,

            textos: [],
            listas: [],
            duvidas: [],
            formulas: [],
            macetes: [],
            diario: [],
            metasDiarias: []

        }

    }

};
/* ==========================================================
   STORAGE
========================================================== */

const AtlasStorage = {

   init() {

    const dados =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (!dados) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                DEFAULT_DATA
            )
        );

        return;

    }

    try {

        const banco =
            JSON.parse(dados);

        if (
            !banco.ui ||
            !banco.timer ||
            !banco.atividades ||
            !banco.maratonas
        ) {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    DEFAULT_DATA
                )
            );

            console.warn(
                "Banco incompatível. Reset automático."
            );

        }

    } catch {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                DEFAULT_DATA
            )
        );

    }

},

    get() {

        return JSON.parse(
            localStorage.getItem(
                STORAGE_KEY
            )
        );

    },

    save(data) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

    },

    reset() {

        localStorage.removeItem(
            STORAGE_KEY
        );

        this.init();

    },

    exportJSON() {

        const data =
            this.get();

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        data,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const a =
            document.createElement(
                "a"
            );

        a.href = url;

        a.download =
            `atlas-backup-${Date.now()}.json`;

        a.click();

        URL.revokeObjectURL(
            url
        );

        console.log(
            "Backup exportado."
        );

    }

};

/* ==========================================================
   UTILITÁRIOS
========================================================== */

function gerarId() {

    return (
        Date.now() +
        Math.floor(
            Math.random() * 10000
        )
    );

}

function agoraISO() {

    return new Date()
        .toISOString();

}

function dataHoje() {

    return agoraISO()
        .split("T")[0];

}

/* ==========================================================
   AUTO INIT
========================================================== */

AtlasStorage.init();