# 🚀 GUIA DE DEPLOYMENT - Socio-Dash v1.0

## 📋 Índice

1. [Requisitos](#requisitos)
2. [Deploy Local](#deploy-local)
3. [Deploy em Produção](#deploy-produ%C3%A7%C3%A3o)
4. [Configurações](#configura%C3%A7%C3%B5es)
5. [Checklist de Segurança](#checklist)
6. [Troubleshooting](#troubleshooting)

---

## <a name="requisitos"></a>1. REQUISITOS

### Navegadores Suportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Navegadores com Suporte Completo
```
✅ Chrome 100+
✅ Firefox 95+
✅ Safari 15+
✅ Edge 100+
✅ Opera 86+
```

### Requisitos de Sistema
- Servidor web com suporte a HTTPS
- Espaço em disco: 5MB mínimo
- CPU: Qualquer processador moderno
- RAM: 512MB mínimo

### Dependencias
- localStorage disponível
- Web Crypto API disponível
- JavaScript ativado

---

## <a name="deploy-local"></a>2. DEPLOY LOCAL

### Opção 1: Abrir HTML Direto

```bash
# 1. Clone o repositório
git clone https://github.com/Thiarllys-melo/socio-dash-enhanced.git
cd socio-dash-enhanced

# 2. Abra index.html no navegador
# No Windows:
start index.html

# No Mac:
open index.html

# No Linux:
firefox index.html
```

### Opção 2: Usar Python Server (Recomendado)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Acesse: http://localhost:8000
```

### Opção 3: Usar Node.js

```bash
# Instale http-server globalmente
npm install -g http-server

# Inicie o servidor
http-server

# Acesse: http://localhost:8080
```

### Opção 4: Usar npm com vite

```bash
# Instale dependências
npm install

# Inicie desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## <a name="deploy-produ%C3%A7%C3%A3o"></a>3. DEPLOY EM PRODUÇÃO

### 3.1 Hosting em Vercel (Recomendado para SPA)

```bash
# 1. Instale Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Configure para SPA
# Crie vercel.json:
```

```json
{
  "public": true,
  "buildCommand": "echo 'Build concluído'",
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3.2 Hosting em Netlify

```bash
# 1. Conecte repositório GitHub
# Netlify > New site from Git

# 2. Configure build
# Build Command: (deixe vazio)
# Publish directory: .

# 3. Configure redirect
# Crie _redirects:
```

```
/* /index.html 200
```

### 3.3 Hosting em GitHub Pages

```bash
# 1. Configure repositório
git config user.name "Your Name"
git config user.email "your@email.com"

# 2. Habilite GitHub Pages
# Repository > Settings > Pages
# Branch: main, Folder: /root

# 3. Deploy
git push origin main

# 4. Acesse
# https://username.github.io/socio-dash-enhanced
```

### 3.4 Hosting em Servidor Dedicado (AWS/DigitalOcean/Linode)

```bash
# 1. SSH no servidor
ssh root@seu_servidor.com

# 2. Instale Nginx
apt-get update
apt-get install nginx

# 3. Configure site
# /etc/nginx/sites-available/sociodash:
```

```nginx
server {
    listen 80;
    server_name seu_dominio.com;
    
    root /var/www/socio-dash;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # HTTPS redirect
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name seu_dominio.com;
    
    ssl_certificate /etc/ssl/certs/seu_cert.crt;
    ssl_certificate_key /etc/ssl/private/seu_key.key;
    
    root /var/www/socio-dash;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# 4. Habilite site
ln -s /etc/nginx/sites-available/sociodash /etc/nginx/sites-enabled/

# 5. Teste configuração
nginx -t

# 6. Reinicie
systemctl restart nginx

# 7. Instale certificado SSL (Let's Encrypt)
apt-get install certbot python3-certbot-nginx
certbot --nginx -d seu_dominio.com
```

### 3.5 Hosting em Docker

```dockerfile
# Dockerfile
FROM nginx:alpine

COPY . /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build
docker build -t socio-dash .

# Run
docker run -p 80:80 -p 443:443 socio-dash
```

---

## <a name="configura%C3%A7%C3%B5es"></a>4. CONFIGURAÇÕES

### 4.1 HTTPS Obrigatório

```javascript
// Adicione ao topo de index.html
<script>
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        location.protocol = 'https:';
    }
</script>
```

### 4.2 Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data:; 
               font-src 'self';">
```

### 4.3 Headers de Segurança

```nginx
# No nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### 4.4 Variáveis de Ambiente (para versão backend)

```bash
# .env
VITE_API_URL=https://api.seu_dominio.com
VITE_AUTH_PROVIDER=keycloak
VITE_LOG_LEVEL=warn
```

### 4.5 Configuração de Cache

```nginx
# Habilitar cache para arquivos estáticos
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Não cachear HTML
location ~* \.(html)$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

---

## <a name="checklist"></a>5. CHECKLIST DE SEGURANÇA

### Antes de Deploy

- [ ] HTTPS ativado
- [ ] CSP headers configurados
- [ ] X-Frame-Options setado
- [ ] X-Content-Type-Options setado
- [ ] Referrer-Policy configurado
- [ ] CORS configurado corretamente
- [ ] Cache de arquivos sensíveis desabilitado
- [ ] Sem dados sensíveis em comments
- [ ] Sem console.log em produção
- [ ] Minificação de CSS/JS ativada

### Pós-Deploy

- [ ] Teste com HTTPS
- [ ] Verifique Security Headers
- [ ] Teste Login/Logout
- [ ] Teste Bloqueio de Usuário
- [ ] Teste Criação de Sindicato
- [ ] Verifique Logs
- [ ] Teste no Mobile
- [ ] Verifique Performance
- [ ] Monitore Errors
- [ ] Realize Backup

### Testes de Segurança

```bash
# Verifique headers de segurança
curl -I https://seu_dominio.com

# Procure por:
# Strict-Transport-Security
# X-Frame-Options
# X-Content-Type-Options
# Content-Security-Policy

# Teste SSL
ssl-test https://seu_dominio.com

# Teste OWASP
zap --self-check
```

---

## <a name="troubleshooting"></a>6. TROUBLESHOOTING

### Erro: localStorage não disponível

```javascript
// Cause: Navegador em modo privado ou localStorage desabilitado
// Solução:
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
} catch (e) {
    console.error('localStorage não disponível');
    // Use sessionStorage ou in-memory storage
}
```

### Erro: CORS bloqueado

```javascript
// Cause: Solicitação de dominío diferente
// Solução (nginx):
add_header Access-Control-Allow-Origin "https://seu_dominio.com" always;
```

### Erro: Senha Provisória Não Exibe

```javascript
// Debug:
console.log(document.getElementById('senhaProvisoria'));
console.log(result.provisionalPassword);

// Verifique:
// 1. Modal está sendo aberto?
// 2. ID do elemento está correto?
// 3. Senha está sendo gerada?
```

### Erro: Bloqueio Não Funciona

```javascript
// Debug:
console.log(securityManager.lockoutMap);
console.log(securityManager.checkLoginAttempt('admin'));

// Verifique:
// 1. lockoutTime está em minutos?
// 2. Cálculo de ms está correto? (* 60 * 1000)
// 3. Data/hora do sistema está correta?
```

### Erro: Exclusão Não Salva Backup

```javascript
// Debug:
console.log(securityManager.createBackup(sindicato));
console.log(localStorage.getItem('sociodash_sindicatos'));

// Verifique:
// 1. localStorage disponível?
// 2. Espaço disponível (<5MB)?
// 3. Função createBackup está sendo chamada?
```

### Performance Lenta

```javascript
// Medida de Performance
console.time('login');
// ... executar login ...
console.timeEnd('login');

// Otimizações:
// 1. Minifique CSS/JS
// 2. Comprima imagens
// 3. Lazy-load quando possível
// 4. Cache em localStorage
// 5. Reduza animações em conexões lentas
```

### Erro 404 em Recarga

```nginx
# Solução para SPA
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 📄 Monitoramento

### Ferramentas Recomendadas

1. **Sentry** - Error tracking
   ```javascript
   import * as Sentry from "@sentry/browser";
   Sentry.init({ dsn: "YOUR_DSN" });
   ```

2. **Google Analytics** - User analytics
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
   ```

3. **Uptime Robot** - Monitorar disponibilidade
   ```
   https://uptimerobot.com
   ```

4. **New Relic** - APM
   ```
   https://newrelic.com
   ```

---

## 📧 Suporte

Para sugestões ou problemas:
- Email: support@sociodash.com
- Issues: GitHub Issues
- Chat: Discord (link na documentação)

---

**Versão**: 1.0
**Data**: 15/02/2025
**Status**: Production Ready