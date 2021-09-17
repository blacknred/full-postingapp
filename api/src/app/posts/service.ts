import { AppCtx } from "../../typings";
import inputValidation from "../../utils/inputValidation";
import { FieldErrorDto, PaginatedInputDto } from "../../utils/sharedDto";
import { PostInputDto } from "./dto";
import { Post } from "./post.entity";
import { Vote } from "./vote.entity";

export class PostsService {
  async findAll(ctx: AppCtx["ctx"], params: PaginatedInputDto) {
    const lim = Math.min(50, params.limit);
    const extraLim = lim + 1;
    const cur = params.cursor ? new Date(+params.cursor) : new Date();
    const sort = params.sorting === "rating" ? "rating" : "createdAt";

    const posts = await Post.createQueryBuilder("p")
      .leftJoinAndSelect("p.creator", "creator")
      .leftJoinAndMapMany("p.votes", "vote", "v", "v.postId = p.id")
      .where("p.createdAt < :cur", { cur })
      .orderBy(`p.${sort}`, "DESC")
      .limit(extraLim)
      .getMany();

    posts.forEach((post) => post.setComputed(ctx.session?.userId));

    // -- SELECT "p".*, "user".*, SUM("v"."value"), "v1"."value" FROM post "p"
    // -- LEFT JOIN "vote" "v" ON ("v"."postId" = "p"."id")
    // -- LEFT JOIN "vote" "v1" ON ("v1"."postId" = "p"."id" AND "v1"."userId" = 11)
    // -- LEFT JOIN "user" ON ("user"."id"="p"."creatorId")
    // -- WHERE "p"."createdAt" < now()
    // -- GROUP BY "p"."id", "user"."id", "v1"."value"
    // -- ORDER BY "p"."createdAt" DESC
    // -- LIMIT 11
    // --

    // -- SELECT "p"."id" AS "p_id", "p"."title" AS "p_title", "p"."text" AS "p_text", "p"."creatorId" AS "p_creatorId", "p"."createdAt" AS "p_createdAt", "p"."updatedAt" AS "p_updatedAt",
    // -- "creator"."id" AS "creator_id", "creator"."username" AS "creator_username", "creator"."email" AS "creator_email", "creator"."password" AS "creator_password", "creator"."createdAt" AS "creator_createdAt", "creator"."updatedAt" AS "creator_updatedAt",
    // -- "v1"."value" AS "p_user_vote", "v1"."userId" AS "v1_userId", "v1"."postId" AS "v1_postId",
    // -- concat("p"."text", "p"."text", "p"."text") AS "p_text",
    // -- sum("v"."value") AS "p_rating" FROM "post" "p"
    // -- LEFT JOIN "user" "creator" ON "creator"."id"="p"."creatorId"
    // -- LEFT JOIN "vote" "v" ON "v"."postId" = "p"."id"
    // -- LEFT JOIN "vote" "v1" ON "v1"."postId" = "p"."id" and "v1"."userId" = null
    // -- WHERE "p"."createdAt" < now()
    // -- GROUP BY "p"."id", "creator"."id", "v1"."value", "v1"."userId", "v1"."postId"
    // -- ORDER BY "p"."createdAt"
    // -- DESC LIMIT 11

    return {
      items: posts.slice(0, lim),
      hasMore: posts.length === extraLim,
    };
  }

  async findOne(ctx: AppCtx["ctx"], id: number) {
    const post = await Post.createQueryBuilder("p")
      .leftJoinAndSelect("p.creator", "p_creator")
      .leftJoinAndMapMany("p.votes", "vote", "v", "v.postId = p.id")
      .where("p.id = :id", { id })
      .getOne();

    post?.setComputed(ctx.session?.userId);
    return post;
  }

  async create(ctx: AppCtx["ctx"], options: PostInputDto) {
    const errors = inputValidation<PostInputDto, FieldErrorDto>(options);
    if (errors) return { errors };

    const post = await Post.create({
      ...options,
      creatorId: ctx.session!.userId,
    }).save();
    return { data: post };
  }

  async update(ctx: AppCtx["ctx"], id: number, options: PostInputDto) {
    const errors = inputValidation<PostInputDto, FieldErrorDto>(options);
    if (errors) return { errors };

    const post = await Post.findOne(id);
    if (!post) {
      const error = {
        field: "id",
        message: "Post not found",
      };
      return { errors: [error] };
    }

    if (post.creatorId !== ctx.session!.userId) {
      const error = {
        field: "userId",
        message: "Action restricted",
      };
      return { errors: [error] };
    }

    const data = { ...post, ...options };
    Post.update({ id, creatorId: ctx.session!.userId }, data);
    return { data };
  }

  async remove(ctx: AppCtx["ctx"], id: number) {
    const post = await Post.findOne(id);
    if (!post) {
      const error = {
        field: "id",
        message: "Post not found",
      };
      return { errors: [error] };
    }

    if (post.creatorId !== ctx.session!.userId) {
      const error = {
        field: "userId",
        message: "Action restricted",
      };
      return { errors: [error] };
    }

    await Post.delete({ id, creatorId: +ctx.session!.userId });
    return {};
  }

  async createVote(ctx: AppCtx["ctx"], postId: number, value: 1 | -1) {
    const { userId } = ctx.session!;
    const val = value < 0 ? -1 : 1;

    const post = await Post.findOne(postId);
    if (!post) {
      const error = {
        field: "id",
        message: "Post not found",
      };
      return { errors: [error] };
    }

    await Vote.createQueryBuilder("v")
      .insert()
      .values({ postId, userId, value: val })
      .onConflict(`("userId", "postId") DO UPDATE SET "value" = :value`)
      .setParameter("value", value)
      .execute();

    return Vote.createQueryBuilder("v")
      .select("SUM(v.value)", "data")
      .where({ postId })
      .getRawOne();
  }
}
