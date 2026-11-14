import jwt from 'jsonwebtoken';
import { AuthSession, UserRole } from '@expandemoney/shared-types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-expandemoney-2026-auth';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  merchantId?: string;
  phone?: string;
  email?: string;
}

export class TokenService {
  public static generateSessionToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  public static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  public static createAuthSession(payload: TokenPayload): AuthSession {
    const token = this.generateSessionToken(payload);
    const decoded = jwt.decode(token) as any;
    return {
      user_id: payload.userId,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      merchant_id: payload.merchantId,
      token,
      expires_at: decoded?.exp ? decoded.exp * 1000 : Date.now() + 7 * 24 * 3600 * 1000,
    };
  }
}
