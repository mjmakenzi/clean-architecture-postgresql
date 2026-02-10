FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json npm-lock.yaml ./

RUN corepack enable \
  && npm install --frozen-lockfile

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/main.js"] 