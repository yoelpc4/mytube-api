import { Content, Prisma } from '@prisma/client'
import { Expose, Transform } from 'class-transformer'

interface Sort {
    field: keyof Content
    order: Prisma.SortOrder
}

export class GetContentsDto {
    @Expose()
    sort?: Sort

    @Expose()
    @Transform(({ value }) => +(value ?? 0), { toClassOnly: true })
    skip: number

    @Expose()
    @Transform(({ value }) => +(value ?? 10), { toClassOnly: true })
    take: number
}
