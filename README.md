# 🛒 Lista de Compras — SPA

Aplicação web do tipo **Single Page Application (SPA)** desenvolvida para gerenciamento de listas de compras de supermercado, com cadastro de produtos, controle de quantidades, persistência local e importação/exportação em JSON.

🔗 **Acesse a aplicação online:** https://listacomprassamuel.netlify.app


---

## ✨ Funcionalidades

- **Navegação SPA:** Alternância fluida entre as visões de *Lista* e *Produtos* sem recarregamento de página.
- **Cadastro Inteligente:** Validação nativa e normalização de texto (`NFD` + Regex) para impedir produtos duplicados por acentuação, caixa alta/baixa ou espaços extras.
- **Gestão da Lista:**
  - Soma automática de quantidades ao adicionar um produto já existente na lista.
  - Edição rápida de quantidades de itens já adicionados.
  - Ordenação alfabética automática (`pt-BR`).
  - Marcação de itens comprados com atualização dinâmica dos contadores (Total, Comprados e Pendentes) e limpeza em lote.
- **Persistência e Portabilidade:**
  - Carga inicial via `fetch` (`data/produtos.json`) e salvamento automático no `localStorage`.
  - Exportação e importação de backups (`produtos.json` e `lista.json`) com validação de estrutura e tratamento de erros.
- **Segurança:** Prevenção contra ataques **XSS** utilizando manipulação segura do DOM (`createElement` e `textContent`).

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico**
- **CSS3** (CSS Grid, Flexbox, Variáveis CSS e Media Queries para responsividade)
- **JavaScript (ES6+)** (`async/await`, Fetch API, Web Storage API, File/Blob API e Delegação de Eventos)
- **JSON** para estruturação e intercâmbio de dados

---

## 📁 Arquitetura do Projeto

```text
lista_compras/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── assets/
│   └── img/
├── css/
│   └── style.css
├── data/
│   └── produtos.json
├── js/
│   ├── app.js
│   ├── dados.js
│   └── interface.js
├── .gitignore
├── index.html
└── README.md
```