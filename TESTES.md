# 🧪 GUIA DE TESTES - Socio-Dash v1.0

## 📋 Matriz de Testes

### 1️⃣ TESTES DE AUTENTICAÇÃO

#### ✅ T001: Login Válido
**Precondições**: Nenhuma
**Passos**:
1. Abra o aplicativo
2. Insira username: `admin`
3. Insira password: `admin123`
4. Clique em "Entrar"

**Resultado Esperado**:
- ✓ Redirecionamento para dashboard
- ✓ Exibição do nome do usuário na sidebar
- ✓ Acesso a todas as seções
- ✓ Log de "Login bem-sucedido" no painel de segurança

**Status**: ✅ PASSOU

---

#### ✅ T002: Login com Senha Incorreta
**Precondições**: Nenhuma
**Passos**:
1. Abra o aplicativo
2. Insira username: `admin`
3. Insira password: `senha_errada`
4. Clique em "Entrar"

**Resultado Esperado**:
- ✓ Mensagem de erro: "Usuário ou senha incorretos"
- ✓ Permanece na tela de login
- ✓ Incrementa contador de tentativas (1/5)
- ✓ Log de tentativa falhada registrado

**Status**: ✅ PASSOU

---

### 2️⃣ TESTES DE SISTEMA DE BLOQUEIO (CORRIGIDO)

#### ✅ T003: Bloqueio Após 5 Tentativas
**Precondições**: Nenhuma
**Passos**:
1. Tente 5 vezes login com senha incorreta (admin/wrongpass)
2. Na 5ª tentativa, o sistema deve bloquear
3. Tente fazer login novamente

**Resultado Esperado**:
- ✓ Após a 5ª tentativa falhada, ver mensagem: "Muitas tentativas falhadas. Conta bloqueada por 15 minutos."
- ✓ Botão de login desabilitado por 3 segundos
- ✓ Log de "BLOQUEIO ATIVADO" aparece
- ✓ Próxima tentativa mostra: "Usuário bloqueado. Tente novamente em X minutos."

**Status**: ✅ PASSOU

---

#### ✅ T004: Bloqueio Temporizado
**Precondições**: Usuário bloqueado
**Passos**:
1. Com usuário bloqueado, aguarde 15 minutos
2. Tente fazer login novamente

**Resultado Esperado**:
- ✓ Após 15 minutos, bloqueio expira automaticamente
- ✓ Login é permitido novamente
- ✓ Log de expiridade de bloqueio registrado

**Status**: ✅ PASSOU (Teste acelerado: modificar lockoutTime para 1 minuto)

---

#### ✅ T005: Desbloqueio Manual
**Precondições**: Usuário bloqueado
**Passos**:
1. Com usuário bloqueado, faça login com usuário admin válido
2. Vá para "Usuários"
3. Localize o usuário bloqueado
4. Clique "Desbloquear"

**Resultado Esperado**:
- ✓ Toast de sucesso: "Usuário desbloqueado"
- ✓ Usuário volta para status "ativo"
- ✓ Login do usuário é permitido imediatamente

**Status**: ✅ PASSOU

---

### 3️⃣ TESTES DE CADASTRO COM SENHA PROVISÓRIA (NOVO)

#### ✅ T006: Geração de Senha Provisória
**Precondições**: Conectado como admin
**Passos**:
1. Vá para "Sindicatos"
2. Clique em "+ Novo Sindicato"
3. Preencha os dados:
   - Nome: "Sindicato Teste 001"
   - CNPJ: "11.222.333/0001-81"
   - Email: "teste001@sindicato.com"
   - Fone: "(85) 99999-1111"
4. Clique "Cadastrar"

**Resultado Esperado**:
- ✓ Modal com titulo "Senha Provisória Gerada"
- ✓ Senha exibida com 12 caracteres
- ✓ Senha contém: maiúsculas, minúsculas, números, caracteres especiais
- ✓ Nome do sindicato e usuário mostrados no modal
- ✓ Aviso de 24 horas de validade
- ✓ Instruções de segurança viáveis

**Status**: ✅ PASSOU

---

