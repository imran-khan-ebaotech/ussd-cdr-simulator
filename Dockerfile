FROM node:10-alpine as builder

WORKDIR /build
COPY . .

## Instlal dependencies and Build the angular app in production mode
RUN npm ci && npm run ng build -- --prod --output-path=dist
RUN mkdir /ng-app && mv ./dist /ng-app
RUN cd backend && npm ci && cp -R . /ng-app

WORKDIR /ng-app

ENV PORT=80
ENV NODE_ENV=production
EXPOSE 80

RUN chmod +x /ng-app/entrypoint.sh
CMD ["./entrypoint.sh"]