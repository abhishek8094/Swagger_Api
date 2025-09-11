# TODO: Host Node.js Express API on Vercel

## Information Gathered
- Project is a Node.js Express API with MongoDB, using server.js as the main entry point.
- Dependencies include express, mongoose, cors, dotenv, swagger-jsdoc, etc.
- Server listens on PORT from environment or 3001.
- Routes are mounted under /api/* paths.
- Uses MongoDB for database, so environment variables for connection string are needed.
- No existing Vercel configuration found.

## Plan
- [x] Create vercel.json configuration file to specify build settings and routes for the Express app.
- [x] Update server.js to remove app.listen() and make it compatible with Vercel serverless functions.
- [x] Redeploy the project to Vercel with the fixes.
- [ ] Update package.json to add a "vercel-build" script if needed (though not necessary for simple Node.js apps).
- [ ] Provide instructions for setting up Vercel CLI and deploying the project.
- [ ] Ensure environment variables (e.g., MONGO_URI, JWT_SECRET, PORT) are configured in Vercel dashboard.

## Dependent Files to be edited
- vercel.json (new file)
- package.json (optional, if adding build script)

## Followup steps
- [ ] Install Vercel CLI globally using npm install -g vercel.
- [ ] Run vercel login to authenticate.
- [ ] Run vercel to deploy the project.
- [ ] Set environment variables in Vercel dashboard (e.g., MONGO_URI, JWT_SECRET).
- [ ] Test the deployed API endpoints.
- [ ] Update Swagger documentation URL if needed.
