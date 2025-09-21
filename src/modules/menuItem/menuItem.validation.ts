import { body } from "express-validator";

export const menuItemValidation = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .notEmpty()
    .withMessage("Name is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .notEmpty()
    .withMessage("Price is required"),
  body("categoryId")
    .isString()
    .withMessage("Category ID must be a string")
    .notEmpty()
    .withMessage("Category ID is required"),
];
