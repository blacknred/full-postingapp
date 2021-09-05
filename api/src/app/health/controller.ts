import { Query, Resolver } from "type-graphql";
import { HealthResponseDto } from "./dto";
import { HealthService } from "./service";

@Resolver()
export class HeathController {
  private heathService = new HealthService();

  @Query(() => HealthResponseDto)
  async health() {
    return this.heathService.check();
  }
}