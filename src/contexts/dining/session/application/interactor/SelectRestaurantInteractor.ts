import type {SelectRestaurantInput} from '../port/in/SelectRestaurantInput'
import type {DiningReader} from '../port/out/DiningReader'
import type {DiningWriter} from '../port/out/DiningWriter'
import type {DiningOutput} from '../port/out/DiningOutput'
export class SelectRestaurantInteractor implements SelectRestaurantInput {
 constructor(private readonly reader: DiningReader, private readonly writer: DiningWriter, private readonly output: DiningOutput) {}
 execute(request: SelectRestaurantInput.Request) {const next=this.reader.load().selectRestaurant(request.restaurantId); this.writer.save(next); this.output.present(next)}
}
