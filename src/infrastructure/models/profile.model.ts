import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('profile')
export class ProfileEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ unique: true })
  authId: string;

  @Column()
  name: string;

  @Column()
  lastname: string;

  @Column({ default: 0 })
  age: number;

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
}
