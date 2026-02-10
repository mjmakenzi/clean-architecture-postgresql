import { Role } from '@domain/entities/enums/role.enum';

export class AuthUser {
  readonly id: string;
  email: string;
  password: string;
  googleId?: string;
  appleId?: string;
  role: Role[];
  currentHashedRefreshToken?: string | null;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
