const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/images', express.static('images'));

// Diretórios de dados
const DATA_DIR = path.join(__dirname, 'data');
const PRODUTOS_FILE = path.join(DATA_DIR, 'produtos.json');
const CARRINHO_FILE = path.join(DATA_DIR, 'carrinho.json');
const PEDIDOS_FILE = path.join(DATA_DIR, 'pedidos.json');

// Garantir que o diretório de dados existe
async function initDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Erro ao criar diretório de dados:', error);
  }
}

// Funções auxiliares para leitura/escrita de arquivos JSON
async function readJSON(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeJSON(filePath, defaultValue);
      return defaultValue;
    }
    throw error;
  }
}

async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ===== ROTAS DE PRODUTOS =====
app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await readJSON(PRODUTOS_FILE);
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.get('/api/produtos/:id', async (req, res) => {
  try {
    const produtos = await readJSON(PRODUTOS_FILE);
    const produto = produtos.find(p => p.id === req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// ===== ROTAS DE CARRINHO =====
app.get('/api/carrinho', async (req, res) => {
  try {
    const carrinho = await readJSON(CARRINHO_FILE, { itens: [], total: 0 });
    res.json(carrinho);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar carrinho' });
  }
});

app.post('/api/carrinho', async (req, res) => {
  try {
    const { produtoId, quantidade } = req.body;
    const produtos = await readJSON(PRODUTOS_FILE);
    const produto = produtos.find(p => p.id === produtoId);
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const carrinho = await readJSON(CARRINHO_FILE, { itens: [], total: 0 });
    const itemExistente = carrinho.itens.find(item => item.produtoId === produtoId);

    if (itemExistente) {
      itemExistente.quantidade += quantidade || 1;
    } else {
      carrinho.itens.push({
        produtoId,
        nome: produto.nome,
        preco: produto.preco,
        imagem: produto.imagem,
        quantidade: quantidade || 1
      });
    }

    carrinho.total = carrinho.itens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    await writeJSON(CARRINHO_FILE, carrinho);
    res.json(carrinho);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
  }
});

app.put('/api/carrinho/:produtoId', async (req, res) => {
  try {
    const { quantidade } = req.body;
    const carrinho = await readJSON(CARRINHO_FILE, { itens: [], total: 0 });
    const item = carrinho.itens.find(item => item.produtoId === req.params.produtoId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado no carrinho' });
    }

    if (quantidade <= 0) {
      carrinho.itens = carrinho.itens.filter(item => item.produtoId !== req.params.produtoId);
    } else {
      item.quantidade = quantidade;
    }

    carrinho.total = carrinho.itens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    await writeJSON(CARRINHO_FILE, carrinho);
    res.json(carrinho);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar carrinho' });
  }
});

app.delete('/api/carrinho/:produtoId', async (req, res) => {
  try {
    const carrinho = await readJSON(CARRINHO_FILE, { itens: [], total: 0 });
    carrinho.itens = carrinho.itens.filter(item => item.produtoId !== req.params.produtoId);
    carrinho.total = carrinho.itens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    await writeJSON(CARRINHO_FILE, carrinho);
    res.json(carrinho);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item do carrinho' });
  }
});

app.delete('/api/carrinho', async (req, res) => {
  try {
    await writeJSON(CARRINHO_FILE, { itens: [], total: 0 });
    res.json({ itens: [], total: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar carrinho' });
  }
});

// ===== ROTAS DE PEDIDOS =====
app.post('/api/pedidos', async (req, res) => {
  try {
    const { metodoPagamento, dadosPagamento } = req.body;
    const carrinho = await readJSON(CARRINHO_FILE, { itens: [], total: 0 });

    if (carrinho.itens.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }

    const pedido = {
      id: uuidv4(),
      itens: [...carrinho.itens],
      total: carrinho.total,
      metodoPagamento,
      dadosPagamento,
      data: new Date().toISOString(),
      status: 'pendente'
    };

    const pedidos = await readJSON(PEDIDOS_FILE, []);
    pedidos.push(pedido);
    await writeJSON(PEDIDOS_FILE, pedidos);

    // Limpar carrinho após pedido
    await writeJSON(CARRINHO_FILE, { itens: [], total: 0 });

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = await readJSON(PEDIDOS_FILE, []);
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// Inicializar servidor
async function startServer() {
  await initDataDir();
  
  // Inicializar produtos se não existirem
  const produtos = await readJSON(PRODUTOS_FILE);
  if (produtos.length === 0) {
    await initializeProdutos();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

// Inicializar produtos de exemplo
async function initializeProdutos() {
  const produtos = [
    {
      id: '1',
      nome: 'Notebook Dell Inspiron 15',
      descricao: 'Notebook com processador Intel i5, 8GB RAM, 256GB SSD',
      preco: 3499.90,
      categoria: 'Notebooks',
      imagem: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
      estoque: 10
    },
    {
      id: '2',
      nome: 'Mouse Logitech MX Master 3',
      descricao: 'Mouse sem fio ergonômico para produtividade',
      preco: 699.90,
      categoria: 'Periféricos',
      imagem: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80',
      estoque: 25
    },
    {
      id: '3',
      nome: 'Teclado Mecânico RGB',
      descricao: 'Teclado mecânico com switches Cherry MX e iluminação RGB',
      preco: 899.90,
      categoria: 'Periféricos',
      imagem: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      estoque: 15
    },
    {
      id: '4',
      nome: 'Monitor LG UltraWide 29"',
      descricao: 'Monitor ultrawide Full HD com tecnologia IPS',
      preco: 1899.90,
      categoria: 'Monitores',
      imagem: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
      estoque: 8
    },
    {
      id: '5',
      nome: 'Webcam Logitech C920',
      descricao: 'Webcam Full HD 1080p com microfone estéreo',
      preco: 599.90,
      categoria: 'Periféricos',
      imagem: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=800&q=80',
      estoque: 20
    },
    {
      id: '6',
      nome: 'SSD Samsung 1TB',
      descricao: 'SSD NVMe M.2 de 1TB com alta velocidade de leitura/escrita',
      preco: 799.90,
      categoria: 'Armazenamento',
      imagem: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
      estoque: 30
    },
    {
      id: '7',
      nome: 'Placa de Vídeo RTX 3060',
      descricao: 'Placa de vídeo NVIDIA RTX 3060 12GB GDDR6',
      preco: 2899.90,
      categoria: 'Componentes',
      imagem: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80',
      estoque: 5
    },
    {
      id: '8',
      nome: 'Headset HyperX Cloud II',
      descricao: 'Headset gamer com som surround 7.1 e microfone removível',
      preco: 649.90,
      categoria: 'Áudio',
      imagem: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
      estoque: 18
    }
  ];

  await writeJSON(PRODUTOS_FILE, produtos);
  console.log('✅ Produtos inicializados');
}

startServer().catch(console.error);

