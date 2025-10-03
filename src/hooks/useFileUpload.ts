import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
}

interface UploadResult {
  url: string;
  path: string;
  fullPath: string;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const uploadFile = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    const {
      bucket = 'documents',
      folder = '',
      maxSizeMB = 50
    } = options;

    try {
      setUploading(true);
      setProgress(0);

      // Validar tamanho do arquivo
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      }

      // Validar tipo de arquivo
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use PDF ou imagens (JPG, PNG, WEBP)');
      }

      if (!user?.companyId) {
        throw new Error('Empresa não identificada');
      }

      // Criar nome único para o arquivo
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomStr}.${fileExt}`;

      // Caminho: company_id/folder/filename
      const folderPath = folder ? `${folder}/` : '';
      const filePath = `${user.companyId}/${folderPath}${fileName}`;

      setProgress(30);

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setProgress(80);

      // Obter URL pública (assinada)
      const { data: urlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 ano

      setProgress(100);

      return {
        url: urlData?.signedUrl || '',
        path: data.path,
        fullPath: `${bucket}/${data.path}`
      };

    } catch (error: any) {
      console.error('Erro no upload:', error);
      throw new Error(error.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const deleteFile = async (filePath: string, bucket = 'documents') => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      throw new Error(error.message || 'Erro ao deletar arquivo');
    }
  };

  const getFileUrl = async (
    filePath: string,
    bucket = 'documents',
    expiresIn = 60 * 60 * 24 * 365 // 1 ano
  ) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;

      return data.signedUrl;
    } catch (error: any) {
      console.error('Erro ao obter URL:', error);
      throw new Error(error.message || 'Erro ao obter URL do arquivo');
    }
  };

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
    uploading,
    progress
  };
};
