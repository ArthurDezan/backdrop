// controller/pedido.controller.js
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mysql = require("../config/mysql"); // Nosso pool do banco

// 1. FUNÇÃO PARA CRIAR A SESSÃO DE CHECKOUT (Esta função continua igual)
exports.criarSessaoCheckout = async (req, res) => {
  const { cartItems, usuarioId, estabelecimentoId } = req.body;

  if (!cartItems || !usuarioId || !estabelecimentoId) {
    return res.status(400).json({ error: 'Faltam dados do pedido.' });
  }

  const line_items = cartItems.map(item => ({
    price_data: {
      currency: 'brl',
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(item.price * 100), 
    },
    quantity: item.quantity,
  }));

  line_items.push({
    price_data: {
      currency: 'brl',
      product_data: {
        name: 'Taxa de Entrega',
      },
      unit_amount: 499,
    },
    quantity: 1,
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: 'http://localhost:8100/sacola?pagamento=sucesso',
      cancel_url: 'http://localhost:8100/sacola?pagamento=cancelado',
      
      // Os metadados que já estávamos enviando. Vamos usá-los no webhook.
      metadata: {
        usuario_id: usuarioId,
        estabelecimento_id: estabelecimentoId,
        // Usamos nomes curtos (n, q, p) para economizar espaço
        items_json: JSON.stringify(cartItems.map(p => ({ n: p.name, q: p.quantity, p: p.price })))
      }
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Erro ao criar sessão Stripe:", error);
    res.status(500).json({ error: error.message });
  }
};


// 2. FUNÇÃO DO WEBHOOK (QUE SALVA NO BANCO)
exports.handleWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    console.log('WEBHOOK_SECRET não definido. Rode o Stripe CLI.');
    return res.status(400).send('Webhook secret não configurado.');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Ouve o evento de "Pagamento Concluído"
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Pega os metadados
    const metadata = session.metadata;
    const usuarioId = metadata.usuario_id;
    const estabelecimentoId = metadata.estabelecimento_id;
    const valorTotal = session.amount_total / 100; 
    const numeroPedido = session.id; // ID do Stripe
    
    // ✅ Decodifica os itens do carrinho que enviamos
    const items = JSON.parse(metadata.items_json);

    try {
      // ✅ Chama a nova função (que usa transação)
      await salvarPedidoCompletoNoBanco(
        numeroPedido, 
        valorTotal, 
        usuarioId, 
        estabelecimentoId,
        items // Passa os itens para a função
      );
      console.log(`[Sucesso] Pedido ${numeroPedido} e seus itens foram salvos no banco.`);

    } catch (dbError) {
      console.error(`[Falha DB] Erro ao salvar pedido completo ${numeroPedido}:`, dbError);
      return res.status(500).json({ error: 'Erro ao salvar no banco' });
    }
  }

  res.status(200).json({ received: true });
};


// 3. ✅ NOVA FUNÇÃO AUXILIAR COM TRANSAÇÃO
async function salvarPedidoCompletoNoBanco(numero_pedido, valor_total, usuario_id, estabelecimento_id, items) {
  
  let connection;
  try {
    // Pegar uma conexão do pool
    connection = await mysql.getConnection();
    
    // Iniciar a transação
    await connection.beginTransaction();

    // 1. Inserir o pedido na tabela 'pedidos'
    const pedidoQuery = `
      INSERT INTO pedidos 
      (numero_pedido, valor_total, usuario_id, estabelecimento_id)
      VALUES (?, ?, ?, ?)
    `;
    
    const [pedidoResult] = await connection.execute(pedidoQuery, [
      numero_pedido,
      valor_total,
      usuario_id,
      estabelecimento_id
    ]);

    // Pegar o ID do pedido que acabamos de inserir
    const novoPedidoId = pedidoResult.insertId;

    // 2. Preparar a query para os itens
    const itensQuery = `
      INSERT INTO pedido_itens
      (pedido_id, produto_nome, quantidade, preco_unitario)
      VALUES (?, ?, ?, ?)
    `;

    // 3. Criar um array de "promessas" de inserção (para todos os itens)
    const insercoesItens = items.map(item => {
      // Usamos os nomes curtos (n, q, p) que definimos no metadata
      return connection.execute(itensQuery, [
        novoPedidoId,
        item.n, // produto_nome
        item.q, // quantidade
        item.p  // preco_unitario
      ]);
    });

    // 4. Executar todas as inserções dos itens
    await Promise.all(insercoesItens);

    // 5. Se tudo deu certo (pedido e itens), comitar a transação
    await connection.commit();

  } catch (error) {
    // Se algo deu errado, reverter tudo
    if (connection) {
      await connection.rollback();
    }
    // Propaga o erro para o handleWebhook tratar
    throw error; 
  } finally {
    // Sempre liberar a conexão de volta para o pool
    if (connection) {
      connection.release();
    }
  }
}