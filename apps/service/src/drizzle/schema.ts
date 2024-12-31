import { integer, pgTable, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as zod from "zod";

export const products = pgTable("products", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  inventory_count: integer("inventory_count").notNull(),
});

export const ProductSchema = createSelectSchema(products);
export const InsertProductSchema = createInsertSchema(products);

export type TProduct = zod.infer<typeof ProductSchema>;
export type TInsertProduct = zod.infer<typeof InsertProductSchema>;

export default { products };