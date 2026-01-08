import { count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertSubscriber, users, subscribers } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all subscribers with optional filtering
 */
export async function getSubscribers(filters?: {
  status?: "active" | "unsubscribed" | "bounced";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(subscribers) as any;

  if (filters?.status) {
    query = query.where(eq(subscribers.status, filters.status));
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  return await query.orderBy(desc(subscribers.createdAt));
}

/**
 * Get subscriber count by status
 */
export async function getSubscriberStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, unsubscribed: 0, bounced: 0 };

  const result = await db
    .select({
      status: subscribers.status,
      count: count(),
    })
    .from(subscribers)
    .groupBy(subscribers.status);

  const stats = { total: 0, active: 0, unsubscribed: 0, bounced: 0 };
  result.forEach((row) => {
    stats.total += row.count;
    if (row.status === "active") stats.active = row.count;
    if (row.status === "unsubscribed") stats.unsubscribed = row.count;
    if (row.status === "bounced") stats.bounced = row.count;
  });

  return stats;
}

/**
 * Create or update a subscriber
 */
export async function upsertSubscriber(data: InsertSubscriber) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (!data.email) throw new Error("Email is required");

  try {
    await db
      .insert(subscribers)
      .values(data)
      .onDuplicateKeyUpdate({
        set: {
          age: data.age,
          status: data.status || "active",
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert subscriber:", error);
    throw error;
  }
}

/**
 * Delete a subscriber
 */
export async function deleteSubscriber(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(subscribers).where(eq(subscribers.email, email));
  } catch (error) {
    console.error("[Database] Failed to delete subscriber:", error);
    throw error;
  }
}

/**
 * Get subscriber by email
 */
export async function getSubscriberByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
