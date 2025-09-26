# 🔧 Setup Automático para Publicação NPM

## 📋 Pré-requisitos

1. **NPM Token**: Criar token de acesso no NPM
2. **GitHub Secrets**: Configurar secrets no repositório
3. **2FA Desabilitado**: Para automação sem OTP

## 🔑 1. Criar NPM Token

### **Passo 1: Acessar NPM**
1. Vá para https://npmjs.com
2. Faça login na sua conta
3. Clique no seu avatar → **Access Tokens**

### **Passo 2: Criar Token**
1. Clique em **Generate New Token**
2. Selecione **Automation**
3. Nome sugerido: `GitHub Actions - Frontend Flow`
4. **⚠️ COPIE O TOKEN** - só aparece uma vez

### **Passo 3: Verificar Permissões**
```bash
# Teste o token localmente (opcional)
export NPM_TOKEN="seu_token_aqui"
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
npm whoami
# Deve mostrar: emerson-saturnino
```

## 🔐 2. Configurar GitHub Secrets

### **Passo 1: Acessar Repositório**
1. Vá para https://github.com/saturnino-fabrica-de-software/frontend-flow-agents
2. Clique em **Settings** → **Secrets and variables** → **Actions**

### **Passo 2: Adicionar Secret**
1. Clique em **New repository secret**
2. **Name**: `NPM_TOKEN`
3. **Secret**: Cole o token do NPM
4. Clique em **Add secret**

### **Passo 3: Criar Environment (Opcional)**
Para maior segurança:
1. **Settings** → **Environments** → **New environment**
2. Nome: `npm-publish`
3. **Environment secrets** → Add `NPM_TOKEN`
4. **Protection rules**: Só branch `main`

## 🧪 3. Testar Workflow

### **Teste 1: Verificar Workflow**
```bash
# Verificar se arquivo existe
ls -la .github/workflows/publish-npm.yml

# Verificar sintaxe YAML (se tiver yamllint)
yamllint .github/workflows/publish-npm.yml
```

### **Teste 2: Commit e Push**
```bash
# Incremente a versão primeiro
npm version patch  # 2.0.0 → 2.0.1
# ou
npm version minor  # 2.0.0 → 2.1.0
# ou edite manualmente package.json

# Commit e push
git add .
git commit -m "feat: add automated NPM publishing workflow"
git push origin main
```

### **Teste 3: Verificar Actions**
1. Vá para https://github.com/seu-repo/actions
2. Deve aparecer o workflow **📦 Publish to NPM**
3. Clique para ver logs detalhados

## 🔄 4. Como Funciona

### **Triggers Automáticos**
- **Push para main**: Publica se versão mudou
- **Manual**: Via GitHub Actions com force option

### **Fluxo Completo**
```
1. 🔍 Check Version
   ├─ Compara package.json vs NPM
   └─ Decide se deve publicar

2. 🧪 Test
   ├─ Instala dependências
   ├─ Testa estrutura Enhanced
   └─ Valida package

3. 🚀 Publish
   ├─ Autentica no NPM
   ├─ Publica package
   └─ Verifica publicação

4. 📊 Notify
   └─ Summary no GitHub
```

### **Verificações de Segurança**
- ✅ Só publica se versão mudou
- ✅ Testa antes de publicar
- ✅ Verifica estrutura Enhanced
- ✅ Environment protection
- ✅ Token expiration handling

## 🚨 Troubleshooting

### **Erro: Token Inválido**
```
Error: 401 Unauthorized - PUT https://registry.npmjs.org/frontend-flow-agents
```

**Solução:**
1. Regenerar token NPM
2. Atualizar secret no GitHub
3. Re-run workflow

### **Erro: Versão Já Existe**
```
Error: 403 Cannot publish over existing version
```

**Solução:**
1. Incrementar versão: `npm version patch`
2. Commit: `git commit -am "bump version"`
3. Push: `git push origin main`

### **Erro: Workflow Não Roda**
**Verificar:**
1. Arquivo está em `.github/workflows/`
2. Sintaxe YAML válida
3. Branch é `main`
4. Path não está em `paths-ignore`

### **Publicação Manual**
Se automação falhar:
```bash
# Forçar via GitHub Actions
gh workflow run "publish-npm.yml" -f force_publish=true

# Ou publicar local
npm version patch
npm publish
```

## 📊 Monitoramento

### **Verificar Status**
```bash
# Status do workflow
gh run list --workflow="publish-npm.yml"

# Logs do último run
gh run view --log

# Verificar NPM
npm info frontend-flow-agents
```

### **Notificações**
- ✅ **Success**: Summary no GitHub Actions
- ❌ **Failure**: Email + GitHub notification
- ⏭️ **Skip**: Log quando versão não mudou

## 🎯 Próximos Passos

1. **Configure NPM_TOKEN** no GitHub Secrets
2. **Teste com push** pequeno
3. **Monitore primeiro workflow**
4. **Documente para equipe**

---

**🚀 Com este setup, toda alteração na main será automaticamente publicada no NPM se a versão foi incrementada!**