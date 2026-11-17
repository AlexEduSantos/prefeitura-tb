import { Injectable } from '@nestjs/common';
import { generateSecret, generateSync, generateURI, verifySync } from 'otplib';

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
}

@Injectable()
export class TotpService {
  private readonly issuer = process.env.APP_NAME || 'Portal Prefeitura';

  /**
   * 2FA/TOTP é obrigatório para contas com privilégios ADMIN e PUBLISHER.
   */
  requiresTwoFactor(role?: string): boolean {
    return role === 'ADMIN' || role === 'PUBLISHER';
  }

  /**
   * Gera um segredo Base32 e a URI otpauth:// compatível com Google Authenticator/Authy.
   */
  generateSecret(email: string): TotpSetupResult {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: this.issuer,
      label: email,
      secret,
    });
    return { secret, otpauthUrl };
  }

  /**
   * Gera o código TOTP de 6 dígitos atual para um segredo Base32.
   */
  generateToken(secret: string): string {
    return generateSync({ secret });
  }

  /**
   * Valida um código TOTP (tolerância padrão de 1 janela / 30s).
   */
  verifyToken(secret: string, token: string): boolean {
    if (!secret || !token) return false;
    try {
      const result = verifySync({
        secret,
        token: token.trim(),
        epochTolerance: 30,
      });
      return Boolean(result?.valid);
    } catch {
      return false;
    }
  }
}
