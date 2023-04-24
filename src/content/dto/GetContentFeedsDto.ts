import { Expose, Transform } from 'class-transformer';

export class GetContentFeedsDto {
    @Expose()
    @Transform(({ value }) => +value, { toClassOnly: true })
    cursor?: number

    @Expose()
    @Transform(({ value }) => +(value ?? 12), { toClassOnly: true })
    take: number
}
