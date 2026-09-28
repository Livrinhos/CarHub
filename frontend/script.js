// URL Base da API Backend
const API_URL = 'http://localhost:3000/api';
// Caminho para as fotos dos anexos
const CAMINHO_IMAGENS_USUARIOS = '../anexos_prova/imagens_usuarios/';

// Estado Global
let usuarioLogado = null; // Guardará o objeto do usuário logado


// Mapeamento de Elementos DOM
const btnAbrirLogin = document.getElementById('btn-abrir-login');
const modalLogin = document.getElementById('modal-login');
const fecharLogin = document.getElementById('fechar-login');
const btnCancelarLogin = document.getElementById('btn-cancelar-login');
const btnLogar = document.getElementById('btn-logar');

const headerUserName = document.getElementById('user-name');
const headerUserPhoto = document.getElementById('user-photo');
const btnPerfil = document.getElementById('btn-perfil');

const menuLateral = document.getElementById('menu-lateral');
const fecharPerfil = document.getElementById('fechar-perfil');
const btnLogout = document.getElementById('btn-logout-header');

const btnAbrirCadastroFoto = document.getElementById('btn-abrir-cadastro-foto');
const modalCadastroFoto = document.getElementById('modal-cadastro-foto');
const fecharCadastroFoto = document.getElementById('fechar-cadastro-foto');

const galleryContainer = document.getElementById('gallery-container');

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.onload = () => {
    modalLogin.classList.add('hidden');
    modalCadastroFoto.classList.add('hidden');
    menuLateral.classList.add('hidden');

    const usuarioSalvo = localStorage.getItem('usuarioLogado');

    if (usuarioSalvo) {
        usuarioLogado = JSON.parse(usuarioSalvo);
        atualizarInterfaceLogado();
    }

    carregarPublicacoes();
};

// ==========================================
// FUNÇÕES DE LOGIN
// ==========================================
function abrirModalLogin() {
    modalLogin.classList.remove('hidden');
    document.getElementById('erro-credenciais').classList.add('hidden');
}

btnAbrirLogin?.addEventListener('click', abrirModalLogin);

const fecharModalLogin = () => {
    modalLogin.classList.add('hidden');
    document.getElementById('login-nome').value = '';
    document.getElementById('login-senha').value = '';
    document.getElementById('erro-nome').classList.add('hidden');
    document.getElementById('erro-senha').classList.add('hidden');
};

fecharLogin.addEventListener('click', fecharModalLogin);
btnCancelarLogin.addEventListener('click', fecharModalLogin);

btnLogar.addEventListener('click', async () => {
    const nome = document.getElementById('login-nome').value;
    const senha = document.getElementById('login-senha').value;
    
    // Validação frontend simples
    let valido = true;
    if (nome.length < 3) {
        document.getElementById('erro-nome').classList.remove('hidden');
        valido = false;
    } else {
        document.getElementById('erro-nome').classList.add('hidden');
    }
    
    if (senha.trim() === '') {
        document.getElementById('erro-senha').classList.remove('hidden');
        valido = false;
    } else {
        document.getElementById('erro-senha').classList.add('hidden');
    }

    if (!valido) return;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_usuario: nome, senha: senha })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            usuarioLogado = data.usuario;
            localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
            document.getElementById('erro-credenciais').classList.add('hidden');
            atualizarInterfaceLogado();
            fecharModalLogin();
            carregarPublicacoes(); // Recarrega para ver os status de curtida atuais
        } else {
            document.getElementById('erro-credenciais').classList.remove('hidden');
        }
    } catch (error) {
        console.error("Erro no login", error);
    }
});

function atualizarInterfaceLogado() {
    // Atualiza cabeçalho
    headerUserName.innerText = `@${usuarioLogado.nome_usuario}`;
    headerUserPhoto.src = `${CAMINHO_IMAGENS_USUARIOS}${usuarioLogado.imagem_usuario}`;
    btnAbrirLogin.classList.add('hidden');
    document.getElementById('btn-logout-header').classList.remove('hidden');
    
    // O botão do perfil fica disponível no header. Para quem não estiver
    // logado, ele abre o modal de login.
    btnPerfil.disabled = false;

    // Ativa opções de fotógrafo no menu
    if (usuarioLogado.tipo === 'fotografo') {
        btnPerfil.disabled = false;
        btnAbrirCadastroFoto.classList.remove('hidden');
    } else {
        btnAbrirCadastroFoto.classList.add('hidden');
    }
}

