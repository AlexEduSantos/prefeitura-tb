import { Validate } from 'class-validator';
import { MenuItemDestinationConstraint } from '../validators/is-exactly-one-of.validator';

export function ExactlyOneOf(fields: string[]) {
  return Validate(MenuItemDestinationConstraint, fields);
}
