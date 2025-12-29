# Netlify Deployment Setup

## Problema Anterior
O login não funcionava no Netlify porque as variáveis de ambiente Supabase não eram passadas corretamente.

## Solução

### 1. Configure as Variáveis de Ambiente no Netlify

**Acesse:** `Site Settings → Build & deploy → Environment`

**Adicione estas variáveis:**

| Variable Name | Value | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Sua URL do Supabase | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Sua chave anônima do Supabase | `eyJhbGc...` |

### 2. Verifique as Configurações de Build

- **Build command:** `npm run build`
- **Publish directory:** `dist/public`
- **Base directory:** (deixe vazio)

### 3. Como Funciona Agora

1. **Durante o build (npm run build):**
   - O script `server/setup-env.mjs` lê as variáveis de ambiente
   - Cria um arquivo `.env.local` com essas variáveis
   - O Vite compila o frontend com as credenciais Supabase incluídas
   - O servidor também recebe `SUPABASE_ANON_KEY` em runtime

2. **Na aplicação em produção:**
   - O frontend acessa Supabase diretamente com as credenciais compiladas
   - O backend tem as credenciais em runtime para o fallback `/api/config`
   - O endpoint `/api/verify-login` busca usuários na tabela `logins` usando Supabase

### 4. Testando Localmente Antes de Deploy

```bash
# Configure as variáveis de ambiente localmente
export VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_ANON_KEY="sua-chave-anonima"

# Faça o build (simulando Netlify)
npm run build

# Inicie a aplicação em produção
npm start
```

### 5. Debugando Problemas

Se o login ainda não funcionar:

1. **Verifique os logs do Netlify:**
   - Vá para `Deploys → (seu deploy) → Deploy log`
   - Procure por `[VERIFY-LOGIN]` ou `[API/CONFIG]` para ver mensagens de debug
   - Procure por warnings sobre variáveis de ambiente faltantes

2. **Teste o endpoint de configuração:**
   - Abra `https://seu-site.netlify.app/api/config` no navegador
   - Deve retornar um JSON com `supabaseUrl` e `supabaseAnonKey`

3. **Verifique o console do navegador:**
   - Procure por `[Supabase Init]` - verá se as credenciais foram carregadas

4. **Verifique a tabela `logins` no Supabase:**
   - Vá para `SQL Editor` no Supabase
   - Execute: `SELECT email, status FROM logins;`
   - Confirme que seus usuários existem e estão com `status = 'active'`

### 6. Checklist Final

- [ ] `VITE_SUPABASE_URL` configurada no Netlify
- [ ] `SUPABASE_ANON_KEY` configurada no Netlify
- [ ] Build command é `npm run build`
- [ ] Publish directory é `dist/public`
- [ ] Usuários criados no admin estão na tabela `logins` com `status = 'active'`
- [ ] Usuários têm email preenchido corretamente
- [ ] Senha está armazenada como texto simples (sem hashing, conforme o app atual)

### 7. Redeploy

Depois de configurar as variáveis:
1. Vá para `Deploys`
2. Clique em `Clear cache and deploy site`
3. Aguarde a build terminar (procure por erros no log)
4. Teste o login em `https://seu-site.netlify.app`
