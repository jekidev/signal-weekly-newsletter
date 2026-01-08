import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        age: z.number().int().min(13).max(150),
        source: z.string().default("website"),
      }))
      .mutation(async (opts) => {
        const { input } = opts;
        try {
          // Check if already subscribed
          const existing = await db.getSubscriberByEmail(input.email);
          if (existing && existing.status === "active") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email already subscribed",
            });
          }

          // Create or reactivate subscriber
          await db.upsertSubscriber({
            email: input.email,
            age: input.age,
            source: input.source,
            status: "active",
          });

          return { success: true, message: "Successfully subscribed!" };
        } catch (error) {
          console.error("Newsletter subscription error:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to subscribe",
          });
        }
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }
      return await db.getSubscriberStats();
    }),

    listSubscribers: protectedProcedure
      .input(z.object({
        status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }
        return await db.getSubscribers(input);
      }),

    deleteSubscriber: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async (opts) => {
        const { ctx, input } = opts;
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }
        await db.deleteSubscriber(input.email);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
