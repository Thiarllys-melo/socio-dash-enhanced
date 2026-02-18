/**
 * LÓGICA PRINCIPAL DA APLICAÇÃO
 * Gerencia UI, views, eventos e interações
 */

class App {
    constructor() {
        this.currentView = 'dashboard';
        this.onlineTime = 0;
        this.onlineTimer = null;
        this.init();
    }

    /**
     * Inicializa a aplicação
     */
    init() {
        this.setupEventListeners();
        this.checkAuthenticationState();
    }

    /**
     * Verifica estado de autenticação e mostra seção apropriada
     */
    checkAuthenticationState() {
        const user = authManager.getCurrentUser();

        if (user) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    /**
     * Mostra tela de login
     */
    showLogin() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('dashboardSection').style.display = 'none';
    }

    /**
     * Mostra dashboard
     */
    showDashboard() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'flex';

        const user = authManager.getCurrentUser();
        document.getElementById('userDisplay').textContent = `${user.username} (${user.role})`;

        this.loadDashboardData();
        this.startOnlineTimer();
    }

    /**
     * Carrega dados do dashboard
     */
    loadDashboardData() {
        const sindicatos = authManager.getSindicatos();
        const usuarios = authManager.getUsuarios();
        const bloqueados = usuarios.filter(u => {
            const check = securityManager.checkLoginAttempt(u.username);
            return !check.allowed;
        });

        document.getElementById('statSindicatos').textContent = sindicatos.length;
        document.getElementById('statUsuarios').textContent = usuarios.length;
        document.getElementById('statBloqueados').textContent = bloqueados.length;
    }

    /**
     * Inicia temporizador de tempo online
     */
    startOnlineTimer() {
        if (this.onlineTimer) clearInterval(this.onlineTimer);

        this.onlineTime = 0;
        this.onlineTimer = setInterval(() => {
            this.onlineTime++;
            const hours = Math.floor(this.onlineTime / 3600);
            const minutes = Math.floor((this.onlineTime % 3600) / 60);
            document.getElementById('statTempo').textContent =
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Modais
        this.setupModalEvents();

        // Sindicatos
        document.getElementById('addSindicatoBtn').addEventListener('click', () => this.openSindicatoModal());
        document.getElementById('sindicatoForm').addEventListener('submit', (e) => this.handleCadastrarSindicato(e));

        // Usuários
        document.getElementById('addUsuarioBtn').addEventListener('click', () => this.showToast('Funcionalidade em desenvolvimento', 'info'));

        // Segurança
        document.getElementById('saveSecurity').addEventListener('click', () => this.handleSaveSecurityConfig());
        document.getElementById('newPassword').addEventListener('input', (e) => this.checkPasswordStrength(e));

        // Modal de senha
        document.getElementById('copyPasswordBtn').addEventListener('click', () => this.copyPasswordToClipboard());
        document.getElementById('enviarEmailBtn').addEventListener('click', () => this.showToast('Email enviado com sucesso!', 'success'));

        // Confirmar exclusão
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.handleConfirmDelete());
    }

    /**
     * Configura eventos dos modais
     */
    setupModalEvents() {
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal);
            });
        });
    }

    /**
     * Abre modal de cadastro de sindicato
     */
    openSindicatoModal() {
        document.getElementById('sindicatoForm').reset();
        this.openModal('sindicatoModal');
    }

    /**
     * Abre modal
     */
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    /**
     * Fecha modal
     */
    closeModal(modal) {
        if (modal) modal.classList.remove('active');
    }

    /**
     * Copia senha para clipboard
     */
    copyPasswordToClipboard() {
        const senha = document.getElementById('senhaProvisoria').textContent;
        navigator.clipboard.writeText(senha).then(() => {
            this.showToast('Senha copiada para a área de transferência!', 'success');
        });
    }

    /**
     * Verifica força da senha em tempo real
     */
    checkPasswordStrength(e) {
        const password = e.target.value;
        const strengthEl = document.getElementById('passwordStrength');

        if (!password) {
            strengthEl.textContent = '';
            return;
        }

        const result = securityManager.validatePasswordStrength(password);
        strengthEl.textContent = `Força: ${result.strength.toUpperCase()}`;
        strengthEl.className = `password-strength ${result.strength}`;
    }

    /**
     * Trata login
     */
    handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('loginError');

        const result = authManager.login(username, password);

        if (result.success) {
            if (result.forceChangePassword) {
                this.showToast('Senha provisória usada. Altere sua senha agora!', 'warning');
                this.openModal('changePasswordModal');
                document.getElementById('changePasswordForm').onsubmit = (e) => this.handleChangePassword(e);
            } else {
                this.showToast('Login realizado com sucesso!', 'success');
                this.showDashboard();
            }
            errorEl.textContent = '';
        } else {
            errorEl.textContent = result.error;
            if (result.locked) {
                document.getElementById('loginForm').style.pointerEvents = 'none';
                setTimeout(() => {
                    document.getElementById('loginForm').style.pointerEvents = 'auto';
                }, 3000);
            }
        }
    }

    /**
     * Trata logout
     */
    handleLogout() {
        authManager.logout();
        clearInterval(this.onlineTimer);
        document.getElementById('loginForm').reset();
        this.showLogin();
        this.showToast('Desconectado com sucesso', 'success');
    }

    /**
     * Trata navegação entre views
     */
    handleNavigation(e) {
        e.preventDefault();

        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        e.target.closest('.nav-item').classList.add('active');

        const view = e.target.closest('.nav-item').dataset.view;
        this.switchView(view);
    }

    /**
     * Muda de view
     */
    switchView(viewName) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(viewName + 'View').classList.add('active');
        this.currentView = viewName;

        if (viewName === 'sindicatos') {
            this.loadSindicatos();
        } else if (viewName === 'usuarios') {
            this.loadUsuarios();
        } else if (viewName === 'seguranca') {
            this.loadSecurityConfig();
        }
    }

    /**
     * Carrega lista de sindicatos
     */
    loadSindicatos() {
        const sindicatos = authManager.getSindicatos();
        const tbody = document.getElementById('sindicatosTableBody');
        const emptyState = document.getElementById('emptyState');

        if (sindicatos.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tbody.innerHTML = sindicatos.map(sind => `
            <tr>
                <td>${securityManager.sanitizeInput(sind.nome)}</td>
                <td>${sind.cnpj}</td>
                <td>${sind.email}</td>
                <td><span class="status-badge ${sind.status}">${sind.status.toUpperCase()}</span></td>
                <td>${sind.criado}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="app.showToast('Edição em desenvolvimento', 'info')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="app.handleDeleteSindicato('${sind.id}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Carrega lista de usuários
     */
    loadUsuarios() {
        const usuarios = authManager.getUsuarios();
        const tbody = document.getElementById('usuariosTableBody');
        const emptyState = document.getElementById('emptyStateUsers');

        if (usuarios.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tbody.innerHTML = usuarios.map(user => {
            const check = securityManager.checkLoginAttempt(user.username);
            const status = !check.allowed ? 'bloqueado' : user.status;

            return `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>
                    <td>${user.loginAttempts || 0}</td>
                    <td>${user.lastLogin || 'Nunca'}</td>
                    <td>
                        ${!check.allowed ? `<button class="btn btn-secondary btn-sm" onclick="app.handleUnblockUser('${user.username}')">Desbloquear</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Carrega configurações de segurança
     */
    loadSecurityConfig() {
        const config = securityManager.securityConfig;
        document.getElementById('maxAttempts').value = config.maxAttempts;
        document.getElementById('lockoutTime').value = config.lockoutTime;
        document.getElementById('minPasswordLength').value = config.minPasswordLength;
        document.getElementById('requireUppercase').checked = config.requireUppercase;
        document.getElementById('requireNumbers').checked = config.requireNumbers;
        document.getElementById('requireSpecial').checked = config.requireSpecial;

        securityManager.updateSecurityLogDisplay();
    }

    /**
     * Trata cadastro de sindicato
     */
    handleCadastrarSindicato(e) {
        e.preventDefault();

        const data = {
            nome: document.getElementById('sindicatoNome').value,
            cnpj: document.getElementById('sindicatoCNPJ').value,
            email: document.getElementById('sindicatoEmail').value,
            fone: document.getElementById('sindicatoFone').value
        };

        const result = authManager.cadastrarSindicato(data);

        if (result.success) {
            // Abre modal com senha provisória
            document.getElementById('modalSindicatoNome').textContent = result.sindicato.nome;
            document.getElementById('modalUsuarioLogin').textContent = result.usuario.username;
            document.getElementById('senhaProvisoria').textContent = result.provisionalPassword;

            this.closeModal(document.getElementById('sindicatoModal'));
            this.openModal('senhaProvisariaModal');

            this.showToast('Sindicato cadastrado com sucesso!', 'success');
            this.loadSindicatos();
        } else {
            this.showToast(result.error, 'error');
        }
    }

    /**
     * Trata exclusão de sindicato
     */
    handleDeleteSindicato(sindicatoId) {
        const sindicato = authManager.getSindicatos().find(s => s.id === sindicatoId);

        if (!sindicato) return;

        document.getElementById('confirmDeleteMessage').textContent =
            `Tem certeza que deseja excluir o sindicato "${sindicato.nome}"?\n\nEsta ação é irreversível, mas os dados serão arquivados em backup.`;

        document.getElementById('backupPath').textContent =
            `./backups/sindicato_${sindicato.id}_${new Date().getTime()}.json`;

        // Armazena ID para confirmação
        window.sindicatoToDelete = sindicatoId;

        this.openModal('confirmDeleteModal');
    }

    /**
     * Confirma exclusão de sindicato
     */
    handleConfirmDelete() {
        const sindicatoId = window.sindicatoToDelete;
        const result = authManager.deletarSindicato(sindicatoId);

        if (result.success) {
            this.showToast(result.message, 'success');
            this.closeModal(document.getElementById('confirmDeleteModal'));
            this.loadSindicatos();
            this.loadDashboardData();
        } else {
            this.showToast(result.error, 'error');
        }
    }

    /**
     * Desbloqueia usuário
     */
    handleUnblockUser(username) {
        const result = authManager.desbloquearUsuario(username);
        this.showToast(result.message, 'success');
        this.loadUsuarios();
        this.loadDashboardData();
    }

    /**
     * Trata alteração de senha
     */
    handleChangePassword(e) {
        e.preventDefault();

        const user = authManager.getCurrentUser();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const result = authManager.changePassword(user.id, currentPassword, newPassword, confirmPassword);

        if (result.success) {
            this.showToast('Senha alterada com sucesso!', 'success');
            this.closeModal(document.getElementById('changePasswordModal'));
            document.getElementById('changePasswordForm').reset();
        } else {
            this.showToast(result.error, 'error');
        }
    }

    /**
     * Trata salvamento de configurações de segurança
     */
    handleSaveSecurityConfig() {
        const config = {
            maxAttempts: parseInt(document.getElementById('maxAttempts').value),
            lockoutTime: parseInt(document.getElementById('lockoutTime').value),
            minPasswordLength: parseInt(document.getElementById('minPasswordLength').value),
            requireUppercase: document.getElementById('requireUppercase').checked,
            requireNumbers: document.getElementById('requireNumbers').checked,
            requireSpecial: document.getElementById('requireSpecial').checked,
            sessionTimeout: securityManager.securityConfig.sessionTimeout,
            passwordExpiry: securityManager.securityConfig.passwordExpiry
        };

        securityManager.saveSecurityConfig(config);
        this.showToast('Configurações de segurança atualizadas!', 'success');
    }

    /**
     * Exibe notificação toast
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close">×</button>
        `;

        container.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

        setTimeout(() => toast.remove(), 4000);
    }
}

// Inicializa aplicação quando DOM está pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}