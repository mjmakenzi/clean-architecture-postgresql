import { Inject, Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, IsNull, Repository } from 'typeorm';
import { DB_PROVIDER } from '@constants';
import { IProfileRepository } from '@domain/interfaces/repositories/profile-repository.interface';
import { Profile } from '@domain/entities/Profile';
import { ProfileEntity } from '@infrastructure/models/profile.model';
import { Role } from '@domain/entities/enums/role.enum';

@Injectable()
export class ProfileRepository implements IProfileRepository {
  private readonly repository: Repository<ProfileEntity>;

  constructor(@Inject(DB_PROVIDER) dataSource: DataSource) {
    this.repository = dataSource.getRepository(ProfileEntity);
  }

  async create(profile: Partial<Profile>): Promise<Profile> {
    const entity = this.repository.create(
      profile as DeepPartial<ProfileEntity>,
    );
    const saved = await this.repository.save(entity);
    return saved as unknown as Profile;
  }

  async findById(id: string): Promise<Profile | null> {
    const found = await this.repository.findOneBy({ id, deletedAt: IsNull() });
    return found as unknown as Profile;
  }

  async findByAuthId(authId: string): Promise<Profile | null> {
    const found = await this.repository.findOneBy({
      authId,
      deletedAt: IsNull(),
    });
    return found as unknown as Profile;
  }

  async findAll(): Promise<Profile[]> {
    return (await this.repository.findBy({
      deletedAt: IsNull(),
    })) as unknown as Profile[];
  }

  async findByRole(role: Role): Promise<Profile[]> {
    // Complex query: Join Profile -> Auth to check Role
    // For now return empty or implement QueryBuilder if needed
    return [];
  }

  async update(id: string, profile: Partial<Profile>): Promise<Profile> {
    await this.repository.update(id, profile as DeepPartial<ProfileEntity>);
    return this.findById(id) as Promise<Profile>;
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { deletedAt: new Date() });
  }
}
