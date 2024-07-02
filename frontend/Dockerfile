# ----- Build Stage -----
FROM node:18.17.1 AS build

# Set working dir in build stage container
WORKDIR /src

# Copys package files and install dependencies
COPY package*.json ./
RUN npm install

# Copys rest of code to build container
COPY . .

RUN npm run build

# ----- Production Stage -----
FROM node:18.17.1

# Set working directory in prod stage container
WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build /src/node_modules ./node_modules/
COPY --from=build /src/package*.json ./
COPY --from=build /src/ ./

# Expose the port the app runs on
EXPOSE 4173

# Define the command to run your application
CMD ["npm", "run", "preview"]