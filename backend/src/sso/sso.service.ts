import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export const SSO_PROVIDER_TYPES = {
  SAML: 'saml',
  OIDC: 'oidc',
  LDAP: 'ldap',
} as const;

export type SsoProviderType = typeof SSO_PROVIDER_TYPES[keyof typeof SSO_PROVIDER_TYPES];

@Injectable()
export class SsoService {
  // ============================================
  // SSO PROVIDER MANAGEMENT
  // ============================================

  /**
   * AIDEV-NOTE: Create SSO provider configuration
   */
  async createProvider(
    teamId: string,
    type: string,
    name: string,
    config: any,
    defaultRole: string = 'MEMBER',
  ): Promise<{ success: boolean; provider?: any; error?: string }> {
    try {
      // Validate config based on type
      if (type === SSO_PROVIDER_TYPES.SAML) {
        if (!config.entityId || !config.ssoUrl || !config.certificate) {
          return { success: false, error: 'SAML requires entityId, ssoUrl, and certificate' };
        }
      } else if (type === SSO_PROVIDER_TYPES.OIDC) {
        if (!config.issuer || !config.clientId || !config.clientSecret) {
          return { success: false, error: 'OIDC requires issuer, clientId, and clientSecret' };
        }
      } else if (type === SSO_PROVIDER_TYPES.LDAP) {
        if (!config.server || !config.bindDn || !config.searchBase) {
          return { success: false, error: 'LDAP requires server, bindDn, and searchBase' };
        }
      }

      const provider = await prisma.ssoProvider.create({
        data: {
          teamId,
          type,
          name,
          config,
          defaultRole,
          enabled: true,
        },
      });

      return { success: true, provider };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AIDEV-NOTE: Get SSO providers for team
   */
  async getProviders(teamId: string): Promise<any[]> {
    return prisma.ssoProvider.findMany({
      where: { teamId },
      select: {
        id: true,
        type: true,
        name: true,
        enabled: true,
        defaultRole: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose config for security
      },
    });
  }

  /**
   * AIDEV-NOTE: Update SSO provider
   */
  async updateProvider(
    providerId: string,
    teamId: string,
    updates: { enabled?: boolean; config?: any; defaultRole?: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await prisma.ssoProvider.findFirst({
        where: { id: providerId, teamId },
      });

      if (!existing) {
        return { success: false, error: 'Provider not found' };
      }

      await prisma.ssoProvider.update({
        where: { id: providerId },
        data: {
          enabled: updates.enabled ?? existing.enabled,
          config: updates.config ?? existing.config,
          defaultRole: updates.defaultRole ?? existing.defaultRole,
        },
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AIDEV-NOTE: Delete SSO provider
   */
  async deleteProvider(providerId: string, teamId: string): Promise<boolean> {
    try {
      await prisma.ssoProvider.delete({
        where: { id: providerId, teamId },
      });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // SAML AUTHENTICATION
  // ============================================

  /**
   * AIDEV-NOTE: Generate SAML AuthnRequest
   */
  generateSamlRequest(providerId: string): { success: boolean; redirectUrl?: string; error?: string } {
    // This is a simplified SAML flow
    // In production, use a library like @node-saml/passport-saml
    return {
      success: true,
      redirectUrl: `/sso/saml/${providerId}/login`,
    };
  }

  /**
   * AIDEV-NOTE: Handle SAML callback (Assertion Consumer Service)
   */
  async handleSamlCallback(
    providerId: string,
    samlResponse: string,
    requestId?: string,
  ): Promise<{
    success: boolean;
    user?: any;
    isNewUser?: boolean;
    error?: string;
  }> {
    try {
      const provider = await prisma.ssoProvider.findUnique({
        where: { id: providerId },
      });

      if (!provider || !provider.enabled) {
        return { success: false, error: 'Provider not found or disabled' };
      }

      // In production, validate SAML response signature
      // For now, parse a mock user from the response
      const userData = this.parseSamlResponse(samlResponse, provider.config);

      if (!userData) {
        return { success: false, error: 'Invalid SAML response' };
      }

      // Find or create user
      const { user, isNewUser } = await this.findOrCreateSsoUser(
        provider.teamId,
        provider.type,
        userData,
        provider.defaultRole,
      );

      return { success: true, user, isNewUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AIDEV-NOTE: Parse SAML response (simplified)
   */
  private parseSamlResponse(response: string, config: any): any | null {
    // In production, properly decode and validate XML signature
    // This is a placeholder implementation
    try {
      // Return mock user data - in production, parse actual SAML assertion
      return {
        email: 'user@example.com',
        name: 'SAML User',
        firstName: 'SAML',
        lastName: 'User',
        groups: [],
      };
    } catch {
      return null;
    }
  }

  // ============================================
  // OIDC AUTHENTICATION
  // ============================================

  /**
   * AIDEV-NOTE: Generate OIDC authorization URL
   */
  async getOidcAuthUrl(providerId: string, redirectUri: string): Promise<{ success: boolean; url?: string; state?: string; error?: string }> {
    try {
      const provider = await prisma.ssoProvider.findUnique({
        where: { id: providerId },
      });

      if (!provider || !provider.enabled || provider.type !== SSO_PROVIDER_TYPES.OIDC) {
        return { success: false, error: 'OIDC provider not found' };
      }

      const state = crypto.randomBytes(16).toString('hex');
      const config = provider.config;

      const authUrl = new URL(`${config.issuer}/authorize`);
      authUrl.searchParams.set('client_id', config.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid profile email');
      authUrl.searchParams.set('state', state);

      return { success: true, url: authUrl.toString(), state };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AIDEV-NOTE: Handle OIDC callback
   */
  async handleOidcCallback(
    providerId: string,
    code: string,
    redirectUri: string,
  ): Promise<{
    success: boolean;
    user?: any;
    isNewUser?: boolean;
    error?: string;
  }> {
    try {
      const provider = await prisma.ssoProvider.findUnique({
        where: { id: providerId },
      });

      if (!provider || !provider.enabled || provider.type !== SSO_PROVIDER_TYPES.OIDC) {
        return { success: false, error: 'OIDC provider not found' };
      }

      const config = provider.config;

      // Exchange code for tokens
      const tokenResponse = await fetch(`${config.issuer}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        return { success: false, error: 'Failed to exchange code for tokens' };
      }

      const tokens = await tokenResponse.json();

      // Get user info
      const userInfoResponse = await fetch(`${config.issuer}/userinfo`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        return { success: false, error: 'Failed to get user info' };
      }

      const userData = await userInfoResponse.json();

      // Find or create user
      const { user, isNewUser } = await this.findOrCreateSsoUser(
        provider.teamId,
        provider.type,
        {
          email: userData.email,
          name: userData.name || `${userData.given_name} ${userData.family_name}`,
          firstName: userData.given_name,
          lastName: userData.family_name,
          groups: userData.groups || [],
        },
        provider.defaultRole,
      );

      return { success: true, user, isNewUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // LDAP AUTHENTICATION
  // ============================================

  /**
   * AIDEV-NOTE: Authenticate user via LDAP
   */
  async authenticateLdap(
    providerId: string,
    username: string,
    password: string,
  ): Promise<{
    success: boolean;
    user?: any;
    isNewUser?: boolean;
    error?: string;
  }> {
    try {
      const provider = await prisma.ssoProvider.findUnique({
        where: { id: providerId },
      });

      if (!provider || !provider.enabled || provider.type !== SSO_PROVIDER_TYPES.LDAP) {
        return { success: false, error: 'LDAP provider not found' };
      }

      const config = provider.config;

      // In production, use ldapjs to bind and search
      // For now, simulate LDAP authentication
      const ldapConnected = await this.simulateLdapBind(config, username, password);

      if (!ldapConnected) {
        return { success: false, error: 'Invalid LDAP credentials' };
      }

      // Get user attributes from LDAP
      const userData = await this.getLdapUserAttributes(config, username);

      if (!userData) {
        return { success: false, error: 'Failed to get LDAP user attributes' };
      }

      // Find or create user
      const { user, isNewUser } = await this.findOrCreateSsoUser(
        provider.teamId,
        provider.type,
        userData,
        provider.defaultRole,
      );

      return { success: true, user, isNewUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AIDEV-NOTE: Simulate LDAP bind (placeholder)
   */
  private async simulateLdapBind(config: any, username: string, password: string): Promise<boolean> {
    // In production, use ldapjs:
    // const client = ldap.createClient({ url: config.server });
    // await client.bind(`cn=${username},${config.bindDn}`, password);
    return password.length > 0; // Placeholder
  }

  /**
   * AIDEV-NOTE: Get LDAP user attributes (placeholder)
   */
  private async getLdapUserAttributes(config: any, username: string): Promise<any | null> {
    // In production, search LDAP and return attributes
    return {
      email: `${username}@${config.domain || 'company.com'}`,
      name: username,
      firstName: username.split('.')[0],
      lastName: username.split('.')[1] || '',
      groups: ['users'],
    };
  }

  // ============================================
  // USER PROVISIONING
  // ============================================

  /**
   * AIDEV-NOTE: Find or create user from SSO
   */
  private async findOrCreateSsoUser(
    teamId: string,
    providerType: string,
    userData: { email: string; name: string; firstName?: string; lastName?: string; groups?: string[] },
    defaultRole: string,
  ): Promise<{ user: any; isNewUser: boolean }> {
    // Find existing user by email
    let user = await prisma.user.findFirst({
      where: { email: userData.email },
    });

    if (user) {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });
      return { user, isNewUser: false };
    }

    // Create new user
    const { hash } = await this.hashPassword(crypto.randomBytes(16).toString('hex'));

    user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: hash,
        role: defaultRole as any,
        teamId,
      },
    });

    return { user, isNewUser: true };
  }

  /**
   * AIDEV-NOTE: Hash password
   */
  private async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { hash: `${salt}:${hash}`, salt };
  }
}
