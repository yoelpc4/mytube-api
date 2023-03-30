import { Expose, Transform } from 'class-transformer';

export class GetContentHistoriesDto {
    @Expose()
    cursor?: number

    @Expose()
    @Transform(({ value }) => +(value ?? 10), { toClassOnly: true })
    take: number
}
