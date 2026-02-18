/**
 * SISTEMA DE AUTENTICAÇÃO
 * Gerencia login, logout e sessões de usuários
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.sindicatos = this.loadSindicatos();
        this.initializeDefaultUsers();
    }

    /**
     * Inicializa usuários padrão do sistema
     */
    initializeDefaultUsers() {
        if (this.users.length === 0) {
            this.users = [
                {
                    id: 'admin-001',
                    username: 'admin',
                    passwordHash: this.hashPasswordSync('admin123'),
                    email: 'admin@sociodash.com',
                    role: 'administrador',
                    status: 'ativo',
                    criado: new Date().toLocaleString('pt-BR'),
                    loginAttempts: 0,
                    lastLogin: null,
                    provisionalPassword: null,
                    provisionalPasswordExpiry: null
                }
            ];
            this.saveUsers();
        }
    }

    /**
     * Hash de senha simplificado (usar bcrypt em produção)
     */
    hashPasswordSync(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    }

    /**
     * Realiza login
     */
    login(username, password) {
        const sanitizedUsername = securityManager.sanitizeInput(username);

        // Verifica bloqueio
        const lockCheck = securityManager.checkLoginAttempt(sanitizedUsername);
        if (!lockCheck.allowed) {
            return { success: false, error: lockCheck.message, locked: true };
        }

        // Procura usuário
        const user = this.users.find(u => u.username === sanitizedUsername);

        if (!user) {
            securityManager.recordFailedAttempt(sanitizedUsername);
            return { success: false, error: 'Usuário ou senha incorretos' };
        }

        // Verifica se usuário está ativo
        if (user.status !== 'ativo') {
            securityManager.recordFailedAttempt(sanitizedUsername);
            return { success: false, error: 'Usuário inativo' };
        }

        // Verifica senha provisória (se houver)
        if (user.provisionalPassword) {
            if (password === user.provisionalPassword) {
                if (new Date() > new Date(user.provisionalPasswordExpiry)) {
                    securityManager.recordFailedAttempt(sanitizedUsername);
                    return { success: false, error: 'Senha provisória expirada', requireChangePassword: true };
                }
                // Força troca de senha
                return { success: true, user, forceChangePassword: true };
            }
        }

        // Verifica senha regular
        const passwordHash = this.hashPasswordSync(password);
        if (user.passwordHash !== passwordHash) {
            const failResult = securityManager.recordFailedAttempt(sanitizedUsername);
            return {
                success: false,
                error: `${failResult.locked ? 'Conta bloqueada após múltiplas tentativas' : `Usuário ou senha incorretos. Tentativas restantes: ${failResult.attemptsRemaining}`}`
            };
        }

        // Login bem-sucedido
        securityManager.clearLoginAttempts(sanitizedUsername);
        user.lastLogin = new Date().toLocaleString('pt-BR');
        user.loginAttempts = 0;

        const sessionToken = securityManager.generateSessionToken(sanitizedUsername);
        sessionStorage.setItem('sessionToken', sessionToken);
        sessionStorage.setItem('user', JSON.stringify(user));

        this.currentUser = user;
        this.saveUsers();

        securityManager.addSecurityLog(`Login bem-sucedido: ${sanitizedUsername}`, 'success');

        return { success: true, user, sessionToken };
    }

    /**
     * Realiza logout
     */
    logout() {
        if (this.currentUser) {
            securityManager.addSecurityLog(`Logout: ${this.currentUser.username}`, 'success');
        }

        sessionStorage.removeItem('sessionToken');
        sessionStorage.removeItem('user');
        this.currentUser = null;
    }

    /**
     * Obtém usuário atual da sessão
     */
    getCurrentUser() {
        const token = sessionStorage.getItem('sessionToken');

        if (!token) return null;

        const validation = securityManager.validateSessionToken(token);
        if (!validation.valid) {
            sessionStorage.removeItem('sessionToken');
            sessionStorage.removeItem('user');
            return null;
        }

        let user = this.currentUser;
        if (!user) {
            const userStr = sessionStorage.getItem('user');
            user = userStr ? JSON.parse(userStr) : null;
            this.currentUser = user;
        }

        return user;
    }

    /**
     * Cadastra novo sindicato e usuário associado
     */
    cadastrarSindicato(sindicatoData) {
        // Validações
        if (!securityManager.validateEmail(sindicatoData.email)) {
            return { success: false, error: 'Email inválido' };
        }

        if (!securityManager.validateCNPJ(sindicatoData.cnpj)) {
            return { success: false, error: 'CNPJ inválido' };
        }

        // Verifica se sindicato já existe
        if (this.sindicatos.some(s => s.cnpj.replace(/[^\d]/g, '') === sindicatoData.cnpj.replace(/[^\d]/g, ''))) {
            return { success: false, error: 'Sindicato com este CNPJ já cadastrado' };
        }

        // Gera ID e senha provisória
        const sindicatoId = 'sind_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const provisionalPassword = securityManager.generateProvisionalPassword();

        // Cria novo sindicato
        const novoSindicato = {
            id: sindicatoId,
            nome: securityManager.sanitizeInput(sindicatoData.nome),
            cnpj: sindicatoData.cnpj,
            email: securityManager.sanitizeInput(sindicatoData.email),
            fone: securityManager.sanitizeInput(sindicatoData.fone),
            status: 'ativo',
            criado: new Date().toLocaleString('pt-BR'),
            adminUser: null
        };

        // Cria usuário admin para o sindicato
        const novoUsuario = {
            id: 'user_' + sindicatoId,
            username: sindicatoId.substr(0, 20),
            passwordHash: null, // Força troca na primeira autenticação
            email: sindicatoData.email,
            role: 'administrador_sindicato',
            status: 'ativo',
            sindicatoId: sindicatoId,
            criado: new Date().toLocaleString('pt-BR'),
            loginAttempts: 0,
            lastLogin: null,
            provisionalPassword: provisionalPassword,
            provisionalPasswordExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        novoSindicato.adminUser = novoUsuario.id;

        this.sindicatos.push(novoSindicato);
        this.users.push(novoUsuario);

        this.saveSindicatos();
        this.saveUsers();

        securityManager.addSecurityLog(`Novo sindicato cadastrado: ${novoSindicato.nome}`, 'success');

        return {
            success: true,
            sindicato: novoSindicato,
            usuario: novoUsuario,
            provisionalPassword: provisionalPassword
        };
    }

    /**
     * Altera senha do usuário
     */
    changePassword(userId, currentPassword, newPassword, confirmPassword) {
        const user = this.users.find(u => u.id === userId);

        if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        if (newPassword !== confirmPassword) {
            return { success: false, error: 'As senhas não conferem' };
        }

        // Valida força da senha
        const strength = securityManager.validatePasswordStrength(newPassword);
        if (!strength.valid) {
            return { success: false, error: 'Senha fraca', details: strength.errors };
        }

        // Verifica senha atual (se já tem uma definida)
        if (user.passwordHash) {
            const currentPasswordHash = this.hashPasswordSync(currentPassword);
            if (user.passwordHash !== currentPasswordHash) {
                return { success: false, error: 'Senha atual incorreta' };
            }
        }

        user.passwordHash = this.hashPasswordSync(newPassword);
        user.provisionalPassword = null;
        user.provisionalPasswordExpiry = null;

        this.saveUsers();

        securityManager.addSecurityLog(`Senha alterada: ${user.username}`, 'success');

        return { success: true, message: 'Senha alterada com sucesso' };
    }

    /**
     * Exclui sindicato
     */
    deletarSindicato(sindicatoId) {
        const sindicato = this.sindicatos.find(s => s.id === sindicatoId);

        if (!sindicato) {
            return { success: false, error: 'Sindicato não encontrado' };
        }

        // Cria backup dos dados
        const backup = securityManager.createBackup(sindicato);
        const backupPath = `./backups/sindicato_${sindicato.id}_${new Date().getTime()}.json`;

        // Remove sindicato
        this.sindicatos = this.sindicatos.filter(s => s.id !== sindicatoId);

        // Remove usuários associados
        const usuariosRemovidos = this.users.filter(u => u.sindicatoId === sindicatoId);
        this.users = this.users.filter(u => u.sindicatoId !== sindicatoId);

        this.saveSindicatos();
        this.saveUsers();

        securityManager.addSecurityLog(`Sindicato excluído: ${sindicato.nome}`, 'warning');

        return {
            success: true,
            message: 'Sindicato excluído com sucesso',
            backup: backup,
            backupPath: backupPath,
            usuariosRemovidos: usuariosRemovidos.length
        };
    }

    /**
     * Carrega usuários do localStorage
     */
    loadUsers() {
        const stored = localStorage.getItem('sociodash_users');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Salva usuários no localStorage
     */
    saveUsers() {
        localStorage.setItem('sociodash_users', JSON.stringify(this.users));
    }

    /**
     * Carrega sindicatos do localStorage
     */
    loadSindicatos() {
        const stored = localStorage.getItem('sociodash_sindicatos');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Salva sindicatos no localStorage
     */
    saveSindicatos() {
        localStorage.setItem('sociodash_sindicatos', JSON.stringify(this.sindicatos));
    }

    /**
     * Obtém todos os sindicatos
     */
    getSindicatos() {
        return [...this.sindicatos];
    }

    /**
     * Obtém todos os usuários
     */
    getUsuarios() {
        return [...this.users];
    }

    /**
     * Desbloqueia usuário
     */
    desbloquearUsuario(username) {
        securityManager.lockoutMap.delete(username);
        securityManager.attemptMap.delete(username);
        securityManager.addSecurityLog(`Usuário desbloqueado: ${username}`, 'success');
        return { success: true, message: 'Usuário desbloqueado' };
    }
}

// Instância global
const authManager = new AuthManager();