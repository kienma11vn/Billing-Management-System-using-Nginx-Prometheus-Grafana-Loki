# Stage 1: Cài đặt dependencies và build dự án
FROM node:20-slim AS build

WORKDIR /app

# Ép NODE_ENV=development để bắt buộc install devDependencies (chứa vite)
ENV NODE_ENV=development

# Copy các file quản lý thư viện
COPY package*.json ./

# Cài đặt thư viện (thêm --force để bỏ qua xung đột platform Windows/Linux)
RUN npm install --force

# Copy toàn bộ mã nguồn và build
COPY . .
RUN npm run build

# Stage 2: Serve bằng Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]