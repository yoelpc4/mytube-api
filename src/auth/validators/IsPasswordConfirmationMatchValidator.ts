import { CustomValidator } from 'express-validator';

export const IsPasswordConfirmationMatchValidator: CustomValidator = (input, { req }) => {
    if (input !== req.body.password) {
        throw new Error("Password confirmation doesn't match")
    }

    return true
}
