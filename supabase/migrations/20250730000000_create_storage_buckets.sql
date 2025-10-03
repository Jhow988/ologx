-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB em bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Políticas RLS para o bucket documents

-- Permitir usuários autenticados da mesma empresa fazer upload
CREATE POLICY "Users can upload documents to their company"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Permitir usuários visualizar documentos da própria empresa
CREATE POLICY "Users can view their company documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Permitir usuários atualizar documentos da própria empresa
CREATE POLICY "Users can update their company documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Permitir usuários deletar documentos da própria empresa
CREATE POLICY "Users can delete their company documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);
