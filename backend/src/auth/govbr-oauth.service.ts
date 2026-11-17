import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface GovBrProfile {
  sub: string;
  name?: string;
  email?: string;
  cpf?: string;
}

@Injectable()
export class GovBrOAuthService {
  constructor(private readonly prisma: PrismaService) {}

  private getAuthUrl(): string {
    return (
      process.env.GOVBR_AUTH_URL || 'https://sso.staging.acesso.gov.br/authorize'
    );
  }

  private getTokenUrl(): string {
    return (
      process.env.GOVBR_TOKEN_URL || 'https://sso.staging.acesso.gov.br/token'
    );
  }

  private getUserInfoUrl(): string {
    return (
      process.env.GOVBR_USERINFO_URL ||
      'https://sso.staging.acesso.gov.br/userinfo'
    );
  }

  private getClientId(): string {
    return process.env.GOVBR_CLIENT_ID || '';
  }

  private getClientSecret(): string {
    return process.env.GOVBR_CLIENT_SECRET || '';
  }

  private getRedirectUri(): string {
    return (
      process.env.GOVBR_REDIRECT_URI ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/govbr/callback`
    );
  }

  /**
   * Monta a URL OAuth2/OIDC de redirecionamento para o Login Único Gov.br.
   */
  getAuthorizationUrl(state?: string): {
    url: string;
    state: string;
    nonce: string;
    configured: boolean;
  } {
    const resolvedState = state || randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');
    const clientId = this.getClientId();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: 'openid email profile govbr_confiabilidades',
      redirect_uri: this.getRedirectUri(),
      state: resolvedState,
      nonce,
    });

    return {
      url: `${this.getAuthUrl()}?${params.toString()}`,
      state: resolvedState,
      nonce,
      configured: Boolean(clientId),
    };
  }

  /**
   * Troca o authorization code pelo token e vincula/autentica o servidor no Prisma.
   */
  async authenticateWithCode(code: string) {
    if (!code) {
      throw new UnauthorizedException('Authorization code Gov.br ausente');
    }

    const profile = await this.fetchProfileFromGovBr(code);
    if (!profile.email) {
      throw new UnauthorizedException(
        'Perfil Gov.br não retornou e-mail para vínculo com a conta institucional',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException(
        'Usuário Gov.br não habilitado ou inativo neste portal',
      );
    }

    const { password: _removed, ...safeUser } = user as any;
    return safeUser;
  }

  protected async fetchProfileFromGovBr(code: string): Promise<GovBrProfile> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Integração Gov.br (GOVBR_CLIENT_ID / GOVBR_CLIENT_SECRET) não configurada neste ambiente',
      );
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.getRedirectUri(),
    });

    const tokenRes = await fetch(this.getTokenUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      throw new UnauthorizedException('Falha ao trocar código no Gov.br');
    }

    const tokenJson: any = await tokenRes.json();
    const accessToken = tokenJson?.access_token;
    if (!accessToken) {
      throw new UnauthorizedException('Token de acesso Gov.br não recebido');
    }

    const userRes = await fetch(this.getUserInfoUrl(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      throw new UnauthorizedException('Falha ao consultar userinfo do Gov.br');
    }

    return (await userRes.json()) as GovBrProfile;
  }
}
