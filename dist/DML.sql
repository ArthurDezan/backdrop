-- Define a base de dados a ser utilizada
USE `drop`;

-- -----------------------------------------------------
-- Inserir Categorias
-- -----------------------------------------------------
INSERT INTO `categorias` (`id`, `nome`) VALUES
(1, 'Comida'),
(2, 'Mercado'),
(3, 'Farmacia'),
(4, 'Construção')
ON DUPLICATE KEY UPDATE `nome`=VALUES(`nome`);


-- -----------------------------------------------------
-- Inserir Estabelecimentos (com categoria_id, logo_url e banner_url)
-- -----------------------------------------------------
INSERT INTO `estabelecimentos` (`id`, `nome`, `localizacao`, `tempo_de_espera`, `categoria_id`, `logo_url`, `banner_url`) VALUES
(1, 'McDonald\'s Marília - Fragata', 'Av. Tiradentes, Fragata, Marília - SP', 15, 1, 'http://localhost:3000/images/mc_logo.jpg', 'http://localhost:3000/images/mcdonalds.webp'),
(2, 'Burger King Marília', 'Av. Tiradentes / Centro, Marília - SP', 20, 1, 'http://localhost:3000/images/bk_logo.webp', 'http://localhost:3000/images/bk.jpg'),
(3, 'Subway Marília', 'Marília - SP', 15, 1, 'http://localhost:3000/images/subway_logo.jpg', 'http://localhost:3000/images/SUBWAY.webp'),
(4, 'Donna Oliva Pizzaria', 'Av. Sampaio Vidal, Centro, Marília - SP', 30, 1, 'http://localhost:3000/images/donnaoliva_logo.png', 'http://localhost:3000/images/DONNA_OLIVA_PIZZARIA_b31f301604.png'),
(5, 'Chaplin Gastronomia', 'Av. República, Cascata, Marília - SP', 35, 1, 'http://localhost:3000/images/chaplin_logo.png', 'http://localhost:3000/images/chaplin-restaurante-e-pizzaria.jpg'),
(6, 'Supermercado Amigão (Marília)', 'Marília - SP (unidades)', 40, 2, 'http://localhost:3000/images/amigao_logo.png', 'http://localhost:3000/images/Amigao-925x400.png'),
(7, 'Supermercados Kawakami (Marília)', 'Marília - SP (unidades)', 40, 2, 'http://localhost:3000/images/supermercados_kawakami_logo.jpg', 'http://localhost:3000/images/kawakami.jpg'),
(8, 'Drogasil Marília', 'Marília - SP', 10, 3, 'http://localhost:3000/images/drogasil_logo.png', 'http://localhost:3000/images/drogasil.webp'),
(9, 'Madero Bauru (Bauru Shopping)', 'Bauru - SP', 25, 1, 'http://localhost:3000/images/madero-logo-0.png', 'http://localhost:3000/images/madero.jpg'),
(10, 'Pizzaria Bambina Bauru', 'Bauru - SP', 30, 1, 'http://localhost:3000/images/bambina_logo.png', 'http://localhost:3000/images/bambina.jpg'),
(11, 'Casarão da Picanha Bauru', 'Bauru - SP', 45, 1, 'http://localhost:3000/images/casarao_logo.avif', 'http://localhost:3000/images/casarao.jpg'),
(12, 'Atacadão Bauru', 'Bauru - SP', 50, 2, 'http://localhost:3000/images/atacadao_logo.jpg', 'http://localhost:3000/images/atacadao.jpg'),
(13, 'Narê Pompéia', 'Pompéia - SP', NULL, 1, NULL, NULL),
(14, 'Dom Galeto Grill - Pompéia', 'Pompéia - SP', NULL, 1, NULL, NULL),
(15, 'Churrascaria Chimarrão Grill - Garça', 'Garça - SP', NULL, 1, NULL, NULL),
(16, 'Restaurante Gustoo - Garça', 'Garça - SP', NULL, 1, NULL, NULL),
(17, 'McDonald\'s Tupã', 'Av. Tamoios, Tupã - SP', NULL, 1, 'http://localhost:3000/images/mc_logo.jpg', 'http://localhost:3000/images/mcdonalds.webp'),
(18, 'Supermercados Kawakami (Tupã)', 'Tupã - SP', NULL, 2, 'http://localhost:3000/images/supermercados_kawakami_logo.jpg', 'http://localhost:3000/images/kawakami.jpg'),
(19, 'McDonald\'s Araçatuba - Shopping', 'Shopping Praça Nova, Araçatuba - SP', NULL, 1, 'http://localhost:3000/images/mc_logo.jpg', 'http://localhost:3000/images/mcdonalds.webp'),
(20, 'Atacadão Araçatuba', 'Araçatuba - SP', NULL, 2, 'http://localhost:3000/images/atacadao_logo.jpg', 'http://localhost:3000/images/atacadao.jpg')
ON DUPLICATE KEY UPDATE 
  `nome`=VALUES(`nome`), 
  `localizacao`=VALUES(`localizacao`), 
  `tempo_de_espera`=VALUES(`tempo_de_espera`), 
  `categoria_id`=VALUES(`categoria_id`), 
  `logo_url`=VALUES(`logo_url`), 
  `banner_url`=VALUES(`banner_url`);

