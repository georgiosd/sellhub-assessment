import { integer, pgTable, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as zod from "zod";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  inventory_count: integer("inventory_count").notNull(),
});

export const ProductSchema = createSelectSchema(products);
export const InsertProductSchema = createInsertSchema(products, {
  inventory_count: (schema) => schema.min(0),
});
export const PurchaseProductSchema = InsertProductSchema.pick({
  inventory_count: true,
});

export type TProduct = zod.infer<typeof ProductSchema>;
export type TInsertProduct = zod.infer<typeof InsertProductSchema>;
export type TPurchaseProduct = zod.infer<typeof PurchaseProductSchema>;
