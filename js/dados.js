// =====================================================
// dados.js – estado, utilidades e persistência em JSON
// =====================================================

// Unidades permitidas no sistema
const UNIDADES = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'dz', 'cx'];

// Chaves utilizadas no localStorage
const CHAVE_PRODUTOS = 'lc_produtos';
const CHAVE_LISTA = 'lc_lista';

// Estado global da aplicação (fonte única da verdade)
const estado = {
    produtos: [], // [{ id, nome, unidade }]
    lista: []     // [{ id, produtoId, quantidade, comprado }]
};

// Normaliza texto (remove espaços extras, acentos e converte para minúsculas)
function normalizar(texto) {
    return String(texto)
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Gera um identificador único baseado no timestamp e número aleatório
function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Salva produtos e lista no localStorage em formato JSON
function salvar() {
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(estado.produtos));
    localStorage.setItem(CHAVE_LISTA, JSON.stringify(estado.lista));
}

// Carrega dados do localStorage ou busca data/produtos.json na primeira execução
async function carregar() {
    const produtosSalvos = localStorage.getItem(CHAVE_PRODUTOS);
    const listaSalva = localStorage.getItem(CHAVE_LISTA);

    if (produtosSalvos) {
        try {
            estado.produtos = JSON.parse(produtosSalvos);
            estado.lista = listaSalva ? JSON.parse(listaSalva) : [];
            return;
        } catch (erro) {
            console.warn('localStorage corrompido, recarregando do arquivo.', erro);
        }
    }

    try {
        const resposta = await fetch('data/produtos.json');
        if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
        const dados = await resposta.json();
        estado.produtos = validarProdutos(dados) ? dados : [];
    } catch (erro) {
        console.warn('Não foi possível carregar produtos.json:', erro.message);
        estado.produtos = [];
    }

    estado.lista = [];
    salvar();
}

// Valida se o array importado possui estrutura válida de produtos
function validarProdutos(dados) {
    return Array.isArray(dados) && dados.every(p =>
        p && typeof p.id === 'string' &&
        typeof p.nome === 'string' && p.nome.trim() !== '' &&
        UNIDADES.includes(p.unidade)
    );
}

// Valida se o array importado possui estrutura válida de itens da lista
function validarLista(dados) {
    return Array.isArray(dados) && dados.every(i =>
        i && typeof i.id === 'string' &&
        typeof i.produtoId === 'string' &&
        typeof i.quantidade === 'number' && i.quantidade > 0 &&
        typeof i.comprado === 'boolean'
    );
}

// Cria um Blob em memória e dispara o download do arquivo .json
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

// Lê e valida o arquivo .json enviado via input file
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