// Página de detalhes do produto

async function carregarProduto() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('produto-detalhe');

    if (!id) {
        container.innerHTML = '<p style="padding: 2rem;">Produto não encontrado.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/produtos/${id}`);
        if (!response.ok) {
            throw new Error('Produto não encontrado');
        }
        const produto = await response.json();
        renderizarProduto(produto);
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="padding: 2rem;">Erro ao carregar informações do produto.</p>';
    }
}

function imagemUsaTagImg(imagem) {
    return imagem && (imagem.startsWith('http') || imagem.startsWith('/'));
}

function renderizarProduto(produto) {
    const container = document.getElementById('produto-detalhe');

    container.innerHTML = `
        <div class="produto-detalhe-card">
            <div class="produto-detalhe-imagem">
                ${imagemUsaTagImg(produto.imagem)
                    ? `<img src="${produto.imagem}" alt="${produto.nome}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : placeholderSemImagem(produto.categoria || '')
                }
            </div>
            <div class="produto-detalhe-info">
                <div class="produto-categoria">${produto.categoria}</div>
                <h2 class="produto-detalhe-nome">${produto.nome}</h2>
                <p class="produto-detalhe-descricao">
                    ${produto.descricao}
                </p>
                <div class="produto-detalhe-meta">
                    <span><strong>Estoque:</strong> ${produto.estoque ?? '-'}</span>
                </div>
                <div class="produto-detalhe-footer">
                    <div class="produto-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
                    <a href="index.html" class="btn-secundario">Voltar</a>
                </div>
            </div>
        </div>
    `;
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

document.addEventListener('DOMContentLoaded', carregarProduto);

