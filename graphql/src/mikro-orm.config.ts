import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { Options } from '@mikro-orm/core';
import path from "path";
import { User } from "./entities/User";

const mikroORMConfig:Options =  {
    migrations:{
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/
    },
    entities: [Post, User],
    dbName: "lireddit",
    type: "postgresql",
    debug: !__prod__,
    password: "admin",
};

export default mikroORMConfig; 
