FROM node:22-alpine

WORKDIR /app

# Copy project files
COPY . .

# Set default port
ENV PORT=3001
EXPOSE 3001

# Run the server
CMD ["node", "server.js"]
