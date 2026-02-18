/**
 * SISTEMA DE SEGURANÇA AVANÇADO
 * Implementa rate limiting, validação de senha, hash, sanitização e proteção contra ataques
 */

class SecurityManager {
    constructor() {
        this.lockoutMap = new Map();
        this.attemptMap = new Map();
        this.sessionTokens = new Map();
        this.passwordHistor = new Map();
        this.securityLog = [];
        this.securityConfig = this.loadSecurityConfig();
    }

    /**
     * Carrega configurações de segurança do localStorage
     */
    loadSecurityConfig() {
        const defaults = {
            maxAttempts: 5,
            lockoutTime: 15, // minutos
            minPasswordLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecial: true,
            sessionTimeout: 30, // minutos
            passwordExpiry: 90, // dias
        };

        const stored = localStorage.getItem('securityConfig');
        return stored ? JSON.parse(stored) : defaults;
    }

    /**
     * Salva configurações de segurança
     */
    saveSecurityConfig(config) {
        this.securityConfig = config;
        localStorage.setItem('securityConfig', JSON.stringify(config));
    }

    /**
     * Simples hash SHA-256 (para demonstração - use bcrypt em produção)
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Valida a força da senha
     */
    validatePasswordStrength(password) {
        const config = this.securityConfig;
        const errors = [];
        let strength = 'weak';

        if (password.length < config.minPasswordLength) {
            errors.push(`Mínimo de ${config.minPasswordLength} caracteres`);
        }

        if (config.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Requer letras maiúsculas');
        }

        if (config.requireNumbers && !/\d/.test(password)) {
            errors.push('Requer números');
        }

        if (config.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Requer caracteres especiais');
        }

        if (errors.length === 0) {
            if (password.length >= config.minPasswordLength + 4 &&
                /[A-Z]/.test(password) &&
                /[a-z]/.test(password) &&
                /\d/.test(password) &&
                /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                strength = 'strong';
            } else {
                strength = 'medium';
            }
        }

        return { valid: errors.length === 0, errors, strength };
    }

