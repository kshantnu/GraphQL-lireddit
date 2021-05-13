import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import {Request, Response} from "express";
import session from "express-session";

declare module "express-session" {
    interface SessionData {
      userId?: number;
    }
  }


export type MyContext = {
    em: EntityManager<IDatabaseDriver<Connection>>;
    request: Request & {session: session.SessionData };
    response: Response;
}