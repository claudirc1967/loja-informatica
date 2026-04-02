// Estado global
let produtos = [];
let carrinho = { itens: [], total: 0 };
let categoriaFiltro = '';

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarProdutos();
    await carregarCarrinho();
    renderizarProdutos();
});

// ===== FUNÇÕES DE PRODUTOS =====
async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        produtos = await response.json();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function imagemUsaTagImg(imagem) {
    return imagem && (imagem.startsWith('http') || imagem.startsWith('/'));
}

function renderizarProdutos() {
    const container = document.getElementById('produtos-container');
    const produtosFiltrados = categoriaFiltro
        ? produtos.filter(p => p.categoria === categoriaFiltro)
        : produtos;

    if (produtosFiltrados.length === 0) {
        container.innerHTML = '<p class="msg-empty">Nenhum produto encontrado.</p>';
        return;
    }

    container.innerHTML = produtosFiltrados.map(produto => `
        <div class="produto-card">
            <div class="produto-imagem">
                ${imagemUsaTagImg(produto.imagem)
                    ? `<img src="${produto.imagem}" alt="${produto.nome}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : placeholderSemImagem(produto.categoria)
                }
            </div>
            <div class="produto-info">
                <div class="produto-categoria">${produto.categoria}</div>
                <a class="produto-nome-link" href="produto.html?id=${produto.id}">
                    <div class="produto-nome">${produto.nome}</div>
                </a>
                <div class="produto-descricao">${produto.descricao}</div>
                <div class="produto-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
                <a class="btn-detalhes" href="produto.html?id=${produto.id}">
                    Ver detalhes
                </a>
                <button class="btn-adicionar" onclick="adicionarAoCarrinho('${produto.id}')">
                    Adicionar ao Carrinho
                </button>
            </div>
        </div>
    `).join('');
}

function placeholderSemImagem(categoria) {
    const codigos = {
        'Notebooks': 'NB',
        'Periféricos': 'I/O',
        'Monitores': 'DSP',
        'Armazenamento': 'MEM',
        'Componentes': 'HW',
        'Áudio': 'AUD'
    };
    const codigo = codigos[categoria] || 'SKU';
    return `<span class="tech-placeholder">${codigo}</span>`;
}

function filtrarProdutos() {
    categoriaFiltro = document.getElementById('filtro-categoria').value;
    renderizarProdutos();
}

// ===== FUNÇÕES DE CARRINHO =====
async function carregarCarrinho() {
    try {
        const response = await fetch('/api/carrinho');
        carrinho = await response.json();
        atualizarContadorCarrinho();
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
    }
}

async function adicionarAoCarrinho(produtoId) {
    try {
        const response = await fetch('/api/carrinho', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produtoId, quantidade: 1 })
        });
        carrinho = await response.json();
        atualizarContadorCarrinho();
        
        // Mostrar feedback visual
        mostrarNotificacao('Produto adicionado ao carrinho!');
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        alert('Erro ao adicionar produto ao carrinho');
    }
}

async function atualizarQuantidade(produtoId, quantidade) {
    try {
        const response = await fetch(`/api/carrinho/${produtoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantidade })
        });
        carrinho = await response.json();
        renderizarCarrinho();
        atualizarContadorCarrinho();
    } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
    }
}

async function removerDoCarrinho(produtoId) {
    try {
        const response = await fetch(`/api/carrinho/${produtoId}`, {
            method: 'DELETE'
        });
        carrinho = await response.json();
        renderizarCarrinho();
        atualizarContadorCarrinho();
    } catch (error) {
        console.error('Erro ao remover do carrinho:', error);
    }
}

