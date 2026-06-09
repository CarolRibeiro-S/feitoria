-- Rodar no Supabase Dashboard → SQL Editor

-- 1. Adiciona coluna whatsapp (se ainda não existe)
ALTER TABLE produtoras ADD COLUMN IF NOT EXISTS whatsapp text;

-- 2. Atualiza dados da Ju Fiche
UPDATE produtoras SET
  foto_perfil = '/logo_jufiche.jpeg',
  whatsapp = 'https://wa.me/message/RW6MOJ72TNULK1',
  instagram = 'https://www.instagram.com/jufichehs/'
WHERE nome_marca = 'Ju Fiche — Cozinha Artesanal';
