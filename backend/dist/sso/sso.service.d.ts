export declare const SSO_PROVIDER_TYPES: {
    readonly SAML: "saml";
    readonly OIDC: "oidc";
    readonly LDAP: "ldap";
};
export type SsoProviderType = typeof SSO_PROVIDER_TYPES[keyof typeof SSO_PROVIDER_TYPES];
export declare class SsoService {
    createProvider(teamId: string, type: string, name: string, config: any, defaultRole?: string): Promise<{
        success: boolean;
        provider?: any;
        error?: string;
    }>;
    getProviders(teamId: string): Promise<any[]>;
    updateProvider(providerId: string, teamId: string, updates: {
        enabled?: boolean;
        config?: any;
        defaultRole?: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    deleteProvider(providerId: string, teamId: string): Promise<boolean>;
    generateSamlRequest(providerId: string): {
        success: boolean;
        redirectUrl?: string;
        error?: string;
    };
    handleSamlCallback(providerId: string, samlResponse: string, requestId?: string): Promise<{
        success: boolean;
        user?: any;
        isNewUser?: boolean;
        error?: string;
    }>;
    private parseSamlResponse;
    getOidcAuthUrl(providerId: string, redirectUri: string): Promise<{
        success: boolean;
        url?: string;
        state?: string;
        error?: string;
    }>;
    handleOidcCallback(providerId: string, code: string, redirectUri: string): Promise<{
        success: boolean;
        user?: any;
        isNewUser?: boolean;
        error?: string;
    }>;
    authenticateLdap(providerId: string, username: string, password: string): Promise<{
        success: boolean;
        user?: any;
        isNewUser?: boolean;
        error?: string;
    }>;
    private simulateLdapBind;
    private getLdapUserAttributes;
    private findOrCreateSsoUser;
    private hashPassword;
}
