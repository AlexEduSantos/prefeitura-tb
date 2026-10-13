import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MenuItemDestination', async: false })
export class MenuItemDestinationConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const [fields] = args.constraints as [string[]];
    const object = args.object as Record<string, any>;

    const filled = fields.filter((field) => {
      const value = object[field];
      return value !== null && value !== undefined && value !== '';
    });

    return filled.length === 1;
  }

  defaultMessage(): string {
    return 'O item de menu deve ter exatamente um destino: pageId, categoryId ou url';
  }
}