    /**
     * Sanitiza entrada de texto contra XSS
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    /**
     * Valida email
     */
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Valida CNPJ
     */
    validateCNPJ(cnpj) {
        cnpj = cnpj.replace(/[^\d]/g, '');
        if (cnpj.length !== 14) return false;

        if (/^(\d)\1{13}$/.test(cnpj)) return false;

        let size = cnpj.length - 2;
        let numbers = cnpj.substring(0, size);
        let digits = cnpj.substring(size);
        let sum = 0;
        let pos = size - 7;

        for (let i = size; i >= 1; i--) {
            sum += numbers.charAt(size - i) * pos--;
            if (pos < 2) pos = 9;
        }

        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(0))) return false;

        size = size + 1;
        numbers = cnpj.substring(0, size);
        sum = 0;
        pos = size - 7;

        for (let i = size; i >= 1; i--) {
            sum += numbers.charAt(size - i) * pos--;
            if (pos < 2) pos = 9;
        }

        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(1))) return false;

        return true;
    }

    /**
     * Sistema de bloqueio com rate limiting
     * CORRIGIDO: Verifica corretamente se o usuário está bloqueado
     */
    checkLoginAttempt(username) {
        const now = Date.now();

        // Verifica se o usuário está bloqueado
        if (this.lockoutMap.has(username)) {
            const lockoutData = this.lockoutMap.get(username);
            const lockoutExpiryTime = lockoutData.timestamp + (lockoutData.duration * 60 * 1000);

            if (now < lockoutExpiryTime) {
                const remainingMinutes = Math.ceil((lockoutExpiryTime - now) / 60000);
                this.addSecurityLog(`Tentativa de login bloqueado: ${username}`, 'error');
                return {
                    allowed: false,
                    message: `Usuário bloqueado. Tente novamente em ${remainingMinutes} minutos.`,
                    remainingTime: remainingMinutes
                };
            } else {
                // Bloqueio expirou, remove do mapa
                this.lockoutMap.delete(username);
                this.attemptMap.delete(username);
            }
        }

        return { allowed: true, message: 'OK' };
    }

    /**
     * Registra tentativa de login falhada
     */
    recordFailedAttempt(username) {
        const now = Date.now();
        const config = this.securityConfig;

        if (!this.attemptMap.has(username)) {
            this.attemptMap.set(username, { count: 0, firstAttempt: now });
        }

        const attempts = this.attemptMap.get(username);
        attempts.count++;
        attempts.lastAttempt = now;

        this.addSecurityLog(`Tentativa de login falhada: ${username} (${attempts.count}/${config.maxAttempts})`, 'warning');

        // Se excedeu o número máximo de tentativas
        if (attempts.count >= config.maxAttempts) {
            this.lockoutMap.set(username, {
                timestamp: now,
                duration: config.lockoutTime,
                reason: 'Múltiplas tentativas de login falhadas'
            });

            this.addSecurityLog(`BLOQUEIO ATIVADO: ${username} bloqueado por ${config.lockoutTime} minutos`, 'error');

            return {
                locked: true,
                message: `Muitas tentativas falhadas. Conta bloqueada por ${config.lockoutTime} minutos.`
            };
        }

        return {
            locked: false,
            attemptsRemaining: config.maxAttempts - attempts.count
        };
    }

    /**
     * Limpa tentativas de login bem-sucedidas
     */
    clearLoginAttempts(username) {
        this.attemptMap.delete(username);
        this.addSecurityLog(`Tentativas de login limpas: ${username}`, 'success');
    }

    /**
     * Gera token de sessão seguro
     */
    generateSessionToken(username) {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        this.sessionTokens.set(token, {
            username,
            createdAt: Date.now(),
            lastActivity: Date.now()
        });

        this.addSecurityLog(`Token de sessão gerado: ${username}`, 'success');
        return token;
    }

    /**
     * Valida token de sessão
     */
    validateSessionToken(token) {
        if (!this.sessionTokens.has(token)) {
            return { valid: false, message: 'Token inválido' };
        }

        const sessionData = this.sessionTokens.get(token);
        const now = Date.now();
        const sessionTimeout = this.securityConfig.sessionTimeout * 60 * 1000;

        if (now - sessionData.lastActivity > sessionTimeout) {
            this.sessionTokens.delete(token);
            return { valid: false, message: 'Sessão expirada' };
        }

        sessionData.lastActivity = now;
        return { valid: true, username: sessionData.username };
    }

    /**
     * Gera senha provisória aleatória
     */
    generateProvisionalPassword(length = 12) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        const allChars = uppercase + lowercase + numbers + special;
        let password = '';

        // Garante pelo menos um de cada tipo
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        // Completa o resto aleatoriamente
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Embaralha a senha
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        return password;
    }

    /**
     * Adiciona entrada ao log de segurança
     */
    addSecurityLog(message, type = 'info') {
        const entry = {
            timestamp: new Date().toLocaleString('pt-BR'),
            message,
            type // 'success', 'warning', 'error', 'info'
        };

        this.securityLog.push(entry);

        // Mantém apenas os últimos 100 registros
        if (this.securityLog.length > 100) {
            this.securityLog.shift();
        }

        // Atualiza o display se existir
        this.updateSecurityLogDisplay();
    }

    /**
     * Atualiza o display do log de segurança
     */
    updateSecurityLogDisplay() {
        const logContainer = document.getElementById('securityLog');
        if (!logContainer) return;

        logContainer.innerHTML = this.securityLog
            .slice(-20)
            .reverse()
            .map(entry => `
                <div class="log-entry ${entry.type}">
                    <span class="log-timestamp">${entry.timestamp}</span>
                    <p>${entry.message}</p>
                </div>
            `).join('');
    }

    /**
     * Obtém log de segurança
     */
    getSecurityLog() {
        return [...this.securityLog].reverse();
    }

    /**
     * Exporta dados antes de excluir (backup)
     */
    createBackup(data) {
        const backup = {
            timestamp: new Date().toISOString(),
            data: JSON.stringify(data, null, 2),
            hash: this.generateDataHash(JSON.stringify(data))
        };

        return backup;
    }

    /**
     * Gera hash dos dados para verificação de integridade
     */
    generateDataHash(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }
}

// Instância global
const securityManager = new SecurityManager();