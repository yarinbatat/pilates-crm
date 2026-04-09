# Stage 1: Building the code
FROM node:20-alpine AS builder
WORKDIR /app

# משתני סביבה "דמה" כדי לעבור את שלב ה-Build Validation
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXT_PUBLIC_SUPABASE_URL="https://dummy.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy"

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# בניית הפרויקט - עכשיו הוא לא יתלונן שחסרים משתנים
RUN npm run build

# Stage 2: Production Environment
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# העתקת הקבצים הרלוונטיים בלבד
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]