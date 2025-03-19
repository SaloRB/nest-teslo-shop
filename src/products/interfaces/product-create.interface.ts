import { User } from 'src/auth/entities/user.entity';

export interface ProductCreate {
  images: string[];
  id: string;
  title: string;
  price: number;
  description: string;
  slug: string;
  stock: number;
  sizes: string[];
  gender: string;
  tags: string[];
  user: User;
}
