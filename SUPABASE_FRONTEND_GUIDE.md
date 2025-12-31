# Guia de Conexão Supabase no Frontend (Netlify)

## 1. Instalar Supabase Client

```bash
npm install @supabase/supabase-js
```

## 2. Criar arquivo de configuração

Crie um arquivo `src/lib/supabaseClient.js` (ou .ts):

```javascript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

## 3. Configurar variáveis de ambiente no Netlify

No Netlify, adicione essas variáveis em **Site settings → Environment → Environment variables**:

```
VITE_SUPABASE_URL = sua-url-do-supabase
VITE_SUPABASE_ANON_KEY = sua-chave-anon
```

**Para pegar essas informações:**
1. Vá para https://app.supabase.com
2. Clique no seu projeto
3. Vá em **Settings → API**
4. Copie a URL e a chave `anon`

---

## 4. Usar no seu Frontend

### Exemplo 1: Salvar uma análise de solo

```javascript
import { supabase } from '@/lib/supabaseClient'

async function salvarAnalise(dados) {
  const { data, error } = await supabase
    .from('soil_analysis')
    .insert([{
      user_email: 'usuario@email.com',
      field_name: dados.fieldName,
      crop_type: dados.cropType,
      pH: dados.pH,
      nitrogen: dados.nitrogen,
      phosphorus: dados.phosphorus,
      potassium: dados.potassium,
      moisture: dados.moisture,
      organic_matter: dados.organicMatter,
      notes: dados.notes,
      status: 'pending'
    }])

  if (error) {
    console.error('Erro ao salvar:', error)
    return null
  }
  
  console.log('Análise salva:', data)
  return data
}
```

### Exemplo 2: Buscar análises do usuário

```javascript
async function buscarAnalises(userEmail) {
  const { data, error } = await supabase
    .from('soil_analysis')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar:', error)
    return []
  }

  return data
}
```

### Exemplo 3: Atualizar uma análise

```javascript
async function atualizarAnalise(id, dados) {
  const { data, error } = await supabase
    .from('soil_analysis')
    .update({
      status: 'completed',
      recommendations: dados.recommendations,
      admin_comments: dados.comments
    })
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar:', error)
    return null
  }

  return data
}
```

### Exemplo 4: Deletar uma análise

```javascript
async function deletarAnalise(id) {
  const { error } = await supabase
    .from('soil_analysis')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar:', error)
    return false
  }

  return true
}
```

### Exemplo 5: Com React Query (recomendado)

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Hook para buscar análises
export function useSoilAnalyses(userEmail) {
  return useQuery({
    queryKey: ['soil_analyses', userEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soil_analysis')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!userEmail
  })
}

// Hook para criar análise
export function useCreateSoilAnalysis() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (novaAnalise) => {
      const { data, error } = await supabase
        .from('soil_analysis')
        .insert([novaAnalise])
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['soil_analyses', variables.user_email]
      })
    }
  })
}

// Usar nos componentes
function MeuComponente() {
  const userEmail = 'usuario@email.com'
  const { data: analyses, isLoading } = useSoilAnalyses(userEmail)
  const createAnalysis = useCreateSoilAnalysis()

  const handleSave = async (dados) => {
    await createAnalysis.mutateAsync({
      user_email: userEmail,
      ...dados
    })
  }

  if (isLoading) return <div>Carregando...</div>

  return (
    <div>
      {analyses?.map(analysis => (
        <div key={analysis.id}>
          {analysis.field_name} - pH: {analysis.pH}
        </div>
      ))}
    </div>
  )
}
```

---

## 5. Forma Completa (Formulário + Envio)

```javascript
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function SoilAnalysisForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fieldName: '',
    cropType: '',
    pH: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    moisture: '',
    organicMatter: '',
    notes: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('soil_analysis')
        .insert([{
          user_email: 'usuario@email.com', // Pegar do auth
          field_name: formData.fieldName,
          crop_type: formData.cropType,
          pH: parseFloat(formData.pH),
          nitrogen: parseFloat(formData.nitrogen),
          phosphorus: parseFloat(formData.phosphorus),
          potassium: parseFloat(formData.potassium),
          moisture: parseFloat(formData.moisture),
          organic_matter: parseFloat(formData.organicMatter),
          notes: formData.notes,
          status: 'pending'
        }])

      if (error) throw error

      alert('Análise salva com sucesso!')
      setFormData({
        fieldName: '',
        cropType: '',
        pH: '',
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        moisture: '',
        organicMatter: '',
        notes: ''
      })
    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="fieldName"
        placeholder="Nome do Campo"
        value={formData.fieldName}
        onChange={handleChange}
        required
      />
      
      <input
        type="text"
        name="cropType"
        placeholder="Tipo de Cultura"
        value={formData.cropType}
        onChange={handleChange}
        required
      />
      
      <input
        type="number"
        name="pH"
        placeholder="pH"
        step="0.1"
        value={formData.pH}
        onChange={handleChange}
      />
      
      <input
        type="number"
        name="nitrogen"
        placeholder="Nitrogênio (mg/kg)"
        step="0.01"
        value={formData.nitrogen}
        onChange={handleChange}
      />
      
      <input
        type="number"
        name="phosphorus"
        placeholder="Fósforo (mg/kg)"
        step="0.01"
        value={formData.phosphorus}
        onChange={handleChange}
      />
      
      <input
        type="number"
        name="potassium"
        placeholder="Potássio (mg/kg)"
        step="0.01"
        value={formData.potassium}
        onChange={handleChange}
      />
      
      <input
        type="number"
        name="moisture"
        placeholder="Umidade (%)"
        step="0.1"
        value={formData.moisture}
        onChange={handleChange}
      />
      
      <input
        type="number"
        name="organicMatter"
        placeholder="Matéria Orgânica (%)"
        step="0.1"
        value={formData.organicMatter}
        onChange={handleChange}
      />
      
      <textarea
        name="notes"
        placeholder="Observações"
        value={formData.notes}
        onChange={handleChange}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Análise'}
      </button>
    </form>
  )
}
```

---

## 6. Passo a Passo Rápido

1. **Instalar**: `npm install @supabase/supabase-js`
2. **Criar cliente** em `src/lib/supabaseClient.js`
3. **Adicionar variáveis** no Netlify (Site → Settings → Environment)
4. **Copiar exemplo** acima no seu componente
5. **Testar** no formulário

Pronto! Seu frontend no Netlify agora está conectado ao Supabase!
