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

  @Column({
    type: 'varchar',
    length: 128,
  })
  fullName: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    select: false,
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CUSTOMER,
  })
  role: Role;

  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  // One customer can have many tickets
  @OneToMany(() => Tickets, (ticket) => ticket.user)
  tickets: Tickets[];

  // One staff member can be assigned to one counter
  @OneToOne(() => Counters, (counter) => counter.staff)
  counter: Counters;
}