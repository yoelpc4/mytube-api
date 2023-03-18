import { Content, Prisma } from '@prisma/client';
import { Expose } from 'class-transformer';

interface Sort {
    field: keyof Content
    order: Prisma.SortOrder
}

export class GetPublishedContentsDto {
    @Expose()
    cursor?: number

    @Expose()
    sort?: Sort

    @Expose()
    take: number
}
