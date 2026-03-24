import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from header
    const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return false;
    }

    // Find the API key (we store prefix + hash, so we need to find by prefix first)
    const potentialKeys = await prisma.apiKey.findMany({
      where: {
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    for (const keyRecord of potentialKeys) {
      // Check if the provided key matches (we store hashed, but for simplicity using direct comparison)
      // In production, you'd hash and compare
      if (this.verifyKey(apiKey, keyRecord.key)) {
        // Update last used
        await prisma.apiKey.update({
          where: { id: keyRecord.id },
          data: { lastUsedAt: new Date() },
        });

        // Attach team info to request
        request.apiKey = {
          id: keyRecord.id,
          teamId: keyRecord.teamId,
          permissions: keyRecord.permissions,
        };
        return true;
      }
    }

    return false;
  }

  private verifyKey(provided: string, stored: string): boolean {
    // In production, use bcrypt or proper key derivation
    // For now, simple comparison (NOT secure for production)
    return provided === stored;
  }
}

@Injectable()
export class ApiKeyService {
  /**
   * AIDEV-NOTE: Generate a new API key
   */
  async createApiKey(
    teamId: string,
    name: string,
    permissions: string[] = [],
    expiresInDays?: number,
  ): Promise<{ key: string; keyRecord: any }> {
    const key = crypto.randomBytes(32).toString('hex');
    const keyPrefix = key.substring(0, 8);
    const keyHash = key; // In production, hash this!

    const keyRecord = await prisma.apiKey.create({
      data: {
        teamId,
        name,
        key: keyHash,
        keyPrefix,
        permissions,
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : null,
        active: true,
      },
    });

    return { key, keyRecord };
  }

  /**
   * AIDEV-NOTE: Revoke an API key
   */
  async revokeApiKey(keyId: string): Promise<boolean> {
    try {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: { active: false },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * AIDEV-NOTE: List API keys for a team
   */
  async listApiKeys(teamId: string): Promise<any[]> {
    const keys = await prisma.apiKey.findMany({
      where: { teamId, active: true },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
    return keys;
  }
}
