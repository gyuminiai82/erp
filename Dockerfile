FROM node:20-alpine

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 복사 (docker-compose의 볼륨 마운트로 인해 개발 환경에서는 오버라이드 됨)
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
