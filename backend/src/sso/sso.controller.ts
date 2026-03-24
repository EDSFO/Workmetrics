import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { SsoService, SSO_PROVIDER_TYPES } from './sso.service';

@ApiTags('sso')
@Controller('sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  // ============================================
  // SSO PROVIDER MANAGEMENT (ADMIN)
  // ============================================

  /**
   * AIDEV-NOTE: Create SSO provider
   */
  @Post('providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Create SSO provider configuration' })
  async createProvider(
    @Request() req: any,
    @Body() body: {
      type: string;
      name: string;
      config: any;
      defaultRole?: string;
    },
  ) {
    if (!req.user.teamId) {
      return { success: false, error: 'User is not part of a team' };
    }

    return this.ssoService.createProvider(
      req.user.teamId,
      body.type,
      body.name,
      body.config,
      body.defaultRole,
    );
  }

  /**
   * AIDEV-NOTE: List SSO providers
   */
  @Get('providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'List SSO providers for team' })
  async listProviders(@Request() req: any) {
    if (!req.user.teamId) {
      return { providers: [] };
    }

    const providers = await this.ssoService.getProviders(req.user.teamId);
    return { providers };
  }

  /**
   * AIDEV-NOTE: Update SSO provider
   */
  @Put('providers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Update SSO provider' })
  async updateProvider(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { enabled?: boolean; config?: any; defaultRole?: string },
  ) {
    if (!req.user.teamId) {
      return { success: false, error: 'User is not part of a team' };
    }

    return this.ssoService.updateProvider(id, req.user.teamId, body);
  }

  /**
   * AIDEV-NOTE: Delete SSO provider
   */
  @Delete('providers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Delete SSO provider' })
  async deleteProvider(@Param('id') id: string, @Request() req: any) {
    if (!req.user.teamId) {
      return { success: false };
    }

    const success = await this.ssoService.deleteProvider(id, req.user.teamId);
    return { success };
  }

  // ============================================
  // SAML AUTHENTICATION
  // ============================================

  /**
   * AIDEV-NOTE: Initiate SAML login
   */
  @Get('saml/:providerId/login')
  @ApiOperation({ summary: 'Initiate SAML login' })
  async samlLogin(
    @Param('providerId') providerId: string,
    @Res() res: Response,
  ) {
    const result = this.ssoService.generateSamlRequest(providerId);

    if (!result.success || !result.redirectUrl) {
      return res.status(400).json({ error: result.error });
    }

    return res.redirect(result.redirectUrl);
  }

  /**
   * AIDEV-NOTE: SAML Assertion Consumer Service (callback)
   */
  @Post('saml/:providerId/acs')
  @ApiOperation({ summary: 'SAML Assertion Consumer Service' })
  async samlCallback(
    @Param('providerId') providerId: string,
    @Body() body: { SAMLResponse: string; RelayState?: string },
    @Res() res: Response,
  ) {
    const result = await this.ssoService.handleSamlCallback(
      providerId,
      body.SAMLResponse,
      body.RelayState,
    );

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // In production, issue JWT token and redirect to frontend
    return res.json({
      success: true,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        role: result.user?.role,
      },
      isNewUser: result.isNewUser,
      message: 'SSO authentication successful',
    });
  }

  // ============================================
  // OIDC AUTHENTICATION
  // ============================================

  /**
   * AIDEV-NOTE: Initiate OIDC login
   */
  @Get('oidc/:providerId/login')
  @ApiOperation({ summary: 'Initiate OIDC login' })
  async oidcLogin(
    @Param('providerId') providerId: string,
    @Query('redirect_uri') redirectUri: string,
    @Res() res: Response,
  ) {
    const callbackUri = `${process.env.API_URL}/sso/oidc/${providerId}/callback`;

    const result = await this.ssoService.getOidcAuthUrl(providerId, callbackUri || redirectUri);

    if (!result.success || !result.url) {
      return res.status(400).json({ error: result.error });
    }

    // Store state in session/cookie for validation
    return res.redirect(result.url);
  }

  /**
   * AIDEV-NOTE: OIDC callback
   */
  @Get('oidc/:providerId/callback')
  @ApiOperation({ summary: 'OIDC callback' })
  async oidcCallback(
    @Param('providerId') providerId: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const callbackUri = `${process.env.API_URL}/sso/oidc/${providerId}/callback`;

    const result = await this.ssoService.handleOidcCallback(
      providerId,
      code,
      callbackUri,
    );

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    return res.json({
      success: true,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        role: result.user?.role,
      },
      isNewUser: result.isNewUser,
      message: 'SSO authentication successful',
    });
  }

  // ============================================
  // LDAP AUTHENTICATION
  // ============================================

  /**
   * AIDEV-NOTE: LDAP login
   */
  @Post('ldap/:providerId/login')
  @ApiOperation({ summary: 'Authenticate via LDAP' })
  async ldapLogin(
    @Param('providerId') providerId: string,
    @Body() body: { username: string; password: string },
    @Res() res: Response,
  ) {
    const result = await this.ssoService.authenticateLdap(
      providerId,
      body.username,
      body.password,
    );

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    return res.json({
      success: true,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        role: result.user?.role,
      },
      isNewUser: result.isNewUser,
      message: 'LDAP authentication successful',
    });
  }
}
