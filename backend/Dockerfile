FROM node:18.8.0
RUN apt-get update && apt-get install -y vim && apt-get install -y postgresql
WORKDIR /usr/src/app
COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app
COPY .npmrc /usr/src/app
RUN npm install -g nodemon \
    && npm install -g sequelize-cli \
    && npm install -g jest \
    && yarn install --frozen-lockfile
COPY . /usr/src/app
EXPOSE 8990
CMD ./start.sh
# CMD sleep 600000
