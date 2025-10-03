import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, FileText, X, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Attachment } from '../../types';
import { useFileUpload } from '../../hooks/useFileUpload';

interface FileUploadProps {
  files: Attachment[];
  onFilesChange: (files: Attachment[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  uploadToSupabase?: boolean; // Nova opção para upload direto
  folder?: string; // Pasta no storage (ex: 'vehicles', 'maintenances')
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 2,
  maxSizeMB = 10,
  uploadToSupabase = false,
  folder = '',
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [compressingFiles, setCompressingFiles] = useState<Set<string>>(new Set());
  const [compressionErrorFiles, setCompressionErrorFiles] = useState<Set<string>>(new Set());
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const { uploadFile, progress: uploadProgress } = useFileUpload();

  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.url));
    };
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRawFiles = Array.from(event.target.files || []);
    let currentErrors: string[] = [];
    let filesToProcess: { rawFile: File, attachment: Attachment }[] = [];

    // Garantir que files é sempre um array
    const currentFiles = Array.isArray(files) ? files : [];

    if (currentFiles.length + newRawFiles.length > maxFiles) {
      currentErrors.push(`Você pode anexar no máximo ${maxFiles} arquivos.`);
    } else {
      newRawFiles.forEach(file => {
        if (file.type !== 'application/pdf') {
          currentErrors.push(`O arquivo "${file.name}" não é um PDF.`);
        } else if (file.size > maxSizeMB * 1024 * 1024) {
          currentErrors.push(`O arquivo "${file.name}" excede o limite de ${maxSizeMB}MB.`);
        } else {
          const attachment: Attachment = {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            url: URL.createObjectURL(file),
            file: file,
          };
          filesToProcess.push({ rawFile: file, attachment });
        }
      });
    }

    setErrors(currentErrors);
    if (currentErrors.length > 0) {
      event.target.value = '';
      return;
    }

    const newAttachments = filesToProcess.map(ftp => ftp.attachment);
    const newFileIdsToCompress = newAttachments.map(att => att.id);
    onFilesChange([...currentFiles, ...newAttachments]);
    setCompressingFiles(prev => new Set([...prev, ...newFileIdsToCompress]));

    const compressionPromises = filesToProcess.map(async ({ rawFile, attachment }) => {
      try {
        const arrayBuffer = await rawFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
        const compressedFile = new File([compressedPdfBytes], rawFile.name, { type: 'application/pdf' });

        URL.revokeObjectURL(attachment.url);

        return {
          ...attachment,
          size: compressedFile.size,
          url: URL.createObjectURL(compressedFile),
          file: compressedFile,
        };
      } catch (e) {
        console.error(`Falha ao comprimir o arquivo ${rawFile.name}:`, e);
        setCompressionErrorFiles(prev => new Set(prev).add(attachment.id));
        return attachment;
      }
    });

    const results = await Promise.all(compressionPromises);

    // Atualizar com versões compactadas
    const updatedFiles = [...currentFiles, ...newAttachments].map(f => {
      const compressedVersion = results.find(ca => ca.id === f.id);
      return compressedVersion || f;
    });

    setCompressingFiles(prev => {
        const newSet = new Set(prev);
        newFileIdsToCompress.forEach(id => newSet.delete(id));
        return newSet;
    });

    // Se uploadToSupabase estiver ativo, fazer upload automaticamente
    if (uploadToSupabase) {
      await uploadFilesToSupabase(results, updatedFiles);
    } else {
      onFilesChange(updatedFiles);
    }

    event.target.value = '';
  }, [files, onFilesChange, maxFiles, maxSizeMB, uploadToSupabase, folder]);

  const uploadFilesToSupabase = async (attachments: Attachment[], allFiles: Attachment[]) => {
    const uploadIds = attachments.map(a => a.id);
    setUploadingFiles(prev => new Set([...prev, ...uploadIds]));

    // Usar os arquivos passados como parâmetro
    let currentFiles = [...allFiles];

    for (const attachment of attachments) {
      if (!attachment.file) {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(attachment.id);
          return newSet;
        });
        continue;
      }

      try {
        const result = await uploadFile(attachment.file, {
          folder,
          maxSizeMB
        });

        // Atualizar o arquivo atual com os dados do upload
        currentFiles = currentFiles.map(f =>
          f.id === attachment.id
            ? { ...f, url: result.url, storagePath: result.path }
            : f
        );

        // Atualizar o estado com os arquivos atualizados
        onFilesChange([...currentFiles]);
      } catch (error: any) {
        console.error(`Erro ao fazer upload de ${attachment.name}:`, error);
        setErrors(prev => [...prev, `Erro no upload de ${attachment.name}: ${error.message}`]);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(attachment.id);
          return newSet;
        });
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const currentFiles = Array.isArray(files) ? files : [];
    const fileToRemove = currentFiles.find(file => file.id === fileId);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    const newFiles = currentFiles.filter(file => file.id !== fileId);
    onFilesChange(newFiles);
    setErrors([]);
    setCompressingFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
    setCompressionErrorFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="file-upload"
          className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-border"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-dark-text-secondary">
              <span className="font-semibold">Clique para enviar</span> ou arraste e solte
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-text-secondary">PDF (MAX. {maxSizeMB}MB cada, até {maxFiles} arquivos)</p>
          </div>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={files.length >= maxFiles || compressingFiles.size > 0}
          />
        </label>
        <p className="text-xs text-center text-gray-500 dark:text-dark-text-secondary mt-1">Os arquivos serão compactados automaticamente.</p>
      </div>

      {errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ))}
        </div>
      )}

      {Array.isArray(files) && files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Arquivos Selecionados:</h4>
          {files.map(file => {
            const isCompressing = compressingFiles.has(file.id);
            const isUploading = uploadingFiles.has(file.id);
            const hasError = compressionErrorFiles.has(file.id);
            const isUploaded = uploadToSupabase && file.storagePath && !isUploading;

            return (
              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-dark-bg rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">{file.name}</p>
                    {isCompressing ? (
                      <div className="flex items-center gap-1 text-xs text-accent">
                        <Loader className="h-3 w-3 animate-spin" />
                        <span>Compactando... ({formatBytes(file.size)})</span>
                      </div>
                    ) : isUploading ? (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Loader className="h-3 w-3 animate-spin" />
                        <span>Enviando para nuvem...</span>
                      </div>
                    ) : isUploaded ? (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Enviado ({formatBytes(file.size)})</span>
                      </div>
                    ) : hasError ? (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>Falha na compressão</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-dark-text-secondary">{formatBytes(file.size)}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCompressing || isUploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