// ==========================================
// MENU LATERAL (PERFIL)
// ==========================================
btnPerfil.addEventListener('click', async () => {
    if (!usuarioLogado) {
        abrirModalLogin();
        return;
    }

    // Usuário comum não possui o menu de fotógrafo.
    if (usuarioLogado.tipo !== 'fotografo') {
        return;
    }

    // Busca infos de curtidas e postagens na API
    try {
        const response = await fetch(`${API_URL}/fotografos/${usuarioLogado.id_usuario}/perfil`);
        const data = await response.json();
        
        document.getElementById('perfil-foto').src = `${CAMINHO_IMAGENS_USUARIOS}${usuarioLogado.imagem_usuario}`;
        document.getElementById('perfil-nome').innerText = usuarioLogado.nome;
        document.getElementById('perfil-likes').innerText = data.total_likes || 0;
        document.getElementById('perfil-publicacoes').innerText = data.total_publicacoes || 0;
        
        menuLateral.classList.remove('hidden');
    } catch (error) {
        console.error("Erro ao abrir perfil", error);
    }
});

fecharPerfil.addEventListener('click', () => {
    menuLateral.classList.add('hidden');
});

// Logout (Sair)
document.getElementById('btn-logout-header').addEventListener('click', () => {
    usuarioLogado = null;
    localStorage.removeItem('usuarioLogado');
    headerUserName.innerText = `@SAEPVision`;
    headerUserPhoto.src = `../anexos_prova/imagens_usuarios/default.png`;
    btnPerfil.disabled = false;
    btnAbrirLogin.classList.remove('hidden');
    document.getElementById('btn-logout-header').classList.add('hidden');
    btnAbrirCadastroFoto.classList.add('hidden');
    menuLateral.classList.add('hidden');
    carregarPublicacoes(); // volta visão deslogada
});

