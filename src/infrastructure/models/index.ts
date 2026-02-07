import { Connection } from 'mongoose';
import {
  DB_PROVIDER,
  AUTH_MODEL_PROVIDER,
  PROFILE_MODEL_PROVIDER,
} from '@constants';
import { AuthSchema } from './auth.model';
import { ProfileSchema } from './profile.model';

export const modelProviders = [
  {
    provide: PROFILE_MODEL_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model('Profile', ProfileSchema),
    inject: [DB_PROVIDER],
  },
  {
    provide: AUTH_MODEL_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model('Auth', AuthSchema),
    inject: [DB_PROVIDER],
  },
];
