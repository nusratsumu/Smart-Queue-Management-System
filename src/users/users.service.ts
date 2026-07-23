import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
  ) {}

  async createUser(data: Partial<Users>) {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async getUserByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async getUserById(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: number, data: { fullName?: string; phone?: string }) {
    await this.getUserById(id);
    await this.usersRepo.update(id, data);
    return this.getUserById(id);
  }

  async updatePassword(id: number, hashedPassword: string) {
    await this.usersRepo.update(id, { password: hashedPassword });
  }

  async updateRole(id: number, role: Role) {
    await this.getUserById(id);
    await this.usersRepo.update(id, { role });
    return this.getUserById(id);
  }

  async findAll(search?: string, role?: Role, sort?: 'ASC' | 'DESC') {
    const qb = this.usersRepo.createQueryBuilder('user');
    if (search) {
      qb.andWhere('(user.fullName ILIKE :s OR user.email ILIKE :s)', { s: `%${search}%` });
    }
    if (role) {
      qb.andWhere('user.role = :role', { role });
    }
    qb.orderBy('user.createDate', sort === 'ASC' ? 'ASC' : 'DESC');
    return qb.getMany();
  }
}