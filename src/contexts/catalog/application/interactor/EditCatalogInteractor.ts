import type {EditCatalogInput} from '../port/in/EditCatalogInput'
import type {CatalogGateway} from '../port/out/CatalogGateway'
import {validateCatalog} from '@/utils/restaurant-catalog'
export class EditCatalogInteractor implements EditCatalogInput {
 constructor(private readonly catalog: CatalogGateway) {}
 execute(request: EditCatalogInput.Request) {this.catalog.save(validateCatalog(request.catalog, true))}
}
