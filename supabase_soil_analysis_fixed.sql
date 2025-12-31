-- ============================================
-- Tabela de Análise de Solo - VERSÃO CORRIGIDA
-- Com todas as colunas que o formulário usa
-- ============================================

-- Primeiro, dropar a tabela antiga (se existir)
DROP TABLE IF EXISTS soil_analysis CASCADE;

-- Criar tabela de análise de solo com TODAS as colunas necessárias
CREATE TABLE soil_analysis (
  id BIGSERIAL PRIMARY KEY,
  
  -- Dados do Produtor
  producer_name TEXT NOT NULL,
  producer_contact TEXT NOT NULL,
  producer_address TEXT NOT NULL,
  property_name TEXT NOT NULL,
  city TEXT NOT NULL,
  
  -- Campo
  field_name TEXT NOT NULL,
  field_location TEXT,
  
  -- Cultura
  crop_type TEXT NOT NULL,
  crop_age TEXT,
  production_type TEXT,
  spacing TEXT,
  area TEXT,
  
  -- Coleta
  sample_depth TEXT,
  collected_by TEXT,
  moon_phase TEXT,
  relative_humidity NUMERIC(5, 2),
  precipitation NUMERIC(8, 2),
  
  -- Análise de Nutrientes (em mg/kg ou ppm)
  pH NUMERIC(4, 2),
  nitrogen NUMERIC(8, 2),
  phosphorus NUMERIC(8, 2),
  potassium NUMERIC(8, 2),
  calcium NUMERIC(8, 2),
  magnesium NUMERIC(8, 2),
  sulfur NUMERIC(8, 2),
  iron NUMERIC(8, 2),
  manganese NUMERIC(8, 2),
  zinc NUMERIC(8, 2),
  copper NUMERIC(8, 2),
  boron NUMERIC(8, 2),
  
  -- Propriedades do Solo
  moisture NUMERIC(5, 2),
  organic_matter NUMERIC(5, 2),
  electrical_conductivity NUMERIC(8, 2),
  cation_exchange_capacity NUMERIC(8, 2),
  texture TEXT,
  
  -- Upload de Arquivos
  soil_analysis_pdf TEXT,
  attachments TEXT,
  
  -- Classificação e Status
  status TEXT DEFAULT 'pending',
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Notas e Recomendações
  notes TEXT,
  recommendations TEXT,
  admin_comments TEXT,
  admin_file_urls TEXT[],
  
  -- Usuário
  user_email TEXT NOT NULL,
  user_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================

CREATE INDEX idx_soil_analysis_user_email ON soil_analysis(user_email);
CREATE INDEX idx_soil_analysis_user_id ON soil_analysis(user_id);
CREATE INDEX idx_soil_analysis_status ON soil_analysis(status);
CREATE INDEX idx_soil_analysis_created_at ON soil_analysis(created_at DESC);
CREATE INDEX idx_soil_analysis_user_status ON soil_analysis(user_email, status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE soil_analysis ENABLE ROW LEVEL SECURITY;

-- Política para Usuários verem suas próprias análises
CREATE POLICY "Users can view their own soil analyses"
ON soil_analysis FOR SELECT
USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid()::text);

-- Política para Usuários criarem suas próprias análises
CREATE POLICY "Users can create their own soil analyses"
ON soil_analysis FOR INSERT
WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid()::text);

-- Política para Usuários editarem suas próprias análises
CREATE POLICY "Users can update their own soil analyses"
ON soil_analysis FOR UPDATE
USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid()::text);

-- Política para Usuários deletarem suas próprias análises
CREATE POLICY "Users can delete their own soil analyses"
ON soil_analysis FOR DELETE
USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid()::text);

-- ============================================
-- FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_soil_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_soil_analysis_updated_at ON soil_analysis;
CREATE TRIGGER trigger_soil_analysis_updated_at
BEFORE UPDATE ON soil_analysis
FOR EACH ROW
EXECUTE FUNCTION update_soil_analysis_updated_at();
