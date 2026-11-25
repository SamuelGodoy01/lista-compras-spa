// =====================================================
// interface.js – renderização segura do DOM via estado
// =====================================================

const $ = (seletor) => document.querySelector(seletor);

// Busca objeto produto pelo seu ID
function buscarProduto(id) {
    return estado.produtos.find(p => p.id === id);
}

// Exibe feedback visual de sucesso ou erro
function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = 'msg ' + tipo;
}

// Preenche o select de produtos ordenados alfabeticamente
function renderizarSelect() {
    const select = $('#selProduto');
    select.replaceChildren(new Option('Selecione um produto', ''));
    [...estado.produtos]
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach(p => select.add(new Option(`${p.nome} (${p.unidade})`, p.id)));
}

// Renderiza a lista de produtos na aba Produtos (usando textContent contra XSS)
function renderizarProdutos() {
    const ul = $('#listaProdutos');
    ul.replaceChildren();
    [...estado.produtos]
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.nome} · ${p.unidade}`;
            ul.appendChild(li);
        });
}

// Calcula totais de itens usando reduce
function contar() {
    return estado.lista.reduce((c, item) => {
        c.total++;
        item.comprado ? c.comprados++ : c.pendentes++;
        return c;
    }, { total: 0, comprados: 0, pendentes: 0 });
}

// Renderiza a lista de compras ordenada alfabeticamente (Desafio Básico #3)
function renderizarLista() {
    const ul = $('#lista');
    ul.replaceChildren();

    // Ordena alfabeticamente pelo nome do produto correspondente
    const listaOrdenada = [...estado.lista].sort((a, b) => {
        const prodA = buscarProduto(a.produtoId);
        const prodB = buscarProduto(b.produtoId);
        if (!prodA || !prodB) return 0;
        return prodA.nome.localeCompare(prodB.nome, 'pt-BR');
    });

    listaOrdenada.forEach(item => {
        const produto = buscarProduto(item.produtoId);
        if (!produto) return;

        const li = document.createElement('li');
        li.className = 'item' + (item.comprado ? ' comprado' : '');
        li.dataset.id = item.id;

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = item.comprado;
        check.setAttribute('aria-label', 'Marcar ' + produto.nome + ' como comprado');

        const nome = document.createElement('span');
        nome.className = 'nome';
        nome.textContent = produto.nome;

        const qtd = document.createElement('span');
        qtd.className = 'qtd';
        qtd.textContent = `${item.quantidade.toLocaleString('pt-BR')} ${produto.unidade}`;

        // Botão de editar quantidade (Desafio Básico #1)
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-editar';
        btnEditar.type = 'button';
        btnEditar.textContent = '✏️';
        btnEditar.title = 'Editar quantidade';

        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn-remover';
        btnRemover.type = 'button';
        btnRemover.textContent = '🗑';
        btnRemover.title = 'Remover';

        li.append(check, nome, qtd, btnEditar, btnRemover);
        ul.appendChild(li);
    });

    const c = contar();
    $('#cTotal').textContent = c.total;
    $('#cComprados').textContent = c.comprados;
    $('#cPendentes').textContent = c.pendentes;
    $('#selo').textContent = c.pendentes;
    $('#vazia').classList.toggle('oculto', c.total > 0);
}

// Atualiza toda a interface
function renderizar() {
    renderizarSelect();
    renderizarProdutos();
    renderizarLista();
}