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

export const databaseProviders = [
  {
    provide: DB_PROVIDER,
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: DB_HOST,
        port: DB_PORT,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME,
        entities: [
          __dirname + '/../models/*.model{.ts,.js}', // Auto-load entities
        ],
        synchronize: NODE_ENV !== 'production', // Auto-create tables in dev
      });

      return dataSource.initialize();
    },
  },
];
