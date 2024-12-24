FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 애플리케이션 소스 코드 복사
COPY . .

# 환경변수로 모드 설정 및 빌드
# ARG NODE_ENV=development
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN npm run build -- --mode ${NODE_ENV}

# 빌드된 정적 파일이 server.js에서 사용되도록 설정
ENV BUILD_PATH=/app/dist

# 컨테이너 실행 시 기본 명령
EXPOSE 3000
CMD ["node", "server.js"]
