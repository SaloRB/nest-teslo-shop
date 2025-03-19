import { User } from '../entities/user.entity';

export interface AuthRequest extends Request {
  user: User;
  rawHeaders: string[];
}
