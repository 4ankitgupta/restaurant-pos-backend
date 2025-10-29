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
  body("categoryId")
    .isString()
    .withMessage("Category ID must be a string")
    .notEmpty()
    .withMessage("Category ID is required"),

  // Remove price validation from the main item
  // body("price")...

  // Add validation for the variants array
  body("variants")
    .isArray({ min: 1 })
    .withMessage("At least one menu item variant is required"),
  body("variants.*.name")
    .isString()
    .notEmpty()
    .withMessage("Variant name is required and must be a string"),
  body("variants.*.price")
    .isNumeric()
    .withMessage("Variant price is required and must be a number"),
];
