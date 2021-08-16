import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({
  path: path.join(
    __dirname,
    "../",
    `.env.${process.env.NODE_ENV || "development"}.local`
  ),
});

const config = {} as __Config__;

config.__port__ = process.env.PORT || 4000;
config.__prod__ = process.env.NODE_ENV === "production";
config.__secret__ = process.env.SECRET || "secret";
config.__clients__ = process.env.CLIENT_HOSTS
  ? process.env.CLIENT_HOSTS.split(/[,; ]+/g)
  : ["http://localhost:80"];

config.graphiql = !config.__prod__;
config.graphql = {
  resolvers: [path.join(__dirname, "/controllers/*.{ts,js}")],
  skipCheck: true,
  validate: false,
};

config.session = {
  key: "sess",
  maxAge: 86400000,
  overwrite: true,
  httpOnly: true,
  signed: false, // unsecure
  rolling: false,
  renew: false,
  secure: config.__prod__,
  sameSite: "lax",
};

config.db = {
  entities: [path.join(__dirname, "models/*.*")],
  migrations: [path.join(__dirname, "../", "migration/*.ts")],
  type: "postgres",
  url: process.env.POSTGRES_URL,
  logging: !config.__prod__,
  synchronize: true,
  useUTC: true,
  // replicas: []
};

config.redis = {
  url: process.env.REDIS_URL,
};

config.logger = {
  appenders: {
    server: { type: "stdout" },
    auth: {
      type: "file",
      filename: path.join(__dirname, "../", "logs", "auth.log"),
    },
    app: {
      type: "file",
      filename: path.join(__dirname, "../", "logs", "requests.log"),
    },
  },
  categories: {
    default: { appenders: ["server", "auth", "app"], level: "trace" },
  },
};

config.email = {
  from: "Bootstrapped graphql server <service@dev.dev>",
  url: process.env.SMTP_URL,
  logger: true,
  debug: false,
};

config.cache = {
  onlineTimespan: process.env.ONLINE_TIMESPAN || 60 * 5,
};

export default config;