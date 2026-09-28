const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir arquivos estáticos (imagens)

// Cria a pasta uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Configuração do Multer para salvar as imagens com nomes únicos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ==========================================
// ROTAS DA API
// ==========================================

// 1. Login
app.post('/api/login', async (req, res) => {
    const { nome_usuario, senha } = req.body;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM tb_usuarios WHERE nome_usuario = ? AND senha = ?',
            [nome_usuario, senha]
        );
        if (rows.length > 0) {
            res.json({ sucesso: true, usuario: rows[0] });
        } else {
            res.status(401).json({ sucesso: false, mensagem: "Usuário não encontrado ou senha incorreta" });
        }
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// 2. Listar Publicações (com contagem de likes)
app.get('/api/publicacoes', async (req, res) => {
    const usuarioId = req.query.usuarioId; // id do usuario logado (opcional) para saber se ele já curtiu
    
    try {
        const query = `
            SELECT p.*, u.nome as nome_fotografo, 
            (SELECT COUNT(*) FROM tb_curtidas WHERE id_publicacao = p.id_publicacao) as total_curtidas
            ${usuarioId ? `, (SELECT COUNT(*) FROM tb_curtidas WHERE id_publicacao = p.id_publicacao AND id_usuario = ?) as curtido_por_mim` : ''}
            FROM tb_publicacoes p
            JOIN tb_usuarios u ON p.id_fotografo = u.id_usuario
            ORDER BY p.created_at DESC
        `;
        
        const params = usuarioId ? [usuarioId] : [];
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// 3. Cadastrar Publicação (Apenas fotógrafos)
app.post('/api/publicacoes', upload.single('imagem'), async (req, res) => {
    const { titulo, local_tirada, id_fotografo } = req.body;
    if (!req.file) {
        return res.status(400).json({ sucesso: false, mensagem: "Nenhum arquivo selecionado" });
    }

    try {
        const imagem_publicacao = req.file.filename;
        const [result] = await db.execute(
            'INSERT INTO tb_publicacoes (titulo, local_tirada, imagem_publicacao, id_fotografo) VALUES (?, ?, ?, ?)',
            [titulo, local_tirada, imagem_publicacao, id_fotografo]
        );
        res.json({ sucesso: true, id_publicacao: result.insertId });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// 4. Excluir Publicação
app.delete('/api/publicacoes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM tb_publicacoes WHERE id_publicacao = ?', [id]);
        res.json({ sucesso: true, mensagem: "Publicação excluída com sucesso" });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// 5. Curtir Publicação
app.post('/api/publicacoes/:id/curtir', async (req, res) => {
    const id_publicacao = req.params.id;
    const { id_usuario } = req.body;
    try {
        await db.execute(
            'INSERT INTO tb_curtidas (id_publicacao, id_usuario) VALUES (?, ?)',
            [id_publicacao, id_usuario]
        );
        res.json({ sucesso: true, mensagem: "Curtida adicionada" });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// 6. Remover Curtida
app.delete('/api/publicacoes/:id/curtir', async (req, res) => {
    const id_publicacao = req.params.id;
    const { id_usuario } = req.body; // Enviando pelo body da req delete
    try {
        await db.execute(
            'DELETE FROM tb_curtidas WHERE id_publicacao = ? AND id_usuario = ?',
            [id_publicacao, id_usuario]
        );
        res.json({ sucesso: true, mensagem: "Curtida removida" });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// 7. Pesquisar Fotógrafos
app.get('/api/fotografos/pesquisa', async (req, res) => {
    const { termo } = req.query;
    try {
        const [usuarios] = await db.execute(
            'SELECT * FROM tb_usuarios WHERE tipo = "fotografo" AND (nome LIKE ? OR nome_usuario LIKE ?)',
            [`%${termo}%`, `%${termo}%`]
        );
        
        if (usuarios.length === 0) {
            return res.json({ sucesso: true, fotografos: [] });
        }
        
        // Pega publicações desses fotógrafos
        const ids = usuarios.map(u => u.id_usuario);
        const placeholders = ids.map(() => '?').join(',');
        
        const [publicacoes] = await db.execute(
            `SELECT p.*, (SELECT COUNT(*) FROM tb_curtidas WHERE id_publicacao = p.id_publicacao) as total_curtidas 
             FROM tb_publicacoes p WHERE id_fotografo IN (${placeholders}) ORDER BY created_at DESC`,
            ids
        );

        res.json({ sucesso: true, fotografos: usuarios, publicacoes });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// 8. Informações de Perfil do Fotógrafo (Total likes e publicações)
app.get('/api/fotografos/:id/perfil', async (req, res) => {
    const id_fotografo = req.params.id;
    try {
        const [pubRows] = await db.execute(
            'SELECT COUNT(*) as total_publicacoes FROM tb_publicacoes WHERE id_fotografo = ?',
            [id_fotografo]
        );
        const [likeRows] = await db.execute(
            `SELECT COUNT(c.id_curtida) as total_likes 
             FROM tb_curtidas c 
             JOIN tb_publicacoes p ON c.id_publicacao = p.id_publicacao 
             WHERE p.id_fotografo = ?`,
            [id_fotografo]
        );

        res.json({
            total_publicacoes: pubRows[0].total_publicacoes,
            total_likes: likeRows[0].total_likes
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Iniciar Servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});