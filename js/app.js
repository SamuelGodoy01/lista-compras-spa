// =====================================================
// app.js – regras de negócio, eventos e inicialização
// =====================================================

// Cadastra novo produto verificando duplicidade normalizada
function cadastrarProduto(nome, unidade) {
    const chave = normalizar(nome);
    if (!chave) return { ok: false, msg: 'Informe o nome do produto.' };
    if (!UNIDADES.includes(unidade)) return { ok: false, msg: 'Unidade inválida.' };

    const existente = estado.produtos.find(p => normalizar(p.nome) === chave);
    if (existente) return { ok: false, msg: `"${existente.nome}" já está cadastrado.` };

    estado.produtos.push({
        id: gerarId(),
        nome: nome.trim().replace(/\s+/g, ' '),
        unidade
    });
    salvar();
    return { ok: true, msg: 'Produto cadastrado com sucesso!' };
}

// Adiciona item à lista ou soma quantidade se já existir
function adicionarItem(produtoId, quantidade) {
    if (!buscarProduto(produtoId)) return { ok: false, msg: 'Selecione um produto.' };
    if (!Number.isFinite(quantidade) || quantidade <= 0)
        return { ok: false, msg: 'Quantidade deve ser maior que zero.' };

    const item = estado.lista.find(i => i.produtoId === produtoId);
    if (item) {
        item.quantidade = Math.round((item.quantidade + quantidade) * 100) / 100;
        item.comprado = false;
        salvar();
        return { ok: true, msg: 'Quantidade somada ao item existente.' };
    }

    estado.lista.push({ id: gerarId(), produtoId, quantidade, comprado: false });
    salvar();
    return { ok: true, msg: 'Item adicionado!' };
}

// Edita quantidade de um item existente (Desafio Básico #1)
function editarQuantidade(id) {
    const item = estado.lista.find(i => i.id === id);
    if (!item) return;

    const produto = buscarProduto(item.produtoId);
    const entrada = prompt(`Nova quantidade para ${produto.nome} (${produto.unidade}):`, item.quantidade);
    if (entrada === null) return; // Usuário cancelou

    const novaQtd = Number(entrada.replace(',', '.'));
    if (!Number.isFinite(novaQtd) || novaQtd <= 0) {
        alert('Quantidade inválida. Informe um número maior que zero.');
        return;
    }

    item.quantidade = Math.round(novaQtd * 100) / 100;
    salvar();
    renderizarLista();
}

// Alterna status de comprado
function alternarComprado(id) {
    const item = estado.lista.find(i => i.id === id);
    if (item) {
        item.comprado = !item.comprado;
        salvar();
    }
}

// Remove um item específico
function removerItem(id) {
    estado.lista = estado.lista.filter(i => i.id !== id);
    salvar();
}

// Remove todos os itens marcados como comprados (Desafio Básico #2)
function limparComprados() {
    const temComprados = estado.lista.some(i => i.comprado);
    if (!temComprados) return;

    estado.lista = estado.lista.filter(i => !i.comprado);
    salvar();
    renderizarLista();
}

// Alterna visualização entre abas (SPA)
function mostrarAba(nome) {
    // No mobile (< 700px), alterna entre seções; no desktop, mantém ambas visíveis
    const isMobile = window.innerWidth <= 700;
    document.querySelectorAll('[data-secao]').forEach(sec => {
        if (isMobile) {
            sec.classList.toggle('oculto', sec.dataset.secao !== nome);
        } else {
            sec.classList.remove('oculto');
        }
    });

    document.querySelectorAll('[data-aba]').forEach(btn =>
        btn.classList.toggle('ativa', btn.dataset.aba === nome)
    );
}

// Registro de todos os eventos da aplicação
function registrarEventos() {
    // Navegação por abas
    document.querySelectorAll('[data-aba]').forEach(btn =>
        btn.addEventListener('click', () => mostrarAba(btn.dataset.aba))
    );
    window.addEventListener('resize', () => {
        const abaAtiva = document.querySelector('.aba.ativa')?.dataset.aba || 'lista';
        mostrarAba(abaAtiva);
    });

    // Cadastro de produto
    $('#formProduto').addEventListener('submit', (e) => {
        e.preventDefault();
        const r = cadastrarProduto($('#nomeProduto').value, $('#unidade').value);
        mostrarMensagem($('#msgProduto'), r.msg, r.ok ? 'ok' : 'erro');
        if (r.ok) {
            e.target.reset();
            renderizar();
        }
        $('#nomeProduto').focus();
    });

    // Adição de item à lista
    $('#formLista').addEventListener('submit', (e) => {
        e.preventDefault();
        const r = adicionarItem($('#selProduto').value, Number($('#quantidade').value));
        mostrarMensagem($('#msgLista'), r.msg, r.ok ? 'ok' : 'erro');
        if (r.ok) {
            e.target.reset();
            $('#unidadeSel').textContent = '-';
            renderizarLista();
        }
    });

    // Atualiza unidade exibida ao selecionar produto
    $('#selProduto').addEventListener('change', (e) => {
        const p = buscarProduto(e.target.value);
        $('#unidadeSel').textContent = p ? p.unidade : '-';
    });

    // Delegação de eventos na lista de compras
    const ul = $('#lista');
    ul.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            alternarComprado(e.target.closest('li').dataset.id);
            renderizarLista();
        }
    });

    ul.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;

        if (e.target.matches('.btn-editar')) {
            editarQuantidade(li.dataset.id);
        } else if (e.target.matches('.btn-remover')) {
            removerItem(li.dataset.id);
            renderizarLista();
        }
    });

    // Limpar itens comprados
    $('#btnLimparComprados').addEventListener('click', limparComprados);

    // Exportar JSON
    $('#btnExportarProdutos').addEventListener('click', () =>
        exportarJSON('produtos.json', estado.produtos)
    );
    $('#btnExportarLista').addEventListener('click', () =>
        exportarJSON('lista.json', estado.lista)
    );

    // Importar JSON
    $('#arquivoJson').addEventListener('change', async (e) => {
        const arquivo = e.target.files[0];
        if (!arquivo) return;
        try {
            const { tipo, dados } = await importarJSON(arquivo);
            estado[tipo] = dados;
            salvar();
            renderizar();
            alert(`Arquivo de ${tipo} importado com sucesso!`);
        } catch (erro) {
            alert('Erro ao importar: ' + erro.message);
        } finally {
            e.target.value = '';
        }
    });
}

// Inicialização da SPA
document.addEventListener('DOMContentLoaded', async () => {
    await carregar();
    registrarEventos();
    renderizar();
    mostrarAba('lista');
});