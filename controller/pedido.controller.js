// controller/pedido.controller.js
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mysql = require("../config/mysql");

// =========================================================================
// SERVER-SENT EVENTS (SSE) - TEMPO REAL
// =========================================================================
let lojasConectadas = {};

exports.streamPedidos = (req, res) => {
  const { estabelecimento_id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); 

  if (!lojasConectadas[estabelecimento_id]) {
    lojasConectadas[estabelecimento_id] = [];
  }
  
  lojasConectadas[estabelecimento_id].push(res);
  console.log(`[SSE] Loja ${estabelecimento_id} ligada para ouvir pedidos.`);

  req.on('close', () => {
    console.log(`[SSE] Loja ${estabelecimento_id} desligou-se.`);
    lojasConectadas[estabelecimento_id] = lojasConectadas[estabelecimento_id].filter(conexao => conexao !== res);
  });
};

const avisarNovoPedido = (estabelecimento_id) => {
  const conexoesDaLoja = lojasConectadas[estabelecimento_id];
  if (conexoesDaLoja && conexoesDaLoja.length > 0) {
    conexoesDaLoja.forEach(res => {
      res.write(`data: ${JSON.stringify({ evento: 'NOVO_PEDIDO' })}\n\n`);
    });
    console.log(`[SSE] Aviso de novo pedido enviado para a Loja ${estabelecimento_id}`);
  }
};

// =========================================================================
// STRIPE & CHECKOUT
// =========================================================================
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

exports.handleWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    console.log('WEBHOOK_SECRET não definido. Execute o Stripe CLI.');
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
      console.error('❌ Falha ao processar items_json:', metadata.items_json);
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
      console.log(`[Sucesso] Pedido ${numeroPedido} e os seus itens foram guardados na base de dados.`);
      avisarNovoPedido(estabelecimentoId);

    } catch (dbError) {
      console.error(`[Falha DB] Erro ao guardar pedido completo ${numeroPedido}:`, dbError);
      return res.status(500).json({ error: 'Erro ao guardar na base de dados' });
    }
  }

  res.status(200).json({ received: true });
};

exports.confirmarPedido = async (req, res) => {
  const { cartItems, usuarioId, estabelecimentoId, sessionId } = req.body;

  if (!cartItems || !usuarioId || !estabelecimentoId || !sessionId) {
    return res.status(400).json({ error: 'Faltam dados para confirmar o pedido.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Pagamento não confirmed pelo Stripe.' });
    }

    const conn = await mysql.getConnection();
    const [pedidoExistente] = await conn.execute(
      'SELECT id FROM pedidos WHERE numero_pedido = ?',
      [sessionId]
    );
    conn.release();

    if (pedidoExistente.length > 0) {
      console.log(`[Info] Pedido ${sessionId} já existe. Ignorando duplicado.`);
      return res.status(200).json({ success: true, message: 'Pedido já registado.' });
    }

    const valorTotal = session.amount_total / 100;

    await salvarPedidoCompletoNoBanco(
      sessionId,
      valorTotal,
      usuarioId,
      estabelecimentoId,
      cartItems.map(p => ({ n: p.name, q: p.quantity, p: p.price }))
    );

    console.log(`[Sucesso] Pedido ${sessionId} confirmado e guardado.`);
    avisarNovoPedido(estabelecimentoId);

    res.status(200).json({ success: true, message: 'Pedido guardado com sucesso!' });

  } catch (error) {
    console.error('Erro ao confirmar pedido:', error);
    res.status(500).json({ error: error.message });
  }
};

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

    const pagamentoQuery = `
      INSERT INTO pedido_pagamentos (pedido_id, status)
      VALUES (?, 'Pendente')
    `;
    await connection.execute(pagamentoQuery, [novoPedidoId]);

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
// ROTAS DE CONSULTA E GERENCIAMENTO
// -----------------------------------------------------
exports.getPedidosPorLoja = async (req, res) => {
  const { estabelecimento_id } = req.params;
  const { status } = req.query;

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

    query += ` GROUP BY 
      p.id, p.numero_pedido, p.valor_total, 
      u.nome, u.sobrenome, 
      pp.status, pp.criado_em 
      ORDER BY p.id DESC`;

    const [rows] = await mysql.execute(query, params);
    return res.status(200).json(rows);

  } catch (error) {
    console.error("Erro em getPedidosPorLoja:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

exports.atualizarStatusPedido = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const statusValidos = ['Pendente', 'Preparo', 'Entregando', 'Entregue', 'Cancelado'];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use: ${statusValidos.join(', ')}` });
  }

  try {
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

exports.getPedidosPorUsuario = async (req, res) => {
  try {
    const idUsuario = res.locals.idUsuario;

    let query = `
      SELECT
        p.id, p.numero_pedido, p.valor_total,
        pp.status, pp.criado_em,
        GROUP_CONCAT(
          CONCAT(pi.quantidade, 'x ', pi.produto_nome, ' (R$ ', pi.preco_unitario, ')')
          SEPARATOR ' | '
        ) AS itens
      FROM pedidos p
      LEFT JOIN pedido_pagamentos pp ON pp.pedido_id = p.id
      LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
      WHERE p.usuario_id = ?
      GROUP BY 
        p.id, p.numero_pedido, p.valor_total, 
        pp.status, pp.criado_em 
      ORDER BY p.id DESC
    `;

    const [rows] = await mysql.execute(query, [idUsuario]);
    return res.status(200).json(rows);

  } catch (error) {
    console.error("Erro em getPedidosPorUsuario:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};