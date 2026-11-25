// =====================================================
// app.js – regras de negócio, eventos e inicialização
// =====================================================

function cadastrarProduto(nome, unidade, categoria, precoUnitario) {
    const chave = normalizar(nome);
    if (!chave) return { ok: false, msg: 'Informe o nome do produto.' };
    if (!UNIDADES.includes(unidade)) return { ok: false, msg: 'Unidade inválida.' };

    const existente = estado.produtos.find(p => normalizar(p.nome) === chave);
    if (existente) return { ok: false, msg: `"${existente.nome}" já está cadastrado.` };

    const precoLimpo = Number.isFinite(precoUnitario) && precoUnitario >= 0
        ? Math.round(precoUnitario * 100) / 100
        : 0;

    estado.produtos.push({
        id: gerarId(),
        nome: nome.trim().replace(/\s+/g, ' '),
        unidade,
        categoria: CATEGORIAS.includes(categoria) ? categoria : 'Outros',
        precoUnitario: precoLimpo
    });
    salvar();
    return { ok: true, msg: 'Produto cadastrado com sucesso!' };
}

function adicionarItem(produtoId, quantidade) {
    if (!buscarProduto(produtoId)) return { ok: false, msg: 'Selecione um produto.' };
    if (!Number.isFinite(quantidade) || quantidade <= 0)
        return { ok: false, msg: 'Quantidade deve ser maior que zero.' };

    const listaAtual = obterListaAtual();
    const item = listaAtual.find(i => i.produtoId === produtoId);

    if (item) {
        item.quantidade = Math.round((item.quantidade + quantidade) * 100) / 100;
        item.comprado = false;
        salvar();
        return { ok: true, msg: 'Quantidade somada ao item existente.' };
    }

    listaAtual.push({ id: gerarId(), produtoId, quantidade, comprado: false });
    salvar();
    return { ok: true, msg: 'Item adicionado!' };
}

function editarQuantidade(id) {
    const listaAtual = obterListaAtual();
    const item = listaAtual.find(i => i.id === id);
    if (!item) return;

    const produto = buscarProduto(item.produtoId);
    const entrada = prompt(`Nova quantidade para ${produto.nome} (${produto.unidade}):`, item.quantidade);
    if (entrada === null) return;

    const novaQtd = Number(entrada.replace(',', '.'));
    if (!Number.isFinite(novaQtd) || novaQtd <= 0) {
        alert('Quantidade inválida. Informe um número maior que zero.');
        return;
    }

    item.quantidade = Math.round(novaQtd * 100) / 100;
    salvar();
    renderizarLista();
}

function alternarComprado(id) {
    const listaAtual = obterListaAtual();
    const item = listaAtual.find(i => i.id === id);
    if (item) {
        item.comprado = !item.comprado;
        salvar();
    }
}

function removerItem(id) {
    const novaLista = obterListaAtual().filter(i => i.id !== id);
    definirListaAtual(novaLista);
    salvar();
}

function limparComprados() {
    const listaAtual = obterListaAtual();
    if (!listaAtual.some(i => i.comprado)) return;

    definirListaAtual(listaAtual.filter(i => !i.comprado));
    salvar();
    renderizarLista();
}

function criarNovaLista() {
    const nome = prompt('Nome da nova lista (ex.: Churrasco, Feira):');
    if (!nome) return;

    const nomeLimpo = nome.trim().replace(/\s+/g, ' ');
    if (!nomeLimpo) return;

    if (!estado.listas[nomeLimpo]) {
        estado.listas[nomeLimpo] = [];
    }
    estado.listaAtiva = nomeLimpo;
    salvar();
    renderizar();
}

function alternarTema() {
    if (estado.tema === 'auto') estado.tema = 'escuro';
    else if (estado.tema === 'escuro') estado.tema = 'claro';
    else estado.tema = 'auto';
    salvar();
    aplicarTema();
}

function mostrarAba(nome) {
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

function registrarEventos() {
    document.querySelectorAll('[data-aba]').forEach(btn =>
        btn.addEventListener('click', () => mostrarAba(btn.dataset.aba))
    );

    window.addEventListener('resize', () => {
        const abaAtiva = document.querySelector('.aba.ativa')?.dataset.aba || 'lista';
        mostrarAba(abaAtiva);
    });

    $('#btnTema').addEventListener('click', alternarTema);

    $('#selListaAtiva').addEventListener('change', (e) => {
        estado.listaAtiva = e.target.value;
        salvar();
        renderizar();
    });

    $('#btnNovaLista').addEventListener('click', criarNovaLista);

    document.querySelectorAll('.filtro').forEach(btn => {
        btn.addEventListener('click', () => {
            estado.filtro = btn.dataset.filtro;
            renderizarLista();
        });
    });

    $('#formProduto').addEventListener('submit', (e) => {
        e.preventDefault();
        const r = cadastrarProduto(
            $('#nomeProduto').value,
            $('#unidade').value,
            $('#categoria').value,
            Number($('#precoUnitario').value)
        );
        mostrarMensagem($('#msgProduto'), r.msg, r.ok ? 'ok' : 'erro');
        if (r.ok) {
            e.target.reset();
            $('#precoUnitario').value = '0';
            renderizar();
        }
        $('#nomeProduto').focus();
    });

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

    $('#selProduto').addEventListener('change', (e) => {
        const p = buscarProduto(e.target.value);
        $('#unidadeSel').textContent = p ? p.unidade : '-';
    });

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

    $('#btnLimparComprados').addEventListener('click', limparComprados);

    $('#btnExportarProdutos').addEventListener('click', () =>
        exportarJSON('produtos.json', estado.produtos)
    );

    $('#btnExportarLista').addEventListener('click', () =>
        exportarJSON('lista.json', obterListaAtual())
    );

    $('#btnSalvarDireto').addEventListener('click', async () => {
        try {
            const msg = await salvarDiretoEmArquivo('lista.json', obterListaAtual());
            alert(msg);
        } catch (erro) {
            if (erro.name !== 'AbortError') {
                alert('Erro ao salvar arquivo: ' + erro.message);
            }
        }
    });

    $('#arquivoJson').addEventListener('change', async (e) => {
        const arquivo = e.target.files[0];
        if (!arquivo) return;
        try {
            const { tipo, dados } = await importarJSON(arquivo);
            if (tipo === 'produtos') {
                estado.produtos = dados;
            } else {
                definirListaAtual(dados);
            }
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

document.addEventListener('DOMContentLoaded', async () => {
    await carregar();
    registrarEventos();
    renderizar();
    mostrarAba('lista');
});