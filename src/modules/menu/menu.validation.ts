import { body } from 'express-validator';

export const menuValidation = [
    body('name')
        .isString()
        .withMessage('Name must be a string')
        .notEmpty()
        .withMessage('Name is required'),
    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),
    body('price')
        .isNumeric()
        .withMessage('Price must be a number')
        .notEmpty()
        .withMessage('Price is required'),
    body('category')
        .isString()
        .withMessage('Category must be a string')
        .notEmpty()
        .withMessage('Category is required'),
];