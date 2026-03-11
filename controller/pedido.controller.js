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