-- -----------------------------------------------------
-- Inserir Produtos (com categoria_id e estabelecimento_id)
-- -----------------------------------------------------
INSERT INTO `produtos` (`nome`, `preco`, `descricao`, `quantidade`, `categoria_id`, `estabelecimento_id`) VALUES
-- McDonald's (ID 1)
('Big Mac', 29.90, 'Dois hambúrgueres 100% carne bovina, queijo...', 200, 1, 1),
('Quarterão com Queijo', 30.70, 'Hambúrguer bovino mais grosso, queijo, cebola...', 150, 1, 1),
('McNuggets 10 unidades', 17.01, '10 unidades de McNuggets acompanhadas de molhos', 200, 1, 1),
('McFritas Média', 9.22, 'Batata frita média', 300, 1, 1),
('McFlurry Ovomaltine', 12.50, 'Sobremesa McFlurry sabor Ovomaltine', 80, 1, 1),

-- Burger King (ID 2)
('Whopper', 25.90, 'Whopper: carne bovina, alface, tomate, picles...', 150, 1, 2),
('Combo Whopper', 39.97, 'Whopper + batata média + bebida', 150, 1, 2),
('Onion Rings (porção)', 14.50, 'Porção de onion rings', 80, 1, 2),

-- Subway (ID 3)
('Sub 15cm - Frango Teriyaki', 23.90, 'Sanduíche Subway 15cm Frango Teriyaki', 120, 1, 3),
('Sub 15cm - BMT', 24.90, 'BMT 15cm - presunto, salame, pepperoni', 120, 1, 3),

-- Donna Oliva (ID 4)
('Pizza Marguerita - Donna Oliva', 55.00, 'Molho de tomate, muçarela, manjericão - pizza grande', 30, 1, 4),
('Pizza Calabresa - Donna Oliva', 60.00, 'Calabresa fatiada, cebola e muçarela - pizza grande', 30, 1, 4),
('Pizza Portuguesa - Donna Oliva', 65.00, 'Presunto, ovo, cebola, muçarela - pizza grande', 30, 1, 4),

-- Supermercado Amigão (ID 6)
('Arroz Tipo 1 5kg', 28.90, 'Pacote de arroz tipo 1 - 5kg', 200, 2, 6),
('Feijão Carioca 1kg', 9.50, 'Feijão carioca - 1kg', 300, 2, 6),
('Óleo de Soja 900ml', 8.90, 'Óleo de cozinha 900ml', 250, 2, 6),
('Refrigerante Coca-Cola Lata 350ml', 4.90, 'Refrigerante Coca-Cola lata 350ml', 500, 2, 6),

-- Drogasil (ID 8)
('Dipirona 500mg - 20 comprimidos', 6.50, 'Analgésico/antitérmico - caixa com 20', 150, 3, 8),
('Paracetamol 500mg - 10 comprimidos', 7.90, 'Analgésico/antitérmico - caixa com 10', 150, 3, 8),

-- Madero (ID 9)
('Cheeseburger Madero', 48.00, 'Cheeseburger Madero com pão artesanal...', 60, 1, 9),
('Batata Frita Madero (porção)', 29.00, 'Porção de batata frita', 100, 1, 9),

-- Pizzaria Bambina (ID 10)
('Pizza Portuguesa - Pizzaria Bambina', 58.00, 'Pizza Portuguesa (valor aproximado)', 25, 1, 10),

-- Casarão da Picanha (ID 11)
('Picanha Fatiada - Casarão da Picanha', 89.90, 'Prato picanha fatiada com acompanhamentos', 30, 1, 11)
ON DUPLICATE KEY UPDATE
  `nome`=VALUES(`nome`),
  `preco`=VALUES(`preco`),
  `descricao`=VALUES(`descricao`),
  `quantidade`=VALUES(`quantidade`),
  `categoria_id`=VALUES(`categoria_id`),
  `estabelecimento_id`=VALUES(`estabelecimento_id`);