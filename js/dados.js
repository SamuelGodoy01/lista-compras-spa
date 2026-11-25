// =====================================================
// dados.js – estado, múltiplas listas, tema e JSON
// =====================================================

const UNIDADES = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'dz', 'cx'];
const CATEGORIAS = [
    'Mercearia',
    'Hortifrúti',
    'Laticínios',
    'Limpeza',
    'Bebidas',
    'Açougue e Frios',
    'Outros'
];

const CHAVE_PRODUTOS = 'lc_produtos';
const CHAVE_LISTAS = 'lc_listas';
const CHAVE_LISTA_ATIVA = 'lc_lista_ativa';
const CHAVE_TEMA = 'lc_tema';

const estado = {
    produtos: [], // [{ id, nome, unidade, categoria, precoUnitario }]
    listas: {     // { "Mês": [{ id, produtoId, quantidade, comprado }] }
        'Mês': []
    },
    listaAtiva: 'Mês',
    filtro: 'todos', // 'todos' | 'pendentes' | 'comprados'
    tema: 'auto'     // 'auto' | 'escuro' | 'claro'
};

function obterListaAtual() {
    if (!estado.listas[estado.listaAtiva]) {
        estado.listas[estado.listaAtiva] = [];
    }
    return estado.listas[estado.listaAtiva];
}

function definirListaAtual(novosItens) {
    estado.listas[estado.listaAtiva] = novosItens;
}

function normalizar(texto) {
    return String(texto)
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number.isFinite(valor) ? valor : 0);
}

function salvar() {
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(estado.produtos));
    localStorage.setItem(CHAVE_LISTAS, JSON.stringify(estado.listas));
    localStorage.setItem(CHAVE_LISTA_ATIVA, estado.listaAtiva);
    localStorage.setItem(CHAVE_TEMA, estado.tema);
}

async function carregar() {
    const temaSalvo = localStorage.getItem(CHAVE_TEMA);
    if (temaSalvo) estado.tema = temaSalvo;

    const produtosSalvos = localStorage.getItem(CHAVE_PRODUTOS);
    const listasSalvas = localStorage.getItem(CHAVE_LISTAS);
    const listaAtivaSalva = localStorage.getItem(CHAVE_LISTA_ATIVA);

    if (produtosSalvos) {
        try {
            const parsedProd = JSON.parse(produtosSalvos);
            estado.produtos = parsedProd.map(p => ({
                ...p,
                categoria: CATEGORIAS.includes(p.categoria) ? p.categoria : 'Outros',
                precoUnitario: typeof p.precoUnitario === 'number' && p.precoUnitario >= 0 ? p.precoUnitario : 0
            }));

            if (listasSalvas) {
                const parsedListas = JSON.parse(listasSalvas);
                if (parsedListas && typeof parsedListas === 'object' && !Array.isArray(parsedListas)) {
                    estado.listas = parsedListas;
                }
            }

            if (listaAtivaSalva && estado.listas[listaAtivaSalva]) {
                estado.listaAtiva = listaAtivaSalva;
            } else {
                estado.listaAtiva = Object.keys(estado.listas)[0] || 'Mês';
                obterListaAtual();
            }
            return;
        } catch (erro) {
            console.warn('localStorage corrompido, recarregando do arquivo.', erro);
        }
    }

    try {
        const resposta = await fetch('data/produtos.json');
        if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
        const dados = await resposta.json();
        estado.produtos = validarProdutos(dados)
            ? dados.map(p => ({
                ...p,
                categoria: CATEGORIAS.includes(p.categoria) ? p.categoria : 'Mercearia',
                precoUnitario: typeof p.precoUnitario === 'number' ? p.precoUnitario : 0
            }))
            : [];
    } catch (erro) {
        console.warn('Não foi possível carregar produtos.json:', erro.message);
        estado.produtos = [];
    }

    estado.listas = { 'Mês': [] };
    estado.listaAtiva = 'Mês';
    salvar();
}

function validarProdutos(dados) {
    return Array.isArray(dados) && dados.every(p =>
        p && typeof p.id === 'string' &&
        typeof p.nome === 'string' && p.nome.trim() !== '' &&
        UNIDADES.includes(p.unidade)
    );
}

function validarLista(dados) {
    return Array.isArray(dados) && dados.every(i =>
        i && typeof i.id === 'string' &&
        typeof i.produtoId === 'string' &&
        typeof i.quantidade === 'number' && i.quantidade > 0 &&
        typeof i.comprado === 'boolean'
    );
}

function exportarJSON(nomeArquivo, dados) {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

// Gravação direta em arquivo via File System Access API (Chrome/Edge)
async function salvarDiretoEmArquivo(nomeSugerido, dados) {
    if (typeof window.showSaveFilePicker !== 'function') {
        exportarJSON(nomeSugerido, dados);
        return 'Seu navegador não suporta gravação direta; o download foi iniciado.';
    }

    const handle = await window.showSaveFilePicker({
        suggestedName: nomeSugerido,
        types: [{
            description: 'Arquivo JSON',
            accept: { 'application/json': ['.json'] }
        }]
    });

    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(dados, null, 2));
    await writable.close();
    return `Arquivo "${nomeSugerido}" salvo diretamente com sucesso!`;
}

async function importarJSON(arquivo) {
    const texto = await arquivo.text();
    let dados;
    try {
        dados = JSON.parse(texto);
    } catch {
        throw new Error('O arquivo não contém um JSON válido.');
    }
    if (validarProdutos(dados)) return { tipo: 'produtos', dados };
    if (validarLista(dados)) return { tipo: 'lista', dados };
    throw new Error('Estrutura desconhecida: use produtos.json ou lista.json.');
}

window.formatarMoeda = formatarMoeda;
window.normalizar = normalizar;
window.gerarId = gerarId;
window.salvar = salvar;
window.obterListaAtual = obterListaAtual;
window.definirListaAtual = definirListaAtual;