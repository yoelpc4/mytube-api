import { Expose, Transform } from 'class-transformer';

export class GetContentFeedsDto {
    @Expose()
    cursor?: number

    @Expose()
    @Transform(({ value }) => +(value ?? 12), { toClassOnly: true })
    take: number
}
