// controller/pedido.controller.js
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mysql = require("../config/mysql"); // Nosso pool do banco

// 1. FUNÇÃO PARA CRIAR A SESSÃO DE CHECKOUT
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
      success_url: 'http://localhost:8100/sacola?pagamento=sucesso&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:8100/sacola?pagamento=cancelado',
      metadata: {
        usuario_id: usuarioId,
        estabelecimento_id: estabelecimentoId,
        items_json: JSON.stringify(cartItems.map(p => ({ n: p.name, q: p.quantity, p: p.price })))
      }
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Erro ao criar sessão Stripe:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.criarPagamentoIntencao = async (req, res) => {
    try {
        const { amount } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'brl',
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Erro ao criar intenção de pagamento no Stripe:", error);
        res.status(500).json({ error: error.message });
    }
};


// 2. FUNÇÃO DO WEBHOOK (mantida, mas só funciona com Stripe CLI ativo)
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const metadata = session.metadata;
    const usuarioId = metadata.usuario_id;
    const estabelecimentoId = metadata.estabelecimento_id;
    const valorTotal = session.amount_total / 100; 
    const numeroPedido = session.id;
    
    let items = [];
    try {
      items = JSON.parse(metadata.items_json);
    } catch(e) {
      console.error('❌ Falha ao parsear items_json:', metadata.items_json);
      return res.status(500).json({ error: 'items_json corrompido' });
    }

    try {
      await salvarPedidoCompletoNoBanco(
        numeroPedido, 
        valorTotal, 
        usuarioId, 
        estabelecimentoId,
        items
      );
      console.log(`[Sucesso] Pedido ${numeroPedido} e seus itens foram salvos no banco.`);

    } catch (dbError) {
      console.error(`[Falha DB] Erro ao salvar pedido completo ${numeroPedido}:`, dbError);
      return res.status(500).json({ error: 'Erro ao salvar no banco' });
    }
  }

  res.status(200).json({ received: true });
};


// 3. CONFIRMAR PEDIDO via frontend (sem precisar do Stripe CLI)
exports.confirmarPedido = async (req, res) => {
  const { cartItems, usuarioId, estabelecimentoId, sessionId } = req.body;

  if (!cartItems || !usuarioId || !estabelecimentoId || !sessionId) {
    return res.status(400).json({ error: 'Faltam dados para confirmar o pedido.' });
  }

  try {
    // Verifica com o Stripe se a sessão realmente foi paga
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Pagamento não confirmado pelo Stripe.' });
    }

    // ✅ CORRIGIDO: usa getConnection em vez de mysql.execute diretamente
    const conn = await mysql.getConnection();
    const [pedidoExistente] = await conn.execute(
      'SELECT id FROM pedidos WHERE numero_pedido = ?',
      [sessionId]
    );
    conn.release();

    if (pedidoExistente.length > 0) {
      console.log(`[Info] Pedido ${sessionId} já existe no banco. Ignorando duplicata.`);
      return res.status(200).json({ success: true, message: 'Pedido já registrado.' });
    }

    const valorTotal = session.amount_total / 100;

    await salvarPedidoCompletoNoBanco(
      sessionId,
      valorTotal,
      usuarioId,
      estabelecimentoId,
      cartItems.map(p => ({ n: p.name, q: p.quantity, p: p.price }))
    );

    console.log(`[Sucesso] Pedido ${sessionId} confirmado e salvo no banco.`);
    res.status(200).json({ success: true, message: 'Pedido salvo com sucesso!' });

  } catch (error) {
    console.error('Erro ao confirmar pedido:', error);
    res.status(500).json({ error: error.message });
  }
};


// FUNÇÃO AUXILIAR COM TRANSAÇÃO
async function salvarPedidoCompletoNoBanco(numero_pedido, valor_total, usuario_id, estabelecimento_id, items) {
  
  let connection;
  try {
    connection = await mysql.getConnection();
    await connection.beginTransaction();

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

    const novoPedidoId = pedidoResult.insertId;

    const itensQuery = `
      INSERT INTO pedido_itens
      (pedido_id, produto_nome, quantidade, preco_unitario)
      VALUES (?, ?, ?, ?)
    `;

    const insercoesItens = items.map(item => {
      return connection.execute(itensQuery, [
        novoPedidoId,
        item.n,
        item.q,
        item.p
      ]);
    });

    await Promise.all(insercoesItens);
    await connection.commit();

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error; 
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// -----------------------------------------------------
// GET /pedidos/loja/:estabelecimento_id
// Lista pedidos do estabelecimento logado
// Pode filtrar por status: ?status=Pendente
// -----------------------------------------------------
exports.getPedidosPorLoja = async (req, res) => {
  const { estabelecimento_id } = req.params;
  const { status } = req.query;

  // Garante que a loja só veja seus próprios pedidos
  if (parseInt(estabelecimento_id) !== req.loja.id) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  try {
    let query = `
      SELECT
        p.id, p.numero_pedido, p.valor_total,
        u.nome AS cliente_nome, u.sobrenome AS cliente_sobrenome,
        pp.status, pp.criado_em,
        GROUP_CONCAT(
          CONCAT(pi.quantidade, 'x ', pi.produto_nome, ' (R$ ', pi.preco_unitario, ')')
          SEPARATOR ' | '
        ) AS itens
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN pedido_pagamentos pp ON pp.pedido_id = p.id
      LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
      WHERE p.estabelecimento_id = ?
    `;

    const params = [estabelecimento_id];

    if (status) {
      query += ' AND pp.status = ?';
      params.push(status);
    }

    query += ' GROUP BY p.id ORDER BY p.id DESC';

    const [rows] = await mysql.execute(query, params);
    return res.status(200).json(rows);

  } catch (error) {
    console.error("Erro em getPedidosPorLoja:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

// -----------------------------------------------------
// PATCH /pedidos/:id/status
// Atualiza o status de um pedido
// Body: { status: 'Pendente' | 'Preparo' | 'Entregando' | 'Entregue' | 'Cancelado' }
// -----------------------------------------------------
exports.atualizarStatusPedido = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const statusValidos = ['Pendente', 'Preparo', 'Entregando', 'Entregue', 'Cancelado'];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use: ${statusValidos.join(', ')}` });
  }

  try {
    // Verifica se o pedido pertence à loja logada
    const [check] = await mysql.execute(
      'SELECT p.id FROM pedidos p WHERE p.id = ? AND p.estabelecimento_id = ?',
      [id, req.loja.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: "Pedido não encontrado ou sem permissão" });
    }

    await mysql.execute(
      'UPDATE pedido_pagamentos SET status = ? WHERE pedido_id = ?',
      [status, id]
    );

    return res.status(200).json({ Mensagem: "Status atualizado com sucesso", status });

  } catch (error) {
    console.error("Erro em atualizarStatusPedido:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};