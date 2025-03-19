import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/auth/entities/user.entity';
import { ProductCreate } from 'src/products/interfaces/product-create.interface';
import { ProductsService } from 'src/products/products.service';

import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async executeSeed() {
    await this.resetDatabase();
    const adminUser = await this.insertNewUsers();
    await this.insertNewProducts(adminUser);
    return 'SEED EXECUTED';
  }

  private async resetDatabase() {
    await this.productsService.deleteAllProducts();

    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async insertNewUsers() {
    const seedUsers = initialData.users;

    const users: User[] = [];

    seedUsers.forEach((user) => users.push(this.userRepository.create(user)));

    await this.userRepository.save(users);

    return users[0];
  }

  private async insertNewProducts(user: User) {
    await this.productsService.deleteAllProducts();

    const products = initialData.products;

    const insertPromises: Promise<ProductCreate | undefined>[] = [];

    for (const product of products) {
      insertPromises.push(this.productsService.create(product, user));
    }

    await Promise.all(insertPromises);

    return true;
  }
}
