import { body } from 'express-validator';

export const createUserValidation = [
    body('username')
        .isString()
        .withMessage('Username must be a string')
        .notEmpty()
        .withMessage('Username is required'),
    body('email')
        .isEmail()
        .withMessage('Email must be a valid email address')
        .notEmpty()
        .withMessage('Email is required'),
    body('password')
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .notEmpty()
        .withMessage('Password is required'),
];

export const updateUserValidation = [
    body('username')
        .optional()
        .isString()
        .withMessage('Username must be a string'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email must be a valid email address'),
    body('password')
        .optional()
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];