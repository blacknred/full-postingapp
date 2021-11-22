import Server from "./app";
import { UsersModule } from "./users";
import config, { validateEnv } from "./__shared__/utils/config";

validateEnv();

/** run server */
export default new Server(config, [UsersModule]);