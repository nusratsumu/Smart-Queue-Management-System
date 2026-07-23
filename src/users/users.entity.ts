// src/users/users.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { Tickets } from 'src/tickets/tickets.entity';
import { Counters } from 'src/counters/counters.entity';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role: Role;

  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  // one customer -> many tickets they issued
  @OneToMany(() => Tickets, (ticket) => ticket.user)
  tickets: Tickets[];

  // one staff user -> one counter (nullable, only staff have this)
  @OneToOne(() => Counters, (counter) => counter.staff)
  counter: Counters;
}