#### ✅ T007: Cópia de Senha para Clipboard
**Precondições**: Modal de senha provisória aberto
**Passos**:
1. Clique no botão 📋 (copiar)
2. Abra um editor de texto
3. Cole (Ctrl+V ou Cmd+V)

**Resultado Esperado**:
- ✓ Toast: "Senha copiada para a área de transferência!"
- ✓ Senha é colada no editor
- ✓ Senha está correta e completa

**Status**: ✅ PASSOU

---

#### ✅ T008: Força Troca de Senha no Primeiro Login
**Precondições**: Sindicato e usuário criados com senha provisória
**Passos**:
1. Logout (clique "Sair")
2. Faça login com:
   - Username: `sind_[ID]`
   - Password: [senha copiada do modal]

**Resultado Esperado**:
- ✓ Login realizado
- ✓ Modal "Alterar Senha" abre automaticamente
- ✓ Campo "Senha Atual" preenchido com aviso
- ✓ Forceça mudar senha para continuar

**Status**: ✅ PASSOU

---

### 4️⃣ TESTES DE EXCLUSÃO DE SINDICATOS (NOVO)

#### ✅ T009: Confirmação de Exclusão
**Precondições**: Mínimo um sindicato cadastrado
**Passos**:
1. Vá para "Sindicatos"
2. Localize um sindicato
3. Clique no botão "Excluir"

**Resultado Esperado**:
- ✓ Modal "Confirmar Exclusão" abre
- ✓ Nome do sindicato exibido na mensagem
- ✓ Aviso de que ação é irreversível
- ✓ Path do backup mostrado
- ✓ Botões "Cancelar" e "Confirmar Exclusão"

**Status**: ✅ PASSOU

---

#### ✅ T010: Cancelamento de Exclusão
**Precondições**: Modal de confirmação aberto
**Passos**:
1. Clique "Cancelar"

**Resultado Esperado**:
- ✓ Modal fecha
- ✓ Sindicato ainda existe na lista
- ✓ Nenhum dado foi alterado

**Status**: ✅ PASSOU

---

#### ✅ T011: Exclusão com Backup
**Precondições**: Modal de confirmação aberto
**Passos**:
1. Clique "Confirmar Exclusão"
2. Abra o console (F12 > Console)
3. Verifique a lista de sindicatos

**Resultado Esperado**:
- ✓ Toast: "Sindicato excluído com sucesso"
- ✓ Modal fecha
- ✓ Sindicato desaparece da lista
- ✓ Dashboard atualiza (número de sindicatos diminui)
- ✓ Log de segurança registra a exclusão
- ✓ Backup gerado com dados originais

**Status**: ✅ PASSOU

---

### 5️⃣ TESTES DE SEGURANÇA

#### ✅ T012: Sanitização de XSS
**Precondições**: Modal de cadastro aberto
**Passos**:
1. No campo "Nome", insira: `<script>alert('XSS')</script>`
2. Clique "Cadastrar"

**Resultado Esperado**:
- ✓ Nenhum alert aparece
- ✓ Sindicato é cadastrado com o nome sanitizado
- ✓ Nome exibido como texto, não executado

**Status**: ✅ PASSOU

---

#### ✅ T013: Validação de CNPJ
**Precondições**: Modal de cadastro aberto
**Passos**:
1. Tente com CNPJ inválido: `00.000.000/0000-00`
2. Tente com CNPJ válido: `11.222.333/0001-81`

**Resultado Esperado**:
- ✓ CNPJ inválido: Erro "CNPJ inválido"
- ✓ CNPJ válido: Cadastro prossegue
- ✓ Validação de dígito verifícador funciona

**Status**: ✅ PASSOU

---

#### ✅ T014: Validação de Email
**Precondições**: Modal de cadastro aberto
**Passos**:
1. Tente com email inválido: `email_invalido`
2. Tente com email válido: `valido@sindicato.com`

**Resultado Esperado**:
- ✓ Email inválido: Erro "Email inválido"
- ✓ Email válido: Cadastro prossegue

**Status**: ✅ PASSOU

---

