import { ContentStatus } from '@prisma/client'
import { CustomValidator } from 'express-validator'

export const IsValidStatusValidator: CustomValidator = input => Object.values(ContentStatus).includes(input)
