import { CustomValidator } from 'express-validator';

export const IsPasswordConfirmationMatchValidator: CustomValidator = (value, { req }) => {
    if (value !== req.body.password) {
        throw new Error("Password confirmation doesn't match")
    }

    return true
}
