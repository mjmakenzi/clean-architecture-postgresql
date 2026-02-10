import { DataSource } from 'typeorm';
import {
  DB_PROVIDER,
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  NODE_ENV,
} from '@constants';
import { ProfileEntity } from '@infrastructure/entities/profile.entity';
import { AuthEntity } from '@infrastructure/entities/auth.entity';

export const databaseProviders = [
  {
    provide: DB_PROVIDER,
    useFactory: async (): Promise<DataSource> => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: DB_HOST,
        port: DB_PORT,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME,
        entities: [AuthEntity, ProfileEntity],
        synchronize: NODE_ENV !== 'production', // Auto-create tables in dev
        logging: process.env.NODE_ENV === 'development',
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      });

      return dataSource.initialize();
    },
  },
];
