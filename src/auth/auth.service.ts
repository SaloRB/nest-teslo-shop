import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto, LoginUserDto } from './dto';

import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);

      return { ...user, password: undefined };
      // TODO: Retornar el JWT de acceso
    } catch (error) {
      this.handleDbExceptions(error, 'Error creating user');
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        email: true,
        password: true,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
    // TODO: Retornar el JWT de acceso
  }

  private handleDbExceptions(error: any, message?: string): never {
    if (
      error instanceof Error &&
      'code' in error &&
      'detail' in error &&
      error.code === '23505'
    ) {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException(message || 'Unexpected error');
  }
}
