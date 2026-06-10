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
AS nova
ON DUPLICATE KEY UPDATE `nome` = nova.`nome`;


-- -----------------------------------------------------
-- Inserir Estabelecimentos
-- Colunas novas (cnpj, email, senha, numero_endereco, bairro, cidade)
-- ficam NULL para os estabelecimentos inseridos manualmente.
-- ativo = 1 por padrão (DEFAULT já cobre, mas declarado explicitamente).
-- -----------------------------------------------------
INSERT INTO `estabelecimentos`
  (`id`, `nome`, `localizacao`, `tempo_de_espera`, `categoria_id`,
   `logo_url`, `banner_url`, `latitude`, `longitude`, `mapa_url`, `ativo`)
VALUES
(1,  'McDonald\'s Marília - Fragata',   'Av. Tiradentes, Fragata, Marília - SP',        15, 1, 'http://localhost:3000/images/mc_logo.jpg',                      'http://localhost:3000/images/mcdonalds.webp',                          -22.226330, -49.948250, 'http://localhost:3000/images/mapa_mcdonalds.png',      1),
(2,  'Burger King Marília',             'Av. Tiradentes / Centro, Marília - SP',         20, 1, 'http://localhost:3000/images/bk_logo.webp',                     'http://localhost:3000/images/bk.jpg',                                  -22.225570, -49.950120, 'http://localhost:3000/images/mapa_burgerking.png',     1),
(3,  'Subway Marília',                  'Marília - SP',                                  15, 1, 'http://localhost:3000/images/subway_logo.jpg',                  'http://localhost:3000/images/SUBWAY.webp',                             -22.221220, -49.948710, 'http://localhost:3000/images/mapa_subway.png',         1),
(4,  'Donna Oliva Pizzaria',            'Av. Sampaio Vidal, Centro, Marília - SP',      30, 1, 'http://localhost:3000/images/donnaoliva_logo.png',               'http://localhost:3000/images/DONNA_OLIVA_PIZZARIA_b31f301604.png',     -22.234150, -49.954820, 'http://localhost:3000/images/mapa_donnaoliva.png',     1),
(5,  'Chaplin Gastronomia',             'Av. República, Cascata, Marília - SP',          35, 1, 'http://localhost:3000/images/chaplin_logo.png',                  'http://localhost:3000/images/chaplin-restaurante-e-pizzaria.jpg',      -22.210420, -49.958740, 'http://localhost:3000/images/mapa_chaplin.png',        1),
(6,  'Supermercado Amigão (Marília)',   'Marília - SP (unidades)',                       40, 2, 'http://localhost:3000/images/amigao_logo.png',                   'http://localhost:3000/images/Amigao-925x400.png',                      -22.220000, -49.940000, 'http://localhost:3000/images/mapa_amigao.png',         1),
(7,  'Supermercados Kawakami (Marília)','Marília - SP (unidades)',                       40, 2, 'http://localhost:3000/images/supermercados_kawakami_logo.jpg',  'http://localhost:3000/images/kawakami.jpg',                            -22.230000, -49.960000, 'http://localhost:3000/images/mapa_kawakami.png',        1),
(8,  'Drogasil Marília',                'Marília - SP',                                  10, 3, 'http://localhost:3000/images/drogasil_logo.png',                 'http://localhost:3000/images/drogasil.webp',                            -22.221000, -49.950000, 'http://localhost:3000/images/mapa_drogasil.png',        1),
(9,  'Madero Bauru (Bauru Shopping)',   'Bauru - SP',                                    25, 1, 'http://localhost:3000/images/madero-logo-0.png',                 'http://localhost:3000/images/madero.jpg',                              -22.326500, -49.070000, 'http://localhost:3000/images/mapa_madero.png',          1),
(10, 'Pizzaria Bambina Bauru',          'Bauru - SP',                                    30, 1, 'http://localhost:3000/images/bambina_logo.png',                  'http://localhost:3000/images/bambina.jpg',                              -22.330000, -49.060000, 'http://localhost:3000/images/mapa_bombinapizzaria.png', 1),
(11, 'Casarão da Picanha Bauru',        'Bauru - SP',                                    45, 1, 'http://localhost:3000/images/casarao_logo.avif',                 'http://localhost:3000/images/casarao.jpg',                              -22.340000, -49.080000, 'http://localhost:3000/images/mapa_casarao.png',         1),
(12, 'Atacadão Bauru',                  'Bauru - SP',                                    50, 2, 'http://localhost:3000/images/atacadao_logo.jpg',                  'http://localhost:3000/images/atacadao.jpg',                             -22.310000, -49.050000, 'http://localhost:3000/images/mapa_atacadao.png',        1)
AS novo
ON DUPLICATE KEY UPDATE
  `nome`            = novo.`nome`,
  `localizacao`     = novo.`localizacao`,
  `tempo_de_espera` = novo.`tempo_de_espera`,
  `categoria_id`    = novo.`categoria_id`,
  `logo_url`        = novo.`logo_url`,
  `banner_url`      = novo.`banner_url`,
  `latitude`        = novo.`latitude`,
  `longitude`       = novo.`longitude`,
  `mapa_url`        = novo.`mapa_url`;


