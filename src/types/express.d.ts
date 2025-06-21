// import { Request } from "express";
// import { IUser } from "../models/user";

interface Admin extends User {
  isAdmin: boolean;
}

interface Request<
  ParamsDictionary = Record<string, string>,
  Body = any,
  Query = any,
  ParsedQs = Record<string, string | string[]>,
  User = any
> extends Express.Request<ParamsDictionary, any, Query, ParsedQs> {
  user?: User;
  admin?: Admin;
}

export { User, Admin, Request };