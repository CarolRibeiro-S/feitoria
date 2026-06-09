-- Rodar no Supabase Dashboard → SQL Editor

-- 1. Adiciona coluna whatsapp
ALTER TABLE produtoras ADD COLUMN IF NOT EXISTS whatsapp text;

-- 2. Atualiza Ju Fiche com whatsapp
UPDATE produtoras
SET whatsapp = '556199970204'
WHERE nome_marca = 'Ju Fiche — Cozinha Artesanal';
