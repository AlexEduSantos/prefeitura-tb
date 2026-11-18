import { Injectable, Logger } from '@nestjs/common';

export interface ActivationEmailPayload {
  to: string;
  name: string;
  token: string;
  expiresAt: Date;
}

export interface SentEmailRecord {
  to: string;
  subject: string;
  activationUrl: string;
  expiresAt: Date;
  sentAt: Date;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly sentEmails: SentEmailRecord[] = [];

  buildActivationUrl(token: string): string {
    const frontendUrl = (
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ).replace(/\/$/, '');
    return `${frontendUrl}/ativar-conta?token=${encodeURIComponent(token)}`;
  }

  async sendAccountActivationEmail(
    payload: ActivationEmailPayload,
  ): Promise<SentEmailRecord> {
    const activationUrl = this.buildActivationUrl(payload.token);
    const subject =
      'Ativação de Conta e Definição de Senha — Portal da Prefeitura';
    const html = [
      `<p>Olá, ${payload.name}!</p>`,
      '<p>Sua conta no painel administrativo do Portal da Prefeitura foi cadastrada por um administrador.</p>',
      `<p>Para definir sua senha e ativar seu acesso, clique no link abaixo (uso único, válido até ${payload.expiresAt.toISOString()}):</p>`,
      `<p><a href="${activationUrl}">${activationUrl}</a></p>`,
      '<p>Se este link expirar antes da ativação, entre em contato com o Administrador para solicitar o envio de um novo link.</p>',
    ].join('');

    const record: SentEmailRecord = {
      to: payload.to,
      subject,
      activationUrl,
      expiresAt: payload.expiresAt,
      sentAt: new Date(),
    };

    const webhookUrl = process.env.SMTP_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: payload.to,
            subject,
            html,
            activationUrl,
            expiresAt: payload.expiresAt.toISOString(),
          }),
        });
        if (!res.ok) {
          this.logger.warn(
            `SMTP webhook retornou status ${res.status} ao enviar ativação para ${payload.to}`,
          );
        }
      } catch (err: any) {
        this.logger.error(
          `Erro ao acionar SMTP webhook para ${payload.to}: ${err?.message || err}`,
        );
      }
    } else {
      this.logger.log(
        `[ATIVACAO DE CONTA] Destinatário=${payload.to} | Expira=${payload.expiresAt.toISOString()} | Link=${activationUrl}`,
      );
    }

    this.sentEmails.push(record);
    if (this.sentEmails.length > 100) {
      this.sentEmails.shift();
    }

    return record;
  }

  getRecentSentEmails(): SentEmailRecord[] {
    return [...this.sentEmails];
  }
}
