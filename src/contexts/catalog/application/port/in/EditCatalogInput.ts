export interface EditCatalogInput {execute(request: EditCatalogInput.Request): void}
export namespace EditCatalogInput {
 export const Token = Symbol('EditCatalogInput')
 export interface CatalogSnapshot {typeId: string; typeName: string; restaurants: {id: string; name: string; categories: {id: string; name: string}[]; products: {id: string; name: string; category: string; unit: string; price: number; emoji?: string}[]; valuationNote: string; sources: string[]}[]}
 export class Request {constructor(public catalog: CatalogSnapshot) {}}
}
