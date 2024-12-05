FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# 환경변수로 모드 설정
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
RUN npm run build -- --mode ${NODE_ENV}

EXPOSE 3000
CMD ["npm", "start"]