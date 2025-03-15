import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUuid } from 'uuid';

import { PaginationDto } from 'src/common/dto/pagination.dto';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { Product, ProductImage } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImagesRepository: Repository<ProductImage>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const newProduct = this.productsRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImagesRepository.create({ url: image }),
        ),
      });

      await this.productsRepository.save(newProduct);

      return { ...newProduct, images };
    } catch (error) {
      this.handleDbExceptions(error, 'Error creating product');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productsRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });

    return products.map((product) => ({
      ...product,
      images: product.images?.map((img) => img.url),
    }));
  }

  async findOne(term: string) {
    let product: Product | null;

    if (isUuid(term)) {
      product = await this.productsRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productsRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('LOWER(title)=:title or slug=:slug', {
          title: term.toLowerCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'images')
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product with term '${term}' not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const updatedProduct = await this.productsRepository.preload({
      id,
      ...updateProductDto,
      images: [],
    });

    if (!updatedProduct) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    try {
      await this.productsRepository.save(updatedProduct);
      return updatedProduct;
    } catch (error) {
      this.handleDbExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productsRepository.remove(product);
  }

  async findOnePlain(term: string) {
    const { images = [], ...product } = await this.findOne(term);
    return {
      ...product,
      images: images.map((img) => img.url),
    };
  }

  private handleDbExceptions(error: any, message?: string) {
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
