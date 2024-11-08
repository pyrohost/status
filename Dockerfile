FROM oven/bun:1 AS base
WORKDIR /app

# install dependencies using bun
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# copy source code and build application
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN bun run build

# change ownership of .next directory
RUN chown -R bun:bun .next

FROM base AS runner
WORKDIR /app

# copy node_modules and build from previous stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
USER bun
EXPOSE 3000

# start the application
CMD ["bun", "run", "start"]