import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
} from '@constants';
import { AuthEntity } from '@infrastructure/entities/auth.entity';
import { ProfileEntity } from '@infrastructure/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: DB_HOST,
      port: DB_PORT,
      username: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_NAME,
      entities: [AuthEntity, ProfileEntity],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    }),
    TypeOrmModule.forFeature([AuthEntity, ProfileEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
