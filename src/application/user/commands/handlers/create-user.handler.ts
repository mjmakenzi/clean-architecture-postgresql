import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserCommand } from '../create-user.command';
import { IUserRepository } from '../../../../domain/interfaces/repositories/user.repository.interface';
import { User } from '../../../../domain/entities/user.entity';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(command: CreateUserCommand): Promise<void> {
    const { email, password } = command;

    // 1. Check if user already exists (Business Logic)
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 2. Create the Domain Entity
    // (In a real app, you would hash the password here before creating the entity)
    const id = uuidv4();
    const user = new User(id, email, password, new Date());

    // 3. Save using the Repository Interface
    await this.userRepository.create(user);
  }
}
