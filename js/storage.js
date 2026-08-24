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
            metaHorasSemana: 30,
            metaTarefasSemana: 6
        }),

        estudos_impactos_ambientais: criarAtividade({
            nome: "Estudos de impactos ambientais",
            categoria: "Acadêmico",
            cor: "#c4b428",
            metaHorasSemana: 4,
            metaTarefasSemana: 1
        }),

        botanica_ambiental: criarAtividade({
            nome: "Botânica ambiental",
            categoria: "Acadêmico",
            cor: "#2E7D32",
            metaHorasSemana: 2,
            metaTarefasSemana: 1
        }),

        desenvolvimento_produtos_sustentaveis: criarAtividade({
            nome: "Desenvolvimento de produtos sustentáveis",
            categoria: "Acadêmico",
            cor: "#bbd815",
            metaHorasSemana: 3,
            metaTarefasSemana: 1
        }),

        engenharia_agroecologica: criarAtividade({
            nome: "Engenharia Agroecológica",
            categoria: "Acadêmico",
            cor: "#f02caf",
            metaHorasSemana: 3,
            metaTarefasSemana: 1
        }),

         topicos_eng_ambienatl: criarAtividade({
            nome: "Tópicos Especiais em Engenharia do Meio Ambiente",
            categoria: "Acadêmico",
            cor: "#dd3705",
            metaHorasSemana: 3,
            metaTarefasSemana: 1
        }),

         processos_produtivos_sustentaveis: criarAtividade({
            nome: "Processos Produtivos Sustentáveis",
            categoria: "Acadêmico",
            cor: "#f8731b",
            metaHorasSemana: 3,
            metaTarefasSemana: 1
        }),

         modelagem_sistemas_ambientais: criarAtividade({
            nome: "Modelagem de Sistemas Ambientais",
            categoria: "Acadêmico",
            cor: "#339de4",
            metaHorasSemana: 4,
            metaTarefasSemana: 1
        }),

        portfolio: criarAtividade({
            nome: "Portfólio",
            categoria: "Profissional",
            cor: "#c254a6",
            metaHorasSemana: 5,
            metaTarefasSemana: 2
        }),

        hobbies: criarAtividade({
            nome: "Hobbies",
            categoria: "Pessoal",
            cor: "#f79c0b",
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
            cor: "#702bc0",
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
