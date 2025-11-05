USE `drop`;

-- Inserção de Categorias
INSERT INTO categorias (id, nome) VALUES (1, 'Comida'), (2, 'Mercado'), (3, 'Farmacia'), (4, 'Construção')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

-- Inserção de Estabelecimentos
INSERT INTO estabelecimentos (id, nome, localizacao, tempo_de_espera) VALUES
(1, 'McDonald''s Marília - Fragata', 'Av. Tiradentes, Fragata, Marília - SP', 15),
(2, 'Burger King Marília', 'Av. Tiradentes / Centro, Marília - SP', 20),
(3, 'Subway Marília (unidade centro/shopping)', 'Marília - SP', 15),
(4, 'Donna Oliva Pizzaria', 'Av. Sampaio Vidal, Centro, Marília - SP', 30),
(5, 'Chaplin Gastronomia', 'Av. República, Cascata, Marília - SP', 35),
(6, 'Supermercado Amigão (Marília)', 'Marília - SP (unidades)', 40),
(7, 'Supermercados Kawakami (Marília)', 'Marília - SP (unidades)', 40),
(8, 'Drogasil Marília', 'Marília - SP', 10),
(9, 'Madero Bauru (Bauru Shopping)', 'Bauru - SP', 25),
(10, 'Pizzaria Bambina Bauru', 'Bauru - SP', 30),
(11, 'Casarão da Picanha Bauru', 'Bauru - SP', 45),
(12, 'Atacadão Bauru', 'Bauru - SP', 50)
ON DUPLICATE KEY UPDATE nome=VALUES(nome), localizacao=VALUES(localizacao), tempo_de_espera=VALUES(tempo_de_espera);

-- Inserção de Produtos (com estabelecimento_id)

-- ===== McDonald's (Ligados ao ID 1) =====
INSERT INTO produtos (nome, preco, descricao, quantidade, categoria_id, estabelecimento_id) VALUES
('Big Mac', 29.90, 'Dois hambúrgueres 100% carne bovina, queijo, molho especial...', 200, 1, 1),
('Quarterão com Queijo', 30.70, 'Hambúrguer bovino mais grosso, queijo, cebola, ketchup e mostarda', 150, 1, 1),
('McNuggets 10 unidades', 17.01, '10 unidades de McNuggets acompanhadas de molhos', 200, 1, 1),
('McFritas Média', 9.22, 'Batata frita média', 300, 1, 1),
('McFlurry Ovomaltine', 12.50, 'Sobremesa McFlurry sabor Ovomaltine', 80, 1, 1);

-- ===== Burger King (Ligados ao ID 2) =====
INSERT INTO produtos (nome, preco, descricao, quantidade, categoria_id, estabelecimento_id) VALUES
('Whopper', 25.90, 'Whopper: carne bovina, alface, tomate, picles, maionese...', 150, 1, 2),
('Combo Whopper', 39.97, 'Whopper + batata média + bebida', 150, 1, 2),
('Onion Rings (porção)', 14.50, 'Porção de onion rings', 80, 1, 2);

-- ===== Subway (Ligados ao ID 3) =====
INSERT INTO produtos (nome, preco, descricao, quantidade, categoria_id, estabelecimento_id) VALUES
('Sub 15cm - Frango Teriyaki', 23.90, 'Sanduíche Subway 15cm Frango Teriyaki', 120, 1, 3),
('Sub 15cm - BMT', 24.90, 'BMT 15cm - presunto, salame, pepperoni', 120, 1, 3);

-- ===== Madero (Ligados ao ID 9) =====
INSERT INTO produtos (nome, preco, descricao, quantidade, categoria_id, estabelecimento_id) VALUES
('Cheeseburger Madero', 48.00, 'Cheeseburger Madero com pão artesanal, carne, queijo...', 60, 1, 9),
('Batata Frita Madero (porção)', 29.00, 'Porção de batata frita', 100, 1, 9);

-- ===== Donna Oliva (Ligados ao ID 4) =====
INSERT INTO produtos (nome, preco, descricao, quantidade, categoria_id, estabelecimento_id) VALUES
('Pizza Marguerita', 55.00, 'Molho de tomate, muçarela, manjericão - pizza grande', 30, 1, 4),
('Pizza Calabresa', 60.00, 'Calabresa fatiada, cebola e muçarela - pizza grande', 30, 1, 4);

-- ===== Supermercados (Ligados ao ID 6) =====
INSERT INTO produtos (nome, preco, descricao, quantidade, categoria_id, estabelecimento_id) VALUES
('Arroz Tipo 1 5kg', 28.90, 'Pacote de arroz tipo 1 - 5kg', 200, 2, 6),
('Feijão Carioca 1kg', 9.50, 'Feijão carioca - 1kg', 300, 2, 6),
('Óleo de Soja 900ml', 8.90, 'Óleo de cozinha 900ml', 250, 2, 6);

-- ===== Farmácia (Ligados ao ID 8) =====
INSERT INTO produtos (nome, preco, descricao, quantidade, categoria_id, estabelecimento_id) VALUES
('Dipirona 500mg - 20 comprimidos', 6.50, 'Analgésico/antitérmico - caixa com 20', 150, 3, 8),
('Paracetamol 500mg - 10 comprimidos', 7.90, 'Analgésico/antitérmico - caixa com 10', 150, 3, 8);