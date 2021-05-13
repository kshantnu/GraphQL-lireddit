import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  Query,
  Resolver,
  InputType,
  ObjectType,
} from "type-graphql";
import { MyContext } from "src/types";
import argon2 from "argon2";
import { getConnection } from "typeorm";
import { COOKIE_NAME } from "../constants";

@InputType()
class UserNamePasswordInput {
  @Field()
  userName: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  async users(@Ctx() { em }: MyContext): Promise<User[]> {
    return await em.find(User, {});
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, request }: MyContext): Promise<User | null> {
    if (!request.session.id) {
      return null;
    }
    const user = await em.findOne(User, { id: request.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UserNamePasswordInput,
    @Ctx() { em, request }: MyContext
  ): Promise<UserResponse> {
    if (options.userName.length <= 2) {
        return {
          errors: [
            {
              field: "userName",
              message: "length must be greater than 2",
            },
          ],
        };
      }
  
      if (options.password.length <= 2) {
        return {
          errors: [
            {
              field: "password",
              message: "length must be greater than 2",
            },
          ],
        };
    }
    const hashedPasword = await argon2.hash(options.password);
    // const newUser = em.create(User, {
    //   userName: options.userName,
    //   password: hashedPasword,
    // });
    let user;
    try {
        const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          userName: options.userName,
          password: hashedPasword,
        })
        .returning("*")
        .execute();
        console.log('result: ', result);
      user = result.raw[0];
      
      // commenting to use querybuilder
      // await em.persistAndFlush(newUser);
    } catch (err) {
      console.log("err: ", err);
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }
    request.session.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UserNamePasswordInput,
    @Ctx() { em, request }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { userName: options.userName });
    if (!user) {
      return {
        errors: [
          {
            field: "userName",
            message: "user not found",
          },
        ],
      };
    }
    const password = await argon2.verify(user.password, options.password);
    console.log("password: ", password);
    if (!password) {
      return {
        errors: [
          {
            field: "userName",
            message: "Password not correct",
          },
        ],
      };
    }
    request.session.userId = user.id;
    return {
      user,
    };
  }


  @Mutation(() => Boolean)
  logout(@Ctx() { request, response }: MyContext) {
    return new Promise((resolve) =>
    request.session.destroy((err) => {
      response.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
