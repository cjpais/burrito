# 1. Build server binary
FROM oven/bun:slim as build-stage

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /dist

ENV FLUENTFFMPEG_COV=
COPY . .
COPY config.example.json config.json

RUN ls -la

RUN bun install
RUN bun build ./index.ts --outfile server --compile

# 2. Run server
FROM oven/bun:slim

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV FLUENTFFMPEG_COV=

COPY --from=build-stage /dist/server ./server


CMD ["./server"]
