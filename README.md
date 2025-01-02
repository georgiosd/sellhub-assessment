# Sellhub code assessment by @georgiosd

This turbo repo consists of 3 apps:

- `store`: a NextJS storefront app, which is implemented to list the products and simulate a purchase
- `admin`: a NextJS admin dashboard, currently blank
- `service`: the microservice as specified in the assessment brief, using express, drizzle and zod

To run the application, from the root directory:

```
npm install
npm run dev
```

Then visit http://localhost:3001 to view the storefront.

Regarding tests, I opted for integration tests since all functionality was related to the database. The test setup uses jest and testcontainers to bring up a PSQL database.

To run them:

```
cd apps/service
npm test
```
