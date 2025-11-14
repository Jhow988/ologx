import type { Trip, Client } from '../types';

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

  try {
    console.log('📧 [emailService] Chamando API serverless...');

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trip,
        client,
        companyName,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('📧 [emailService] Erro da API:', result);
      throw new Error(result.error || 'Erro ao enviar email');
    }

    console.log('📧 [emailService] ✅ Email enviado com sucesso!', result);
  } catch (error) {
    console.error('📧 [emailService] Erro no envio:', error);
    throw error;
  }
}