#### ✅ T015: Força de Senha
**Precondições**: Conectado como admin
**Passos**:
1. Vá para "Segurança"
2. Verifique os requisitos checked
3. Tente alterar para senha fraca: `abc`

**Resultado Esperado**:
- ✓ Requisitos mostrados: maiúsculas, números, especiais
- ✓ Senha fraca rejeitada com erros listados
- ✓ Indicador de força mostra "WEAK" em vermelho

**Status**: ✅ PASSOU

---

### 6️⃣ TESTES DE PAINEL DE SEGURANÇA

#### ✅ T016: Modificação de Configurações
**Precondições**: Conectado como admin
**Passos**:
1. Vá para "Segurança"
2. Altere:
   - Máximo de Tentativas: 3
   - Tempo de Bloqueio: 5 minutos
3. Clique "Salvar Configurações"

**Resultado Esperado**:
- ✓ Toast: "Configurações de segurança atualizadas!"
- ✓ Valores são salvos em localStorage
- ✓ Novas configurações são aplicadas imediatamente
- ✓ Teste de bloqueio dispara após 3 tentativas

**Status**: ✅ PASSOU

---

#### ✅ T017: Log de Segurança
**Precondições**: Conectado como admin, com atividade anterior
**Passos**:
1. Vá para "Segurança"
2. Role para "Atividade de Segurança"
3. Observe os logs

**Resultado Esperado**:
- ✓ Logs mostram eventos recentes
- ✓ Cada log tem: timestamp, mensagem, tipo (sucesso/warning/erro)
- ✓ Entradas coloridas conforme o tipo
- ✓ Ordem reversa (mais recente primeiro)

**Status**: ✅ PASSOU

---

## 📊 Resumo de Testes

| ID | Teste | Status | Notas |
|----|-------|--------|-------|
| T001 | Login Válido | ✅ | Funcionando perfeitamente |
| T002 | Senha Incorreta | ✅ | Incrementa tentativas corretamente |
| T003 | Bloqueio 5 Tentativas | ✅ | CORRIGIDO - Funciona preciso |
| T004 | Bloqueio Temporizado | ✅ | Expira automaticamente |
| T005 | Desbloqueio Manual | ✅ | Imediato e sem erros |
| T006 | Gera Senha Provisória | ✅ | NOVO - Implementado com sucesso |
| T007 | Copiar Senha | ✅ | Clipboard funcionando |
| T008 | Força Troca Senha | ✅ | Modal abre no login |
| T009 | Confirmação Exclusão | ✅ | NOVO - Interface clara |
| T010 | Cancelamento | ✅ | Dados preservados |
| T011 | Exclusão com Backup | ✅ | NOVO - Backup gerado |
| T012 | Sanitização XSS | ✅ | MELHORADA - Segurança robusta |
| T013 | Validação CNPJ | ✅ | MELHORADA - Dígito verificador |
| T014 | Validação Email | ✅ | Regex correto |
| T015 | Força Senha | ✅ | MELHORADA - Configurável |
| T016 | Config Segurança | ✅ | Salva e aplica |
| T017 | Log Segurança | ✅ | MELHORADO - Detalhado |

**Total: 17/17 TESTES APROVADOS ✅**

---

## 🎯 Proteções Implementadas

✅ **Rate Limiting**: 5 tentativas + bloqueio de 15 min (configurável)
✅ **Sanitização**: XSS prevention em todas as entradas
✅ **Validações**: CNPJ com dígito verificador, Email regex
✅ **Hash**: SHA-256 para senhas
✅ **Tokens**: Sessão segura com timeout
✅ **Logs**: Rastreamento completo de eventos
✅ **Backup**: Dados arquivados antes de exclusão
✅ **Modal de Senha**: Compartilhamento seguro

---

## 🚀 Próximos Passos

1. Migrar para backend com autent. real
2. Usar bcrypt para hash de senhas
3. Implementar HTTPS obrigatório
4. Adicionar 2FA (autenticação de dois fatores)
5. Backup em servidor externo
6. Email real para senhas provisórias
7. Audit trail persístente
8. Recuperação de conta
