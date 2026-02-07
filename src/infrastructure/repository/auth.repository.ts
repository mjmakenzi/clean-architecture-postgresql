import { AUTH_MODEL_PROVIDER } from '@constants';
import { AuthUser } from '@domain/entities/Auth';
import { IAuthRepository } from '@domain/interfaces/repositories/auth-repository.interface';
import { Auth, createBlindIndex } from '@infrastructure/models/auth.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @Inject(AUTH_MODEL_PROVIDER) private readonly authModel: Model<Auth>,
  ) {}

  async create(authData: Partial<AuthUser>): Promise<AuthUser> {
    const newAuth = new this.authModel(authData);
    const savedAuth = await newAuth.save();
    return savedAuth.toObject() as AuthUser;
  }

  findById(id: string, withPassword?: boolean): Promise<AuthUser | null> {
    throw new Error('Method not implemented.');
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const emailHash = createBlindIndex(email);
    const auth = await this.authModel
      .findOne({ emailHash, deletedAt: null })
      .exec();
    return auth ? (auth.toObject() as AuthUser) : null;
  }

  findByGoogleId(googleId: string): Promise<AuthUser | null> {
    throw new Error('Method not implemented.');
  }

  update(id: string, user: Partial<AuthUser>): Promise<AuthUser> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  removeRefreshToken(userId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
