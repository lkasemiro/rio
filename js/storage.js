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

}

/* ==========================================================
   BANCO PADRÃO
========================================================== */

const DEFAULT_DATA = {

    versao: "1.0.0",

    criadoEm: new Date().toISOString(),

    configuracoes: {

        tema: "dark",

        ultimaExportacao: null

    },

    ui: {

        atividadeSelecionada: null

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
        })

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
            !banco.atividades
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