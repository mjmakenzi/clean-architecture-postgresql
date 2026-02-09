import { Inject, Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, IsNull, Repository } from 'typeorm';
import { DB_PROVIDER } from '@constants';
import { IAuthRepository } from '@domain/interfaces/repositories/auth-repository.interface';
import { AuthUser } from '@domain/entities/Auth';
import { AuthEntity } from '@infrastructure/models/auth.model';
import * as crypto from 'crypto';
import { EMAIL_BLIND_INDEX_SECRET } from '@constants';

@Injectable()
export class AuthRepository implements IAuthRepository {
  private readonly repository: Repository<AuthEntity>;

  constructor(@Inject(DB_PROVIDER) dataSource: DataSource) {
    this.repository = dataSource.getRepository(AuthEntity);
  }

  async create(authData: Partial<AuthUser>): Promise<AuthUser> {
    const entity = this.repository.create(authData as DeepPartial<AuthEntity>); // Creates instance
    const saved = await this.repository.save(entity); // Hooks run here (password hash, blind index)
    return saved as unknown as AuthUser;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    // Search by blind index hash
    const emailHash = crypto
      .createHmac('sha256', EMAIL_BLIND_INDEX_SECRET!)
      .update(email)
      .digest('hex');

    const found = await this.repository.findOneBy({
      emailHash,
      deletedAt: IsNull(),
    });
    return found as unknown as AuthUser;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const found = await this.repository.findOneBy({ id, deletedAt: IsNull() });
    return found as unknown as AuthUser;
  }

  async findByGoogleId(googleId: string): Promise<AuthUser | null> {
    const found = await this.repository.findOneBy({
      googleId,
      deletedAt: IsNull(),
    });
    return found as unknown as AuthUser;
  }

  async update(id: string, authData: Partial<AuthUser>): Promise<AuthUser> {
    // TypeORM update is different: preload checks existence + merges
    const existing = await this.repository.findOneBy({ id });
    if (!existing) throw new Error('User not found');

    const updated = this.repository.merge(
      existing,
      authData as DeepPartial<AuthEntity>,
    );
    const saved = await this.repository.save(updated);
    return saved as unknown as AuthUser;
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { deletedAt: new Date() });
  }

  async removeRefreshToken(id: string): Promise<void> {
    await this.repository.update(id, { currentHashedRefreshToken: undefined }); // or null
  }
}
