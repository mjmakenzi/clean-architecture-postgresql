import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/interfaces/repositories/user.repository.interface';
import { UserDocument } from '../models/user.model';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserDocument.name) private userModel: Model<UserDocument>,
  ) {}

  async create(user: User): Promise<void> {
    const newUser = new this.userModel({
      id: user.id,
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
    });
    await newUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.userModel.findOne({ email }).exec();
    return found ? this.toEntity(found) : null;
  }

  async findById(id: string): Promise<User | null> {
    const found = await this.userModel.findById(id).exec();
    return found ? this.toEntity(found) : null;
  }

  // Helper to convert DB format -> Clean Domain format
  private toEntity(datum: UserDocument): User {
    return new User(datum.id, datum.email, datum.password, datum.createdAt);
  }
}
