CREATE DATABASE IF NOT EXISTS saep_vision;
USE saep_vision;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS tb_usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    nome_usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    imagem_usuario VARCHAR(255),
    tipo ENUM('usuario', 'fotografo') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Publicações (Criadas por fotógrafos)
CREATE TABLE IF NOT EXISTS tb_publicacoes (
    id_publicacao INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    local_tirada VARCHAR(255) NOT NULL,
    imagem_publicacao VARCHAR(255) NOT NULL,
    id_fotografo INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_fotografo) REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabela de Curtidas (Interação entre usuários e publicações)
CREATE TABLE IF NOT EXISTS tb_curtidas (
    id_curtida INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_publicacao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_publicacao) REFERENCES tb_publicacoes(id_publicacao) ON DELETE CASCADE,
    UNIQUE(id_usuario, id_publicacao) -- Impede que um usuário curta a mesma foto mais de uma vez
);

-- Inserindo os dados extraídos do arquivo tb_usuario.csv
INSERT IGNORE INTO tb_usuarios (id_usuario, nome, nome_usuario, email, senha, imagem_usuario, tipo, created_at, updated_at) VALUES
(1, 'fotografo1', 'fotografo_1', 'fotografo1@email.com', '123456', 'fotografo1.jpg', 'fotografo', '2025-03-25 12:40:08', '2025-03-25 12:40:08'),
(2, 'fotografo2', 'fotografo_2', 'fotografo2@gmail.com', '123456', 'fotografo2.jpg', 'fotografo', '2025-03-25 12:42:56', '2025-03-25 12:42:56'),
(3, 'fotografo3', 'fotografo_3', 'fotografo3@gmail.com', '123456', 'fotografo3.jpg', 'fotografo', '2025-03-25 12:45:44', '2025-03-25 12:45:44'),
(4, 'usuario1', 'usuario_1', 'usuario1@gmail.com', '123456', 'usuario1.jpg', 'usuario', '2025-03-25 12:48:32', '2025-03-25 12:48:32'),
(5, 'usuario2', 'usuario_2', 'usuario2@gmail.com', '123456', 'usuario2.jpg', 'usuario', '2025-03-25 12:51:20', '2025-03-25 12:51:20'),
(6, 'usuario3', 'usuario_3', 'usuario3@gmail.com', '123456', 'usuario3.jpg', 'usuario', '2025-03-25 12:54:08', '2025-03-25 12:54:08');