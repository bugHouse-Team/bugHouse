FROM node:18-alpine
WORKDIR /app

# Create upload directory
RUN mkdir -p /persistent/uploads/profile-images && \
    chown -R node:node /persistent/uploads

# Copy package files first (better caching)
COPY package*.json ./

# Install ALL dependencies (including multer)
RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

# Copy remaining files
COPY . .

# Create symlink for uploads
RUN ln -s /persistent/uploads /app/uploads

EXPOSE 5000
USER node
CMD ["nodemon", "server.js"]