// ==========================================
// EXIBIÇÃO DE FOTOS
// ==========================================
async function carregarPublicacoes(termoPesquisa = "") {
    let url = `${API_URL}/publicacoes`;
    if (usuarioLogado) {
        url += `?usuarioId=${usuarioLogado.id_usuario}`;
    }
    
    try {
        if (termoPesquisa) {
            url = `${API_URL}/fotografos/pesquisa?termo=${encodeURIComponent(termoPesquisa)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        galleryContainer.innerHTML = ''; // limpa galeria
        
        let publicacoesList = data;
        
        // Se for pesquisa, o backend devolve { sucesso, fotografos, publicacoes }
        if (termoPesquisa && data.sucesso) {
            publicacoesList = data.publicacoes;
            if (data.fotografos.length === 0) {
                galleryContainer.innerHTML = '<p>Fotógrafo não encontrado.</p>';
                return;
            }
        }

        publicacoesList.forEach(pub => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // Lógica do icone de curtir (coração)
            const curtido = pub.curtido_por_mim > 0;
            const coracaoSrc = '../anexos_prova/icones/coracao.svg'; 

            // Feed-style card
            const nomeFotografo = pub.nome_fotografo || 'Fotógrafo';
            const local = pub.local_tirada || 'Brasil';
            const curtidas = Number(pub.total_curtidas || 0);
            const avatar = usuarioLogado?.imagem_usuario
                ? `${CAMINHO_IMAGENS_USUARIOS}${usuarioLogado.imagem_usuario}`
                : '../anexos_prova/imagens_usuarios/default.png';

            card.innerHTML = `
                <article class="feed-post">
                    <header class="feed-post-header">
                        <div class="feed-user">
                            <img src="${avatar}" alt="">
                            <div>
                                <strong>@${nomeFotografo}</strong>
                                <span><span class="post-dot">•</span> 2h atrás</span>
                            </div>
                        </div>
                        <button class="post-menu" type="button" aria-label="Mais opções">•••</button>
                    </header>

                    <div class="feed-location">⌖ ${local}</div>
                    <p class="feed-caption">${pub.titulo || 'Mais um carro incrível no CarHub!'} <span>🔥</span></p>

                    <div class="feed-image-wrap">
                        <img src="http://localhost:3000/uploads/${pub.imagem_publicacao}" class="foto-pub feed-image" alt="${pub.titulo || 'Publicação'}">
                    </div>

                    <div class="feed-actions">
                        <div class="feed-actions-left">
                            <button class="feed-action like-action ${curtido ? 'liked' : ''}" onclick="curtirFoto(${pub.id_publicacao}, ${curtido})" aria-label="Curtir">
                                <span class="feed-heart">♥</span>
                                <span class="feed-action-count">${curtidas}</span>
                            </button>
                            <button class="feed-action" type="button" aria-label="Comentar">
                                <span class="feed-comment-icon">◯</span>
                                <span class="feed-action-count">0</span>
                            </button>
                            <button class="feed-action" type="button" aria-label="Compartilhar">
                                <span class="feed-share-icon">⌁</span>
                                <span class="feed-action-count">0</span>
                            </button>
                        </div>
                        <button class="feed-bookmark" type="button" aria-label="Salvar">♡</button>
                        ${ (usuarioLogado && usuarioLogado.id_usuario === pub.id_fotografo) ? `
                            <button class="excluir-btn feed-delete" onclick="excluirFoto(${pub.id_publicacao})" aria-label="Excluir">
                                🗑
                            </button>
                        ` : ''}
                    </div>
                </article>
            `;
            galleryContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao carregar publicações", error);
    }
}

// ==========================================
// INTERAÇÕES (CURTIR E EXCLUIR)
// ==========================================
window.curtirFoto = async (id_publicacao, jaCurtido) => {
    if (!usuarioLogado) {
        modalLogin.classList.remove('hidden'); // Usuário não logado, abre login
        return;
    }

    try {
        if (jaCurtido) {
            // Remove curtida
            await fetch(`${API_URL}/publicacoes/${id_publicacao}/curtir`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_usuario: usuarioLogado.id_usuario })
            });
        } else {
            // Adiciona curtida
            await fetch(`${API_URL}/publicacoes/${id_publicacao}/curtir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_usuario: usuarioLogado.id_usuario })
            });
        }
        carregarPublicacoes(document.getElementById('input-pesquisa').value); // atualiza a interface
    } catch (error) {
        console.error("Erro ao curtir", error);
    }
}

window.excluirFoto = async (id_publicacao) => {
    if(confirm("Tem certeza que deseja excluir esta publicação?")) {
        try {
            await fetch(`${API_URL}/publicacoes/${id_publicacao}`, { method: 'DELETE' });
            carregarPublicacoes(document.getElementById('input-pesquisa').value);
        } catch (error) {
            console.error("Erro ao excluir", error);
        }
    }
}

// ==========================================
// PESQUISA
// ==========================================
document.getElementById('btn-pesquisar').addEventListener('click', () => {
    const termo = document.getElementById('input-pesquisa').value;
    carregarPublicacoes(termo);
});

// Filtro "Suas Publicações" do menu lateral
document.getElementById('btn-suas-publicacoes').addEventListener('click', () => {
    fecharPerfil.click();
    // Reutiliza a pesquisa buscando pelo nome de usuário logado
    document.getElementById('input-pesquisa').value = usuarioLogado.nome_usuario;
    carregarPublicacoes(usuarioLogado.nome_usuario);
});

// ==========================================
// CADASTRO DE FOTOGRAFIA
// ==========================================
btnAbrirCadastroFoto.addEventListener('click', () => {
    modalCadastroFoto.classList.remove('hidden');
});

