export interface SelectRestaurantInput {execute(request: SelectRestaurantInput.Request): void}
export namespace SelectRestaurantInput {export const Token = Symbol('SelectRestaurantInput'); export class Request {constructor(public restaurantId: string) {}}}
