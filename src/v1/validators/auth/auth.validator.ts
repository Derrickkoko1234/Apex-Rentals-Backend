import Joi from "joi";
import { RoleEnum } from "../../enums/role.enum";

// Sample:
// {
//   "firstName": "Derrick",
//   "lastName": "Koko",
//   "username": "derrickkoko",
//   "email": "kokoderrick3@gmail.com",
//   "phone": "09020437065",
//   "packageName": "Enterprise Essentials"
// }

export const registerValidator = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string().required().valid(RoleEnum.USER, RoleEnum.LANDLORD),
});

// Sample:
// {
//     "name": "Binary Brawlers",
//     "email": "kokoderrick3@gmail.com",
//     "industry": "Tech",
//     "address": "15, Some street",
//     "phone": "+2349012345678",
//     "staffNumberRange": {
//         "min": 1,
//         "max": 5
//     }
// }