function renderizarCarrinho() {
    const container = document.getElementById('carrinho-itens');
    const totalElement = document.getElementById('carrinho-total');
    const btnFinalizar = document.querySelector('.btn-finalizar');

    if (carrinho.itens.length === 0) {
        container.innerHTML = '<p class="msg-empty">Carrinho vazio</p>';
        totalElement.textContent = '0,00';
        btnFinalizar.disabled = true;
        return;
    }

    btnFinalizar.disabled = false;
    totalElement.textContent = carrinho.total.toFixed(2).replace('.', ',');

    container.innerHTML = carrinho.itens.map(item => `
        <div class="carrinho-item">
            <div class="carrinho-item-imagem">
                ${imagemUsaTagImg(item.imagem)
                    ? `<img src="${item.imagem}" alt="${item.nome}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : '<span class="tech-placeholder">—</span>'
                }
            </div>
            <div class="carrinho-item-info">
                <div class="carrinho-item-nome">${item.nome}</div>
                <div class="carrinho-item-preco">R$ ${item.preco.toFixed(2).replace('.', ',')}</div>
                <div class="carrinho-item-controles">
                    <button class="btn-quantidade" onclick="atualizarQuantidade('${item.produtoId}', ${item.quantidade - 1})">-</button>
                    <input type="number" class="quantidade-input" value="${item.quantidade}" min="1" 
                           onchange="atualizarQuantidade('${item.produtoId}', parseInt(this.value))">
                    <button class="btn-quantidade" onclick="atualizarQuantidade('${item.produtoId}', ${item.quantidade + 1})">+</button>
                    <button class="btn-remover" onclick="removerDoCarrinho('${item.produtoId}')">Remover</button>
                </div>
            </div>
        </div>
    `).join('');
}

function atualizarContadorCarrinho() {
    const count = carrinho.itens.reduce((sum, item) => sum + item.quantidade, 0);
    document.getElementById('carrinho-count').textContent = count;
}

function toggleCarrinho() {
    const modal = document.getElementById('carrinho-modal');
    if (modal.classList.contains('show')) {
        modal.classList.remove('show');
    } else {
        renderizarCarrinho();
        modal.classList.add('show');
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const carrinhoModal = document.getElementById('carrinho-modal');
    const checkoutModal = document.getElementById('checkout-modal');
    if (event.target === carrinhoModal) {
        carrinhoModal.classList.remove('show');
    }
    if (event.target === checkoutModal) {
        checkoutModal.classList.remove('show');
    }
}

// ===== FUNÇÕES DE CHECKOUT =====
function abrirCheckout() {
    if (carrinho.itens.length === 0) return;

    const checkoutItens = document.getElementById('checkout-itens');
    const checkoutTotal = document.getElementById('checkout-total');

    checkoutItens.innerHTML = carrinho.itens.map(item => `
        <div class="checkout-item">
            <span>${item.nome} x${item.quantidade}</span>
            <span>R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
        </div>
    `).join('');

    checkoutTotal.textContent = carrinho.total.toFixed(2).replace('.', ',');

    alterarMetodoPagamento('pix');
    
    document.getElementById('checkout-modal').classList.add('show');
    document.getElementById('carrinho-modal').classList.remove('show');
}

function fecharCheckout() {
    document.getElementById('checkout-modal').classList.remove('show');
}

function alterarMetodoPagamento(metodo) {
    const formPagamento = document.getElementById('form-pagamento');
    document.querySelector(`input[value="${metodo}"]`).checked = true;

    if (metodo === 'pix') {
        formPagamento.innerHTML = `
            <div class="form-pagamento">
                <p class="checkout-hint">
                    <strong>PIX</strong>
                    Escaneie o QR Code ou copie o payload abaixo para concluir.
                </p>
                <div class="form-group">
                    <label>CPF/CNPJ</label>
                    <input type="text" id="pix-cpf" placeholder="000.000.000-00" maxlength="18">
                </div>
                <div class="checkout-qr-block">
                    <strong>Payload EMV</strong>
                    <code class="pix-payload">00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913LOJA INFO6009SAO PAULO62070503***6304</code>
                </div>
            </div>
        `;
    } else {
        formPagamento.innerHTML = `
            <div class="form-pagamento">
                <p class="checkout-hint">
                    <strong>Cartão</strong>
                    Preencha os dados do cartão para finalizar.
                </p>
                <div class="form-group">
                    <label>Número do Cartão</label>
                    <input type="text" id="cartao-numero" placeholder="0000 0000 0000 0000" maxlength="19">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Validade</label>
                        <input type="text" id="cartao-validade" placeholder="MM/AA" maxlength="5">
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input type="text" id="cartao-cvv" placeholder="000" maxlength="3">
                    </div>
                </div>
                <div class="form-group">
                    <label>Nome no Cartão</label>
                    <input type="text" id="cartao-nome" placeholder="NOME COMPLETO">
                </div>
                <div class="form-group">
                    <label>CPF</label>
                    <input type="text" id="cartao-cpf" placeholder="000.000.000-00" maxlength="18">
                </div>
            </div>
        `;
    }
}

async function confirmarPedido() {
    try {
        const metodo = document.querySelector('input[name="metodo"]:checked').value;
        let dadosPagamento = {};

        if (metodo === 'pix') {
            const cpf = document.getElementById('pix-cpf').value;
            if (!cpf) {
                alert('Por favor, informe o CPF/CNPJ');
                return;
            }
            dadosPagamento = { cpf };
        } else {
            const numero = document.getElementById('cartao-numero').value;
            const validade = document.getElementById('cartao-validade').value;
            const cvv = document.getElementById('cartao-cvv').value;
            const nome = document.getElementById('cartao-nome').value;
            const cpf = document.getElementById('cartao-cpf').value;

            if (!numero || !validade || !cvv || !nome || !cpf) {
                alert('Por favor, preencha todos os campos do cartão');
                return;
            }
            dadosPagamento = { numero, validade, cvv, nome, cpf };
        }

        const response = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metodoPagamento: metodo, dadosPagamento })
        });

        if (!response.ok) {
            throw new Error('Erro ao processar pedido');
        }

        const pedido = await response.json();
        await carregarCarrinho();

        // Mostrar mensagem de sucesso
        const mensagem = metodo === 'pix'
            ? `Pedido #${pedido.id.substring(0, 8)} confirmado!<br>O pagamento via PIX será processado em breve.`
            : `Pedido #${pedido.id.substring(0, 8)} confirmado!<br>Pagamento no cartão processado com sucesso.`;

        document.getElementById('sucesso-mensagem').innerHTML = mensagem;
        document.getElementById('sucesso-modal').classList.add('show');
        document.getElementById('checkout-modal').classList.remove('show');

    } catch (error) {
        console.error('Erro ao confirmar pedido:', error);
        alert('Erro ao processar pedido. Tente novamente.');
    }
}

function fecharSucesso() {
    document.getElementById('sucesso-modal').classList.remove('show');
}

// ===== FUNÇÕES AUXILIARES =====
function mostrarNotificacao(mensagem) {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #e2e8f0;
        padding: 0.65rem 1rem;
        border-radius: 8px;
        font: 500 0.9375rem "IBM Plex Sans", system-ui, sans-serif;
        box-shadow: 0 4px 24px rgba(15, 23, 42, 0.12);
        z-index: 2000;
        animation: slideIn 0.3s;
    `;
    notificacao.textContent = mensagem;
    document.body.appendChild(notificacao);

    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

