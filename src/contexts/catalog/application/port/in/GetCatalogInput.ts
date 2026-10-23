export interface GetCatalogInput {
    execute(request: GetCatalogInput.Request): GetCatalogInput.Response
}

export namespace GetCatalogInput {
    export const Token = Symbol('GetCatalogInput')

    export class Request {constructor(public typeId?: string, public restaurantId?: string) {}}
export interface CatalogSnapshot {typeId: string; typeName: string; restaurants: {id: string; name: string; categories: {id: string; name: string}[]; products: {id: string; name: string; category: string; unit: string; price: number; emoji?: string}[]; valuationNote: string; sources: string[]}[]}

    export class Response {
        constructor(public products: {
            id: string; name: string; category: string; level: string; price: number; unit?: string
        }[], public catalog?: CatalogSnapshot, public types?: {id: string; name: string; emoji: string}[]) {}
    }
}