-- -----------------------------------------------------
-- Inserir Produtos
-- IDs estáticos definidos para garantir a funcionalidade do ON DUPLICATE KEY.
-- -----------------------------------------------------
INSERT INTO `produtos` (`id`, `nome`, `preco`, `descricao`, `quantidade`, `categoria_id`, `estabelecimento_id`) VALUES
-- McDonald's (ID 1)
(1, 'Big Mac',                           29.90, 'Dois hambúrgueres 100% carne bovina, queijo...',          200, 1, 1),
(2, 'Quarterão com Queijo',              30.70, 'Hambúrguer bovino mais grosso, queijo, cebola...',        150, 1, 1),
(3, 'McNuggets 10 unidades',             17.01, '10 unidades de McNuggets acompanhadas de molhos',         200, 1, 1),
(4, 'McFritas Média',                     9.22, 'Batata frita média',                                      300, 1, 1),
(5, 'McFlurry Ovomaltine',               12.50, 'Sobremesa McFlurry sabor Ovomaltine',                       80, 1, 1),

-- Burger King (ID 2)
(6, 'Whopper',                           25.90, 'Whopper: carne bovina, alface, tomate, picles...',        150, 1, 2),
(7, 'Combo Whopper',                     39.97, 'Whopper + batata média + bebida',                         150, 1, 2),
(8, 'Onion Rings (porção)',              14.50, 'Porção de onion rings',                                     80, 1, 2),

-- Subway (ID 3)
(9, 'Sub 15cm - Frango Teriyaki',        23.90, 'Sanduíche Subway 15cm Frango Teriyaki',                   120, 1, 3),
(10, 'Sub 15cm - BMT',                    24.90, 'BMT 15cm - presunto, salame, pepperoni',                  120, 1, 3),

-- Donna Oliva (ID 4)
(11, 'Pizza Marguerita - Donna Oliva',    55.00, 'Molho de tomate, muçarela, manjericão - pizza grande',    30,  1, 4),
(12, 'Pizza Calabresa - Donna Oliva',     60.00, 'Calabresa fatiada, cebola e muçarela - pizza grande',     30,  1, 4),
(13, 'Pizza Portuguesa - Donna Oliva',    65.00, 'Presunto, ovo, cebola, muçarela - pizza grande',          30,  1, 4),

-- Supermercado Amigão (ID 6)
(14, 'Arroz Tipo 1 5kg',                  28.90, 'Pacote de arroz tipo 1 - 5kg',                             200, 2, 6),
(15, 'Feijão Carioca 1kg',                 9.50, 'Feijão carioca - 1kg',                                    300, 2, 6),
(16, 'Óleo de Soja 900ml',                 8.90, 'Óleo de cozinha 900ml',                                   250, 2, 6),
(17, 'Refrigerante Coca-Cola Lata 350ml',  4.90, 'Refrigerante Coca-Cola lata 350ml',                       500, 2, 6),

-- Drogasil (ID 8)
(18, 'Dipirona 500mg - 20 comprimidos',    6.50, 'Analgésico/antitérmico - caixa com 20',                  150, 3, 8),
(19, 'Paracetamol 500mg - 10 comprimidos', 7.90, 'Analgésico/antitérmico - caixa com 10',                  150, 3, 8),

-- Madero (ID 9)
(20, 'Cheeseburger Madero',               48.00, 'Cheeseburger Madero com pão artesanal...',                 60, 1, 9),
(21, 'Batata Frita Madero (porção)',       29.00, 'Porção de batata frita',                                 100, 1, 9),

-- Pizzaria Bambina (ID 10)
(22, 'Pizza Portuguesa - Pizzaria Bambina',58.00, 'Pizza Portuguesa (valor aproximado)',                     25, 1, 10),

-- Casarão da Picanha (ID 11)
(23, 'Picanha Fatiada - Casarão da Picanha',89.90,'Prato picanha fatiada com acompanhamentos',               30, 1, 11)
AS novo
ON DUPLICATE KEY UPDATE
  `nome`               = novo.`nome`,
  `preco`              = novo.`preco`,
  `descricao`          = novo.`descricao`,
  `quantidade`         = novo.`quantidade`,
  `categoria_id`       = novo.`categoria_id`,
  `estabelecimento_id` = novo.`estabelecimento_id`;