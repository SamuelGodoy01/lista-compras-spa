// =====================================================
// interface.js – renderização, filtros, totais e tema
// =====================================================

const $ = (seletor) => document.querySelector(seletor);

function buscarProduto(id) {
    return estado.produtos.find(p => p.id === id);
}

function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = 'msg ' + tipo;
}

function aplicarTema() {
    document.body.classList.remove('escuro', 'claro');
    if (estado.tema === 'escuro') {
        document.body.classList.add('escuro');
        $('#btnTema').textContent = '☀️';
    } else if (estado.tema === 'claro') {
        document.body.classList.add('claro');
        $('#btnTema').textContent = '🌙';
    } else {
        $('#btnTema').textContent = '🌓';
    }
}

function renderizarSeletorListas() {
    const select = $('#selListaAtiva');
    select.replaceChildren();
    Object.keys(estado.listas).forEach(nomeLista => {
        select.add(new Option(nomeLista, nomeLista, false, nomeLista === estado.listaAtiva));
    });
    $('#tituloListaAtiva').textContent = `Minha lista — ${estado.listaAtiva}`;
}

function renderizarSelect() {
    const select = $('#selProduto');
    select.replaceChildren(new Option('Selecione um produto', ''));
    [...estado.produtos]
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach(p => {
            const precoTxt = p.precoUnitario > 0 ? ` · ${formatarMoeda(p.precoUnitario)}` : '';
            select.add(new Option(`${p.nome} (${p.unidade})${precoTxt}`, p.id));
        });
}

function renderizarProdutos() {
    const ul = $('#listaProdutos');
    ul.replaceChildren();
    [...estado.produtos]
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach(p => {
            const li = document.createElement('li');
            li.dataset.id = p.id;

            const info = document.createElement('div');
            info.className = 'prod-info';
            info.textContent = `${p.nome} · ${p.unidade} (${p.categoria || 'Outros'})`;

            const acoes = document.createElement('div');
            acoes.className = 'prod-acoes';

            const preco = document.createElement('span');
            preco.className = 'prod-preco';
            preco.textContent = p.precoUnitario > 0 ? formatarMoeda(p.precoUnitario) : '-';

            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-editar btn-editar-produto';
            btnEditar.type = 'button';
            btnEditar.textContent = '✏️';
            btnEditar.title = 'Editar produto';

            const btnRemover = document.createElement('button');
            btnRemover.className = 'btn-remover btn-remover-produto';
            btnRemover.type = 'button';
            btnRemover.textContent = '🗑';
            btnRemover.title = 'Excluir produto';

            acoes.append(preco, btnEditar, btnRemover);
            li.append(info, acoes);
            ul.appendChild(li);
        });
}

function contar() {
    const listaAtual = obterListaAtual();
    return listaAtual.reduce((c, item) => {
        const produto = buscarProduto(item.produtoId);
        const subtotal = produto ? item.quantidade * (produto.precoUnitario || 0) : 0;
        c.total++;
        c.valorTotal += subtotal;
        if (item.comprado) {
            c.comprados++;
        } else {
            c.pendentes++;
        }
        return c;
    }, { total: 0, comprados: 0, pendentes: 0, valorTotal: 0 });
}

function renderizarLista() {
    const ul = $('#lista');
    ul.replaceChildren();

    const listaAtual = obterListaAtual();

    const listaFiltrada = listaAtual.filter(item => {
        if (estado.filtro === 'pendentes') return !item.comprado;
        if (estado.filtro === 'comprados') return item.comprado;
        return true;
    });

    const listaOrdenada = [...listaFiltrada].sort((a, b) => {
        const prodA = buscarProduto(a.produtoId);
        const prodB = buscarProduto(b.produtoId);
        if (!prodA || !prodB) return 0;
        return prodA.nome.localeCompare(prodB.nome, 'pt-BR');
    });

    listaOrdenada.forEach(item => {
        const produto = buscarProduto(item.produtoId);
        if (!produto) return;

        const subtotal = item.quantidade * (produto.precoUnitario || 0);

        const li = document.createElement('li');
        li.className = 'item' + (item.comprado ? ' comprado' : '');
        li.dataset.id = item.id;

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = item.comprado;
        check.setAttribute('aria-label', 'Marcar ' + produto.nome + ' como comprado');

        const info = document.createElement('div');
        info.className = 'item-info';

        const nome = document.createElement('span');
        nome.className = 'nome';
        nome.textContent = produto.nome;

        const cat = document.createElement('span');
        cat.className = 'categoria-tag';
        cat.textContent = produto.categoria || 'Outros';

        info.append(nome, cat);

        const valores = document.createElement('div');
        valores.className = 'item-valores';

        const qtd = document.createElement('span');
        qtd.className = 'qtd';
        qtd.textContent = `${item.quantidade.toLocaleString('pt-BR')} ${produto.unidade}`;

        const sub = document.createElement('span');
        sub.className = 'subtotal';
        sub.textContent = subtotal > 0 ? formatarMoeda(subtotal) : 'Sem preço';

        valores.append(qtd, sub);

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

        li.append(check, info, valores, btnEditar, btnRemover);
        ul.appendChild(li);
    });

    document.querySelectorAll('.filtro').forEach(btn =>
        btn.classList.toggle('ativa', btn.dataset.filtro === estado.filtro)
    );

    const c = contar();
    $('#cTotal').textContent = c.total;
    $('#cComprados').textContent = c.comprados;
    $('#cPendentes').textContent = c.pendentes;
    $('#cTotalPreco').textContent = formatarMoeda(c.valorTotal);
    $('#selo').textContent = c.pendentes;
    $('#vazia').classList.toggle('oculto', listaFiltrada.length > 0);

    document.querySelectorAll('.btn-editar-produto').forEach(btn => {
        btn.onclick = () => iniciarEdicaoProduto(btn.closest('li').dataset.id);
    });

    document.querySelectorAll('.btn-remover-produto').forEach(btn => {
        btn.onclick = () => removerProduto(btn.closest('li').dataset.id);
    });
}

function renderizar() {
    aplicarTema();
    renderizarSeletorListas();
    renderizarSelect();
    renderizarProdutos();
    renderizarLista();
}

window.buscarProduto = buscarProduto;