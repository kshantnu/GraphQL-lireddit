import { MikroORM } from "@mikro-orm/core";
import MikroORMConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import "reflect-metadata";
import { UserResolver } from "./resolvers/user";
import cors from "cors"

import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { COOKIE_NAME, __prod__ } from "./constants";
import { MyContext } from "./types";

const main = async () => {
  const orm = await MikroORM.init(MikroORMConfig);
  await orm.getMigrator().up();
  const app = express();
  app.listen(4000, () => {
    console.log("express server has started");
  });
  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();
  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
  }))

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", //csrf
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: "qxcgvfopergcxvdfogpredfklgjkldf",
      resave: false,
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) : MyContext => ({ em: orm.em, request: req, response: res }),
  });
  apolloServer.applyMiddleware({ app, cors: false });
  // const post = orm.em.create(Post, {title: "My first post"});
  // await orm.em.persistAndFlush(post);
};

main().catch((err) => console.log(err));
