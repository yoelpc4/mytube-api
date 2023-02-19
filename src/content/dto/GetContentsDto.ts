import { Content, Prisma } from '@prisma/client';
import { Expose } from 'class-transformer';

interface Sort {
    field: keyof Content
    order: Prisma.SortOrder
}

export class GetContentsDto {
    @Expose()
    sort?: Sort

    @Expose()
    skip: number

    @Expose()
    take: number
}
