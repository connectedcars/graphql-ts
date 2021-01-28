ARG NODE_VERSION=12.x

FROM gcr.io/connectedcars-staging/node-builder.master:$NODE_VERSION as builder

ARG NPM_TOKEN
ARG SSH_KEY_PASSWORD

WORKDIR /app

USER builder

# Copy application code.
COPY --chown=builder:builder . /app

RUN npm install

RUN npm run build

# Run ci checks
RUN npm run ci-audit

RUN npm run ci-jest

RUN npm run ci-eslint

RUN npm test