fecharCadastroFoto.addEventListener('click', () => {
    modalCadastroFoto.classList.add('hidden');
    document.getElementById('foto-titulo').value = '';
    document.getElementById('foto-local').value = '';
    document.getElementById('foto-arquivo').value = '';
    document.getElementById('nome-arquivo-selecionado').innerText = 'Nenhum arquivo escolhido';
});

// Simula click no input file escondido
document.getElementById('btn-escolher-arquivo').addEventListener('click', () => {
    document.getElementById('foto-arquivo').click();
});

document.getElementById('foto-arquivo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('nome-arquivo-selecionado').innerText = file.name;
    } else {
        document.getElementById('nome-arquivo-selecionado').innerText = 'Nenhum arquivo escolhido';
    }
});

document.getElementById('btn-cadastrar-foto').addEventListener('click', async () => {
    const titulo = document.getElementById('foto-titulo').value;
    const local = document.getElementById('foto-local').value;
    const arquivoInput = document.getElementById('foto-arquivo');
    
    let valido = true;
    
    if(!titulo) { document.getElementById('erro-foto-titulo').classList.remove('hidden'); valido = false; }
    else { document.getElementById('erro-foto-titulo').classList.add('hidden'); }
    
    if(!local) { document.getElementById('erro-foto-local').classList.remove('hidden'); valido = false; }
    else { document.getElementById('erro-foto-local').classList.add('hidden'); }
    
    if(!arquivoInput.files[0]) { document.getElementById('erro-foto-arquivo').classList.remove('hidden'); valido = false; }
    else { document.getElementById('erro-foto-arquivo').classList.add('hidden'); }

    if(!valido) return;

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('local_tirada', local);
    formData.append('id_fotografo', usuarioLogado.id_usuario);
    formData.append('imagem', arquivoInput.files[0]);

    try {
        const response = await fetch(`${API_URL}/publicacoes`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if(data.sucesso) {
            fecharCadastroFoto.click();
            carregarPublicacoes(document.getElementById('input-pesquisa').value); // atualiza interface
        }
    } catch (error) {
        console.error("Erro no cadastro da foto", error);
    }
});

const campo = document.getElementById("foto-titulo")
const contador = document.getElementById("contador")

contador.innerHTML = 0/300

campo.addEventListener("input", function(){
    const atual = campo.value;
    const comprimentoAtual = atual.length;

    contador.innerHTML = comprimentoAtual + " /300";
    
});

/* Interações da barra lateral */
const navHome = document.getElementById('nav-home');
const navSearch = document.getElementById('nav-search');
const navProfile = document.getElementById('nav-profile');
const navCreate = document.getElementById('nav-create');
const navProfileImage = document.getElementById('nav-profile-image');

navHome?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

navSearch?.addEventListener('click', () => {
    const input = document.getElementById('input-pesquisa');
    input?.focus();
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

navProfile?.addEventListener('click', () => {
    if (usuarioLogado) {
        btnPerfil.click();
    } else {
        modalLogin.classList.remove('hidden');
    }
});

navCreate?.addEventListener('click', () => {
    if (usuarioLogado && usuarioLogado.tipo === 'fotografo') {
        btnAbrirCadastroFoto.click();
    } else if (!usuarioLogado) {
        modalLogin.classList.remove('hidden');
    }
});

function atualizarImagemNavPerfil() {
    if (usuarioLogado?.imagem_usuario) {
        navProfileImage.src = `${CAMINHO_IMAGENS_USUARIOS}${usuarioLogado.imagem_usuario}`;
    } else {
        navProfileImage.src = '../anexos_prova/imagens_usuarios/default.png';
    }
}

atualizarImagemNavPerfil();


/* ==========================================
   NAVEGAÇÃO E COMPORTAMENTO DAS MENSAGENS
   ========================================== */
const navMessages = document.getElementById('nav-messages');
const messagesPage = document.getElementById('messages-page');
const homeMain = document.querySelector('main');
const homeFooter = document.querySelector('footer');
const conversations = document.querySelectorAll('.conversation');
const chatName = document.getElementById('chat-name');
const chatStatus = document.getElementById('chat-status');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatComposer = document.getElementById('chat-composer');
const messagesSearchInput = document.getElementById('messages-search-input');

function ativarPagina(pagina) {
    const mostrarMensagens = pagina === 'mensagens';

    homeMain?.classList.toggle('hidden', mostrarMensagens);
    homeFooter?.classList.toggle('hidden', mostrarMensagens);
    messagesPage?.classList.toggle('hidden', !mostrarMensagens);

    navHome?.classList.toggle('active', !mostrarMensagens);
    navMessages?.classList.toggle('active', mostrarMensagens);
}

navMessages?.addEventListener('click', () => ativarPagina('mensagens'));
navHome?.addEventListener('click', () => ativarPagina('inicio'));

conversations.forEach(conversation => {
    conversation.addEventListener('click', () => {
        conversations.forEach(item => item.classList.remove('active'));
        conversation.classList.add('active');

        if (chatName) chatName.textContent = conversation.dataset.user || 'Usuário';
        if (chatStatus) chatStatus.textContent = conversation.dataset.status || 'Ativo agora';

        const dot = conversation.querySelector('.unread-dot');
        dot?.remove();

        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="chat-day">HOJE</div>
                <div class="chat-row received">
                    <img src="../anexos_prova/imagens_usuarios/default.png" alt="">
                    <div class="bubble">${conversation.querySelector('small')?.textContent || 'Olá! Tudo bem?'}</div>
                </div>
                <div class="chat-row sent">
                    <div class="bubble">Fala! Vi sua mensagem aqui no CarHub.</div>
                </div>
            `;
        }

        chatInput?.focus();
    });
});

messagesSearchInput?.addEventListener('input', () => {
    const term = messagesSearchInput.value.trim().toLowerCase();

    conversations.forEach(conversation => {
        const text = conversation.innerText.toLowerCase();
        conversation.classList.toggle('hidden', term && !text.includes(term));
    });
});

chatComposer?.addEventListener('submit', event => {
    event.preventDefault();

    const message = chatInput?.value.trim();
    if (!message || !chatMessages) return;

    const row = document.createElement('div');
    row.className = 'chat-row sent';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = message;

    row.appendChild(bubble);
    chatMessages.appendChild(row);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

document.getElementById('message-new-btn')?.addEventListener('click', () => {
    chatInput?.focus();
});

document.getElementById('chat-start-btn')?.addEventListener('click', () => {
    chatInput?.focus();
});


/* Interações do feed principal */
const composerFocus = document.getElementById('composer-focus');
const composerPublish = document.getElementById('composer-publish');
const composerPhoto = document.getElementById('composer-photo');
const composerAvatar = document.getElementById('composer-avatar');
const composerMention = document.getElementById('composer-mention');
const feedRefresh = document.getElementById('feed-refresh');

function atualizarComposer() {
    if (usuarioLogado?.imagem_usuario) {
        composerAvatar.src = `${CAMINHO_IMAGENS_USUARIOS}${usuarioLogado.imagem_usuario}`;
    } else {
        composerAvatar.src = '../anexos_prova/imagens_usuarios/default.png';
    }
    if (composerMention) {
        composerMention.textContent = usuarioLogado?.nome_usuario
            ? `@${usuarioLogado.nome_usuario}`
            : '@fotografo_1';
    }
}

composerFocus?.addEventListener('click', () => {
    if (!usuarioLogado) {
        abrirModalLogin();
        return;
    }
    document.getElementById('btn-abrir-cadastro-foto')?.click();
});

composerPublish?.addEventListener('click', () => {
    if (!usuarioLogado) {
        abrirModalLogin();
        return;
    }
    document.getElementById('btn-abrir-cadastro-foto')?.click();
});

composerPhoto?.addEventListener('click', () => {
    if (!usuarioLogado) {
        abrirModalLogin();
        return;
    }
    document.getElementById('btn-abrir-cadastro-foto')?.click();
});

feedRefresh?.addEventListener('click', () => carregarPublicacoes(document.getElementById('input-pesquisa')?.value || ''));

atualizarComposer();
