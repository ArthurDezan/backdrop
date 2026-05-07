-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema drop
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema drop
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `drop` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `drop` ;

-- -----------------------------------------------------
-- Table `drop`.`categorias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `drop`.`categorias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `drop`.`estabelecimentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `drop`.`estabelecimentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(150) NOT NULL,
  `cnpj` VARCHAR(18) NULL DEFAULT NULL,
  `email` VARCHAR(150) NULL DEFAULT NULL,
  `senha` VARCHAR(255) NULL DEFAULT NULL,
  `localizacao` VARCHAR(200) NOT NULL,
  `numero_endereco` VARCHAR(10) NULL DEFAULT NULL,
  `bairro` VARCHAR(100) NULL DEFAULT NULL,
  `cidade` VARCHAR(100) NULL DEFAULT NULL,
  `tempo_de_espera` INT NULL DEFAULT NULL,
  `logo_url` LONGTEXT NULL DEFAULT NULL,
  `banner_url` LONGTEXT NULL DEFAULT NULL,
  `categoria_id` INT NULL DEFAULT NULL,
  `latitude` DECIMAL(10,8) NULL DEFAULT NULL,
  `longitude` DECIMAL(11,8) NULL DEFAULT NULL,
  `mapa_url` VARCHAR(255) NULL DEFAULT NULL,
  `ativo` TINYINT(1) NOT NULL DEFAULT '1',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `cnpj_UNIQUE` (`cnpj` ASC) VISIBLE,
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE,
  INDEX `fk_estabelecimentos_categorias_idx` (`categoria_id` ASC) VISIBLE,
  CONSTRAINT `fk_estabelecimentos_categorias`
    FOREIGN KEY (`categoria_id`)
    REFERENCES `drop`.`categorias` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 16
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `drop`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `drop`.`usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `sobrenome` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `endereco` VARCHAR(200) NULL DEFAULT NULL,
  `numero_endereco` VARCHAR(10) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 9
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `drop`.`pedidos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `drop`.`pedidos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `numero_pedido` VARCHAR(500) NOT NULL,
  `valor_total` DECIMAL(10,2) NOT NULL,
  `usuario_id` INT NOT NULL,
  `estabelecimento_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `numero_pedido_UNIQUE` (`numero_pedido` ASC) VISIBLE,
  INDEX `fk_pedidos_usuarios_idx` (`usuario_id` ASC) VISIBLE,
  INDEX `fk_pedidos_estabelecimentos_idx` (`estabelecimento_id` ASC) VISIBLE,
  CONSTRAINT `fk_pedidos_estabelecimentos`
    FOREIGN KEY (`estabelecimento_id`)
    REFERENCES `drop`.`estabelecimentos` (`id`),
  CONSTRAINT `fk_pedidos_usuarios`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `drop`.`usuarios` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `drop`.`pedido_itens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `drop`.`pedido_itens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pedido_id` INT NOT NULL,
  `produto_nome` VARCHAR(255) NOT NULL,
  `quantidade` INT NOT NULL,
  `preco_unitario` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `pedido_id` (`pedido_id` ASC) VISIBLE,
  CONSTRAINT `pedido_itens_ibfk_1`
    FOREIGN KEY (`pedido_id`)
    REFERENCES `drop`.`pedidos` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `drop`.`pedido_pagamentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `drop`.`pedido_pagamentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pedido_id` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pendente',
  `criado_em` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_pagamentos_pedidos_idx` (`pedido_id` ASC) VISIBLE,
  CONSTRAINT `fk_pagamentos_pedidos`
    FOREIGN KEY (`pedido_id`)
    REFERENCES `drop`.`pedidos` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `drop`.`produtos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `drop`.`produtos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(150) NOT NULL,
  `preco` DECIMAL(10,2) NOT NULL,
  `descricao` TEXT NULL DEFAULT NULL,
  `quantidade` INT NULL DEFAULT '0',
  `categoria_id` INT NULL DEFAULT NULL,
  `estabelecimento_id` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_produtos_categorias_idx` (`categoria_id` ASC) VISIBLE,
  INDEX `fk_produtos_estabelecimentos_idx` (`estabelecimento_id` ASC) VISIBLE,
  CONSTRAINT `fk_produtos_categorias`
    FOREIGN KEY (`categoria_id`)
    REFERENCES `drop`.`categorias` (`id`),
  CONSTRAINT `fk_produtos_estabelecimentos`
    FOREIGN KEY (`estabelecimento_id`)
    REFERENCES `drop`.`estabelecimentos` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 91
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `drop`.`recuperacao_senha`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `drop`.`recuperacao_senha` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `codigo` VARCHAR(6) NOT NULL,
  `expiracao` DATETIME NOT NULL,
  `usado` TINYINT(1) NOT NULL DEFAULT '0',
  `criado_em` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
