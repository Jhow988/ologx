import { Resend } from 'resend';
import type { Trip, Client, Attachment } from '../types';

// Inicializar Resend apenas se a chave existir
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
console.log('🔑 [INIT] VITE_RESEND_API_KEY:', resendApiKey ? `${resendApiKey.substring(0, 10)}...` : 'NÃO ENCONTRADA');
console.log('🔑 [INIT] Todas env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendTripAttachmentsParams {
  trip: Trip;
  client: Client;
  companyName: string;
}

export async function sendTripAttachments({
  trip,
  client,
  companyName,
}: SendTripAttachmentsParams): Promise<void> {
  console.log('📧 [emailService] Iniciando sendTripAttachments');
  console.log('📧 [emailService] Cliente:', client.name, client.email);
  console.log('📧 [emailService] Empresa:', companyName);

  if (!trip.attachments || trip.attachments.length === 0) {
    console.error('📧 [emailService] Erro: Nenhum anexo disponível');
    throw new Error('Nenhum anexo disponível para envio');
  }

  console.log('📧 [emailService] Número de anexos:', trip.attachments.length);

  // Preparar lista de anexos
  const attachmentsList = trip.attachments
    .map((att: Attachment, index: number) => {
      const fileSize = (att.size / 1024).toFixed(2);
      return `${index + 1}. ${att.name} (${fileSize} KB)`;
    })
    .join('\n');

  // Preparar links de download
  const attachmentLinks = trip.attachments
    .map((att: Attachment, index: number) => {
      console.log(`📧 [emailService] Anexo ${index + 1}:`, att.name, '- URL:', att.url);
      return `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
          <strong>${index + 1}.</strong> ${att.name}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${(att.size / 1024).toFixed(2)} KB
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <a href="${att.url}"
             style="background-color: #3b82f6; color: white; padding: 6px 12px;
                    text-decoration: none; border-radius: 4px; display: inline-block;
                    font-size: 14px;"
             target="_blank">
            Baixar
          </a>
        </td>
      </tr>`;
    })
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0;">Anexos de Viagem - ${companyName}</h2>
  </div>

  <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <p>Olá <strong>${client.name}</strong>,</p>

    <p>Segue os anexos referentes à viagem realizada:</p>

    <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">Detalhes da Viagem</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280; width: 120px;">Origem:</td>
          <td style="padding: 4px 0; font-weight: bold;">${trip.origin}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Destino:</td>
          <td style="padding: 4px 0; font-weight: bold;">${trip.destination}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Data de Início:</td>
          <td style="padding: 4px 0;">${new Date(trip.startDate).toLocaleDateString('pt-BR')}</td>
        </tr>
        ${trip.endDate ? `
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Data de Término:</td>
          <td style="padding: 4px 0;">${new Date(trip.endDate).toLocaleDateString('pt-BR')}</td>
        </tr>
        ` : ''}
        ${trip.cte ? `
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">CT-e:</td>
          <td style="padding: 4px 0;">${trip.cte}</td>
        </tr>
        ` : ''}
        ${trip.nf ? `
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">NF:</td>
          <td style="padding: 4px 0;">${trip.nf}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <h3 style="color: #1f2937; font-size: 16px;">Documentos Anexados</h3>

    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #e5e7eb; border-radius: 4px;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">Arquivo</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">Tamanho</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">Download</th>
        </tr>
      </thead>
      <tbody>
        ${attachmentLinks}
      </tbody>
    </table>

    <p style="margin-top: 20px;">Para baixar os arquivos, clique nos botões acima.</p>

    ${trip.description ? `
    <div style="margin-top: 20px; padding: 15px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
      <p style="margin: 0; color: #78350f;"><strong>Observações:</strong></p>
      <p style="margin: 8px 0 0 0; color: #92400e;">${trip.description}</p>
    </div>
    ` : ''}
  </div>

  <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">Esta é uma mensagem automática do sistema OLogX.</p>
    <p style="margin: 8px 0 0 0;">Em caso de dúvidas, entre em contato com ${companyName}.</p>
  </div>
</body>
</html>
  `;

  // Verificar se o Resend está configurado
  console.log('📧 [emailService] Verificando configuração Resend...');
  console.log('📧 [emailService] API Key presente:', !!resendApiKey);
  console.log('📧 [emailService] Resend instance:', !!resend);

  if (!resend) {
    console.error('📧 [emailService] ERRO: Resend não configurado!');
    throw new Error('Serviço de email não configurado. Configure a variável VITE_RESEND_API_KEY.');
  }

  try {
    console.log('📧 [emailService] Preparando envio de email...');
    console.log('📧 [emailService] De: OLogX <onboarding@resend.dev>');
    console.log('📧 [emailService] Para:', [client.email]);
    console.log('📧 [emailService] Assunto:', `Anexos de Viagem - ${trip.origin} → ${trip.destination}`);

    const { data, error } = await resend.emails.send({
      from: 'OLogX <onboarding@resend.dev>', // Você deve substituir por seu domínio verificado
      to: [client.email],
      subject: `Anexos de Viagem - ${trip.origin} → ${trip.destination}`,
      html: htmlContent,
    });

    if (error) {
      console.error('📧 [emailService] ERRO da API Resend:', error);
      console.error('📧 [emailService] Tipo do erro:', typeof error);
      console.error('📧 [emailService] Detalhes:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Erro ao enviar email via Resend');
    }

    console.log('📧 [emailService] ✅ Email enviado com sucesso!');
    console.log('📧 [emailService] Response data:', data);
  } catch (error) {
    console.error('📧 [emailService] ERRO no try/catch:', error);
    console.error('📧 [emailService] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    throw error;
  }
}
