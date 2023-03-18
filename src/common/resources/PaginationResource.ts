interface PaginationParams<T> {
    data: T[]
    total: number
    take: number
    skip?: number
    cursor?: number
}

interface Meta {
    total: number
    take: number
    skip?: number
    cursor?: number
}

export class PaginationResource<T> {
    data: T[]

    meta: Meta

    constructor(params: PaginationParams<T>) {
        this.data = params.data

        this.meta = {
            total: params.total,
            take: params.take,
        }

        if (params.skip) {
            this.meta.skip = params.skip
        }

        if (params.cursor) {
            this.meta.cursor = params.cursor
        }
    }
}
