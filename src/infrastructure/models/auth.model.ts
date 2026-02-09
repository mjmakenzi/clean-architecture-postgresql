import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Role } from '@domain/entities/enums/role.enum';
import { EMAIL_ENCRYPTION_KEY, EMAIL_BLIND_INDEX_SECRET } from '@constants';

// --- Encryption Helper (Same as before) ---
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const encrypt = (text: string): string => {
  if (!EMAIL_ENCRYPTION_KEY) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(EMAIL_ENCRYPTION_KEY, 'hex'),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text: string): string => {
  if (!EMAIL_ENCRYPTION_KEY) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(EMAIL_ENCRYPTION_KEY, 'hex'),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text;
  }
};

// --- TypeORM Entity ---
@Entity('auth')
export class AuthEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  // Transformer handles encryption/decryption automatically!
  @Column({
    type: 'text',
    transformer: {
      to: (value: string) => encrypt(value), // Encrypt on save
      from: (value: string) => decrypt(value), // Decrypt on read
    },
  })
  email: string;

  @Column({ nullable: true, unique: true })
  emailHash: string; // Blind Index

  @Column({ nullable: true })
  password?: string;

  @Column({
    type: 'enum',
    enum: Role,
    array: true, // Postgres supports arrays
    default: [Role.USER],
  })
  role: Role[];

  @Column({ nullable: true })
  currentHashedRefreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // --- Hooks ---
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      // Simple check to avoid re-hashing already hashed passwords
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  generateBlindIndex() {
    if (this.email && EMAIL_BLIND_INDEX_SECRET) {
      // Note: We use the raw email here because the transformer runs *after* hooks?
      // Actually, in TypeORM, hooks run on the object properties.
      // Since our 'email' property is plain text (decrypted) in the object,
      // we can hash it easily here.
      this.emailHash = crypto
        .createHmac('sha256', EMAIL_BLIND_INDEX_SECRET)
        .update(this.email)
        .digest('hex');
    }
  }
}
