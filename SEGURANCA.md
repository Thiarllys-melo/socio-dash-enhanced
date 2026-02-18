# 🔐 DOCUMENTAÇÃO DE SEGURANÇA - Socio-Dash v1.0

## 📋 Índice
1. [Arquitetura de Segurança](#arquitetura)
2. [Autenticação](#autentica%C3%A7%C3%A3o)
3. [Autorização](#autoriza%C3%A7%C3%A3o)
4. [Validação](#valida%C3%A7%C3%A3o)
5. [Criptografia](#criptografia)
6. [Rate Limiting](#rate-limiting)
7. [Logs e Monitoramento](#logs)
8. [Proteção contra Ataques](#prote%C3%A7%C3%A3o)
9. [Best Practices](#best-practices)

---

## <a name="arquitetura"></a>1. ARQUITETURA DE SEGURANÇA

### Componentes

```
┌─────────────────────────────────────────────────┐
│         CAMADA DE APRESENTAÇÃO (UI)           │
│  - Input Validation                            │
│  - Sanitização de Saída                     │
│  - CSRF Protection                             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│       CAMADA DE SEGURANÇA (Security.js)       │
│  - Password Validation                         │
│  - Rate Limiting                               │
│  - Session Management                          │
│  - Input Sanitization                          │
│  - Audit Logging                               │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│    CAMADA DE AUTENTICAÇÃO (Auth.js)           │
│  - User Verification                           │
│  - Password Hashing                            │
│  - Session Token Generation                    │
│  - User Management                             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│    CAMADA DE ARMAZENAMENTO (localStorage)      │
│  - Persistent Data Storage                     │
│  - Encrypted Sensitive Data                    │
└─────────────────────────────────────────────────┘
```

---

## <a name="autentica%C3%A7%C3%A3o"></a>2. AUTENTICAÇÃO

### Fluxo de Login

```javascript
1. User Input:
   username → Sanitize
   password → Hash

2. Validate:
   ✓ Account Locked?
   ✓ Max Attempts Exceeded?

3. Check Credentials:
   ✓ User Exists?
   ✓ Password Match?
   ✓ Status = Active?

4. Generate Session:
   → Security Token
   → Session Data
   → Activity Log

5. Redirect:
   → Dashboard
   → Set Cookie with Token
```

### Código de Hash

```javascript
// SHA-256 (Demo - use bcrypt em prod)
await crypto.subtle.digest('SHA-256', data)

// Para Produção:
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 10);
```

### Armazenamento de Sessão

```javascript
// sessionStorage (Seguro - limpa ao fechar aba)
sessionStorage.setItem('sessionToken', token);
sessionStorage.setItem('user', JSON.stringify(user));

// NÃO usar localStorage para dados sensíveis!
```

---

## <a name="autoriza%C3%A7%C3%A3o"></a>3. AUTORIZAÇÃO

### Roles e Permissões

```javascript
const ROLES = {
    'administrador': {
        permissions: ['criar_sindicato', 'editar_sindicato', 'deletar_sindicato', 
                     'gerenciar_usuarios', 'gerenciar_seguranca'],
        level: 10
    },
    'administrador_sindicato': {
        permissions: ['ver_relatorios', 'editar_sindicato', 'gerenciar_usuarios_sindicato'],
        level: 5
    },
    'operador': {
        permissions: ['ver_relatorios', 'editar_dados_basicos'],
        level: 2
    },
    'visualizador': {
        permissions: ['ver_relatorios'],
        level: 1
    }
};
```

### Exemplo de Verificação

```javascript
function checkPermission(user, action) {
    const userRole = ROLES[user.role];
    return userRole && userRole.permissions.includes(action);
}

// Uso
if (!checkPermission(currentUser, 'deletar_sindicato')) {
    return { success: false, error: 'Não autorizado' };
}
```

---

## <a name="valida%C3%A7%C3%A3o"></a>4. VALIDAÇÃO DE ENTRADA

### Sanitização XSS

```javascript
// Proteção contra JavaScript injetado
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;  // textContent é seguro
    return div.innerHTML;
}

// Input: <script>alert('XSS')</script>
// Output: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

### Validação de Email

```javascript
// Regex RFC 5322 simplificado
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Válidos: user@example.com, user+tag@domain.co.uk
// Inválidos: user@, @example.com, user@.com
```

### Validação de CNPJ

```javascript
// Dígito Verificador (módulo 11)
// CNPJ formato: XX.XXX.XXX/XXXX-XX
// Exemplo válido: 11.222.333/0001-81

function validateCNPJ(cnpj) {
    // Remove caracteres especiais
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false; // Todos iguais
    
    // Calcula primeiro dígito verificador
    let sum = 0;
    let pos = 5;
    
    for (let i = 0; i < 8; i++) {
        sum += parseInt(cnpj[i]) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let digit = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (digit !== parseInt(cnpj[8])) return false;
    
    // Calcula segundo dígito...
    return true;
}
```

---

## <a name="criptografia"></a>5. CRIPTOGRAFIA

### Hash de Senhas

**NÃO USE:**
```javascript
// ❌ MD5 - Quebrado
// ❌ SHA-1 - Quebrado
// ❌ SHA-256 simples - Vulnerável a rainbow tables
```

**USE:**
```javascript
// ✅ bcrypt (Melhor)
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(password, hash);

// ✅ Argon2 (Mais seguro)
import argon2 from 'argon2';
const hash = await argon2.hash(password);
const valid = await argon2.verify(hash, password);

// ✅ PBKDF2
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
```

### Geração de Senhas Provisórias

```javascript
function generateProvisionalPassword(length = 12) {
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
    
    // Completa aleatoriamente
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Embaralha
    return password.split('').sort(() => Math.random() - 0.5).join('');
}
```

---

## <a name="rate-limiting"></a>6. RATE LIMITING E BLOQUEIO

### Sistema de Bloqueio por Tentativas

```javascript
// Configuração
const SECURITY_CONFIG = {
    maxAttempts: 5,           // Máximo de tentativas
    lockoutTime: 15,          // Minutos
    sessionTimeout: 30        // Minutos
};

// Estrutura de bloqueio
this.lockoutMap.set(username, {
    timestamp: Date.now(),
    duration: lockoutTime,    // em minutos
    reason: 'Muitas tentativas'
});

// Verificação de bloqueio
function checkLoginAttempt(username) {
    const now = Date.now();
    
    if (this.lockoutMap.has(username)) {
        const lockoutData = this.lockoutMap.get(username);
        const expiryTime = lockoutData.timestamp + (lockoutData.duration * 60 * 1000);
        
        if (now < expiryTime) {
            const remainingMinutes = Math.ceil((expiryTime - now) / 60000);
            return {
                allowed: false,
                remainingTime: remainingMinutes
            };
        }
        
        // Bloqueio expirou
        this.lockoutMap.delete(username);
    }
    
    return { allowed: true };
}
```

### Exemplo de Bloqueio Progressivo

```
1ª tentativa falhada: +1 (sem ação)
2ª tentativa falhada: +1 (sem ação)
3ª tentativa falhada: +1 (aviso)
4ª tentativa falhada: +1 (aviso forte)
5ª tentativa falhada: BLOQUEIO POR 15 MINUTOS

Após 15 minutos: Bloqueio expirado, contador zerado
```

---

## <a name="logs"></a>7. LOGS E MONITORAMENTO

### Eventos Registrados

```javascript
const LOG_TYPES = {
    'success': {
        icon: '✓',
        color: '#10b981',
        examples: [
            'Login bem-sucedido: user@example.com',
            'Sindicato cadastrado: ABC Sindicato',
            'Senha alterada: user@example.com'
        ]
    },
    'warning': {
        icon: '⚠️',
        color: '#f59e0b',
        examples: [
            'Tentativa de login falhada: user@example.com (2/5)',
            'Exclusão de sindicato: ABC Sindicato',
            'Falha de validação: CNPJ inválido'
        ]
    },
    'error': {
        icon: '✗',
        color: '#ef4444',
        examples: [
            'BLOQUEIO ATIVADO: user@example.com',
            'Tentativa de login bloqueado: user@example.com',
            'Falha de segurança crítica: XSS detectado'
        ]
    }
};

// Estrutura de Log
const logEntry = {
    timestamp: '15/02/2025 10:30:45',
    message: 'Login bem-sucedido: admin',
    type: 'success',
    userId: 'admin-001',
    ipAddress: '192.168.1.100',
    action: 'LOGIN',
    status: 'SUCCESS'
};
```

### Versão 2.0 - Implementar Servidor

```javascript
// Backend logging para produção
app.post('/api/log', (req, res) => {
    const { timestamp, message, type, userId, action } = req.body;
    
    // Validação no servidor
    if (!userId || !action) {
        return res.status(400).json({ error: 'Invalid log data' });
    }
    
    // Salva em banco de dados
    AuditLog.create({
        timestamp,
        message,
        type,
        userId,
        action,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
    });
    
    res.json({ success: true });
});
```

---

## <a name="prote%C3%A7%C3%A3o"></a>8. PROTEÇÃO CONTRA ATAQUES

### Ataques Comuns e Defesas

#### 1. XSS (Cross-Site Scripting)

**Ataque:**
```html
<input value="<script>alert('XSS')</script>">
<input value="x" onload="alert('XSS')">
```

**Defesa:**
```javascript
// Usar textContent ao invés de innerHTML
const div = document.createElement('div');
div.textContent = userInput;  // Seguro
return div.innerHTML;  // Escapa caracteres especiais
```

#### 2. SQL Injection (Não aplica em frontend, mas importante em backend)

**Ataque:**
```sql
SELECT * FROM users WHERE username = 'admin' OR '1'='1'
```

**Defesa:**
```javascript
// Use prepared statements
const user = await db.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
);
```

#### 3. CSRF (Cross-Site Request Forgery)

**Defesa:**
```javascript
// Use tokens CSRF
const csrfToken = generateToken();
sessionStorage.setItem('csrfToken', csrfToken);

// No header de requisições
fetch('/api/endpoint', {
    method: 'POST',
    headers: {
        'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
});
```

#### 4. Brute Force

**Defesa:**
```javascript
// Rate limiting com bloqueio
if (attempts >= maxAttempts) {
    lockUser(username, lockoutTime);
    notifySecurityTeam();
}
```

#### 5. Session Hijacking

**Defesa:**
```javascript
// Use sessionStorage (não localStorage)
// Use HTTPS sempre
// Valide tokens no servidor
// Implemente session timeout
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
if (Date.now() - lastActivity > SESSION_TIMEOUT) {
    logout();
}
```

---

## <a name="best-practices"></a>9. BEST PRACTICES

### ✅ DÕ (DO's)

1. **Use HTTPS sempre**
   ```javascript
   // Redirecione HTTP para HTTPS
   if (location.protocol !== 'https:') {
       location.protocol = 'https:';
   }
   ```

2. **Implemente Content Security Policy**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self'">
   ```

3. **Use Headers de Segurança**
   ```javascript
   // Express.js exemplo
   app.use(helmet()); // Adiciona headers de segurança
   ```

4. **Valide no Frontend E Backend**
   ```javascript
   // Frontend: UX melhor
   if (!email.includes('@')) {
       showError('Email inválido');
   }
   
   // Backend: Segurança
   if (!isValidEmail(email)) {
       return res.status(400).json({ error: 'Invalid email' });
   }
   ```

5. **Use Variaveis de Ambiente**
   ```javascript
   // NÃO faça isso:
   const API_KEY = 'sk-1234567890';
   
   // Faça isso:
   const API_KEY = process.env.API_KEY;
   ```

### ❌ NÃO FAÇA (DON'Ts)

1. **NÃO armazene senhas em texto plano**
   ```javascript
   // ❌ NUNCA
   user.password = 'minha_senha';
   
   // ✅ SEMPRE
   user.password = await bcrypt.hash(password, 12);
   ```

2. **NÃO exponha dados de erro**
   ```javascript
   // ❌ NUNCA
   catch (error) {
       res.json({ error: error.message }); // Exporá detalhes
   }
   
   // ✅ SEMPRE
   catch (error) {
       console.error(error); // Log interno
       res.status(500).json({ error: 'Erro interno' }); // Genérico
   }
   ```

3. **NÃO use bibliotecas desatualizadas**
   ```bash
   # Verifique regularmente
   npm audit
   npm update
   ```

4. **NÃO execute código do usuário**
   ```javascript
   // ❌ NUNCA
   eval(userInput);
   
   // ❌ NUNCA
   new Function(userInput)();
   ```

5. **NÃO confie apenas no frontend**
   ```javascript
   // Frontend pode ser falsificado
   // Sempre valide no backend
   ```

### Checklist de Segurança

- [ ] HTTPS ativado
- [ ] CORS configurado corretamente
- [ ] CSP header implementado
- [ ] Rate limiting ativo
- [ ] Input validation implementada
- [ ] Output encoding implementada
- [ ] Password hashing seguro (bcrypt/argon2)
- [ ] Session timeout configurado
- [ ] CSRF protection implementada
- [ ] Logs de segurança mantidos
- [ ] Backup regular
- [ ] Testing de segurança
- [ ] Penetration testing
- [ ] Dependençias atualizadas
- [ ] Secrets em variáveis de ambiente

---

**Última Atualização**: 15/02/2025
**Versão**: 1.0
**Status**: Production Ready (com ressalvas - ver recomendações para Prod)
