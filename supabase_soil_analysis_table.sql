-- ============================================
-- Tabela Completa de Análise de Solo para Supabase
-- Otimizada para performance e segurança
-- ============================================

-- Drop table if exists (use com cuidado em produção!)
-- DROP TABLE IF NOT EXISTS soil_analysis;

-- Criar tabela de análise de solo
CREATE TABLE IF NOT EXISTS soil_analysis (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_id TEXT, -- Para integrar com auth do Supabase
  field_name TEXT NOT NULL,
  field_location TEXT, -- Local/coordenadas do campo
  crop_type TEXT NOT NULL,
  
  -- Análise de Nutrientes (em mg/kg ou ppm)
  pH NUMERIC(4, 2),
  nitrogen NUMERIC(8, 2), -- N
  phosphorus NUMERIC(8, 2), -- P
  potassium NUMERIC(8, 2), -- K
  calcium NUMERIC(8, 2),
  magnesium NUMERIC(8, 2),
  sulfur NUMERIC(8, 2),
  iron NUMERIC(8, 2),
  manganese NUMERIC(8, 2),
  zinc NUMERIC(8, 2),
  copper NUMERIC(8, 2),
  boron NUMERIC(8, 2),
  
  -- Propriedades do Solo
  moisture NUMERIC(5, 2), -- Umidade %
  organic_matter NUMERIC(5, 2), -- % de matéria orgânica
  electrical_conductivity NUMERIC(8, 2), -- Condutividade elétrica
  cation_exchange_capacity NUMERIC(8, 2), -- CTC
  texture TEXT, -- Textura (arenoso, argiloso, franco, etc)
  
  -- Classificação e Status
  status TEXT DEFAULT 'pending', -- pending, analyzed, completed, rejected
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Notas e Recomendações
  notes TEXT,
  recommendations TEXT, -- Recomendações de fertilizante/correção
  admin_comments TEXT,
  admin_file_urls TEXT[], -- Array de URLs de arquivos
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT positive_ph CHECK (pH >= 0 AND pH <= 14),
  CONSTRAINT positive_moisture CHECK (moisture >= 0 AND moisture <= 100),
  CONSTRAINT positive_organic_matter CHECK (organic_matter >= 0 AND organic_matter <= 100)
);

-- ============================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================

-- Índice para queries por email do usuário
CREATE INDEX IF NOT EXISTS idx_soil_analysis_user_email 
ON soil_analysis(user_email);

-- Índice para queries por user_id (Supabase Auth)
CREATE INDEX IF NOT EXISTS idx_soil_analysis_user_id 
ON soil_analysis(user_id);

-- Índice para queries por status
CREATE INDEX IF NOT EXISTS idx_soil_analysis_status 
ON soil_analysis(status);

-- Índice para queries por data
CREATE INDEX IF NOT EXISTS idx_soil_analysis_created_at 
ON soil_analysis(created_at DESC);

-- Índice composto para queries de email + status
CREATE INDEX IF NOT EXISTS idx_soil_analysis_user_status 
ON soil_analysis(user_email, status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Proteção de Dados
-- ============================================

-- Ativar RLS na tabela
ALTER TABLE soil_analysis ENABLE ROW LEVEL SECURITY;

-- Política para Usuários verem suas próprias análises
CREATE POLICY "Users can view their own soil analyses"
ON soil_analysis FOR SELECT
USING (user_email = current_user_email() OR user_id = auth.uid()::text);

-- Política para Usuários criarem suas próprias análises
CREATE POLICY "Users can create their own soil analyses"
ON soil_analysis FOR INSERT
WITH CHECK (user_email = current_user_email() OR user_id = auth.uid()::text);

-- Política para Usuários editarem suas próprias análises
CREATE POLICY "Users can update their own soil analyses"
ON soil_analysis FOR UPDATE
USING (user_email = current_user_email() OR user_id = auth.uid()::text);

-- Política para Usuários deletarem suas próprias análises
CREATE POLICY "Users can delete their own soil analyses"
ON soil_analysis FOR DELETE
USING (user_email = current_user_email() OR user_id = auth.uid()::text);

-- ============================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION update_soil_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_soil_analysis_updated_at ON soil_analysis;
CREATE TRIGGER trigger_soil_analysis_updated_at
BEFORE UPDATE ON soil_analysis
FOR EACH ROW
EXECUTE FUNCTION update_soil_analysis_updated_at();

-- ============================================
-- FUNÇÃO HELPER PARA PEGAR DADOS DO USUÁRIO ATUAL
-- ============================================

CREATE OR REPLACE FUNCTION current_user_email() 
RETURNS TEXT AS $$
SELECT 
  CASE 
    WHEN auth.jwt() ->> 'email' IS NOT NULL THEN auth.jwt() ->> 'email'
    ELSE current_setting('app.current_user_email', true)
  END;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- EXEMPLO DE COMO USAR NO FRONTEND (JavaScript/Supabase Client)
-- ============================================
/*
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Inserir análise de solo
const { data, error } = await supabase
  .from('soil_analysis')
  .insert([{
    user_email: 'usuario@email.com',
    user_id: 'uuid-do-usuario',
    field_name: 'Campo A',
    field_location: 'Latitude, Longitude',
    crop_type: 'Milho',
    pH: 6.5,
    nitrogen: 45.00,
    phosphorus: 12.50,
    potassium: 200.00,
    moisture: 28.5,
    organic_matter: 3.2,
    notes: 'Solo em bom estado'
  }])

// Buscar análises do usuário
const { data, error } = await supabase
  .from('soil_analysis')
  .select('*')
  .eq('user_email', 'usuario@email.com')
  .order('created_at', { ascending: false })

// Buscar por status
const { data, error } = await supabase
  .from('soil_analysis')
  .select('*')
  .eq('status', 'completed')
  .eq('user_email', 'usuario@email.com')
*/
