# pick a stable Node base (alpine keeps it small)
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
