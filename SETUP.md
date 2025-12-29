# Setup Agro Tech - Integração Supabase

## Primeira vez rodando o projeto?

Siga os passos abaixo para conectar ao Supabase e que tudo funcione corretamente.

## 📋 Passos de Configuração

### 1️⃣ Criar/Acessar Projeto Supabase

1. Acesse [Supabase](https://supabase.com)
2. Crie um novo projeto ou acesse um existente
3. Anote as informações (você vai precisar)

### 2️⃣ Obter as Credenciais

#### URL do Supabase
- Dashboard → Settings → API
- Copie a **Project URL** (começa com `https://`)

#### Anon Key
- Settings → API → Project API keys
- Copie a chave **`anon`** (começa com `eyJ...`)

#### Database URL (Session Pooler)
- Dashboard → topo → **"Connect"**
- Mude para aba **"Session Pooler"**
- Copie a string completa que começa com `postgresql://`
- **Se a senha tiver caracteres especiais**, converta:
  - `@` → `%40`
  - `?` → `%3F`
  - `:` → `%3A`
  - `/` → `%2F`

**Exemplo:**
```
postgresql://postgres.seu_projeto:SenhaComAt%40123@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

### 3️⃣ Configurar Secrets no Replit

1. Abra **Secrets** (🔍 busque "Secrets")
2. Clique em **"Create new secret"** (ou edite existentes)

**Crie/atualize estes 3 secrets:**

| Nome | Valor |
|------|-------|
| `SUPABASE_URL` | `https://seu_projeto.supabase.co` |
| `SUPABASE_KEY` | Anon Key (eyJ...) |
| `DATABASE_URL` | Connection string do Session Pooler |

3. **Save** para cada um
4. O servidor vai reiniciar automaticamente ✅

### 4️⃣ Criar Tabela do Banco (primeira vez APENAS)

1. Supabase Dashboard → **SQL Editor**
2. Clique **New query**
3. Cole este SQL:

```sql
-- Desabilitar RLS
ALTER TABLE IF EXISTS soil_analysis DISABLE ROW LEVEL SECURITY;

-- Dropar policies antigas
DROP POLICY IF EXISTS "Users can view their own analyses" ON soil_analysis;
DROP POLICY IF EXISTS "Users can insert their own analyses" ON soil_analysis;
DROP POLICY IF EXISTS "Users can update their own analyses" ON soil_analysis;

-- Recriar tabela
DROP TABLE IF EXISTS soil_analysis CASCADE;

CREATE TABLE soil_analysis (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  field_name TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  "pH" NUMERIC(4, 2),
  nitrogen NUMERIC(6, 2),
  phosphorus NUMERIC(6, 2),
  potassium NUMERIC(6, 2),
  moisture NUMERIC(5, 2),
  organic_matter NUMERIC(5, 2),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX idx_soil_analysis_user_email ON soil_analysis(user_email);
CREATE INDEX idx_soil_analysis_status ON soil_analysis(status);
```

4. Clique **Run** (deve mostrar ✅ Success)

### 5️⃣ Testando

1. Abra a app (clique no link verde)
2. Vá em **"Análise de Solo"**
3. Preencha e envie um formulário
4. Supabase → **Table Editor** → **soil_analysis**
5. Os dados devem aparecer na tabela ✅

## 🔄 Próximas Vezes

- **Secrets já configurados?** → Tudo vai funcionar automaticamente! ✅
- **Mudou de projeto Replit?** → Reconfigure os 3 secrets e pronto

## ❓ Problemas Comuns

### "password authentication failed"
- Verifique se `DATABASE_URL` está correto
- Caracteres especiais foram convertidos? (@→%40, ?→%3F)

### "column X does not exist"
- Execute o SQL da seção 4️⃣ novamente
- Verifique se RLS foi desabilitado

### "Supabase not initialized"
- `SUPABASE_URL` ou `SUPABASE_KEY` estão faltando
- Verifique os secrets no Replit

---

**Qualquer dúvida, refira-se a este arquivo!** 📚
