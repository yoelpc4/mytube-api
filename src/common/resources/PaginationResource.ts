interface Meta {
    skip: number
    take: number
    total: number
}

export class PaginationResource<T> {
    data: T[]

    meta: Meta

    constructor(data: T[], skip: number, take: number, total: number) {
        this.data = data

        this.meta = {
            skip,
            take,
            total,
        }
    }
}
