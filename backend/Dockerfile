FROM node:14
RUN apt-get update && apt-get install -y vim && apt-get install -y postgresql
WORKDIR /usr/src/app
COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app
COPY .npmrc /usr/src/app

RUN mkdir -p /opt/app-root/src/secrets/
COPY generateCombinedEnv.sh /usr/src/app/
RUN openssl genrsa -out /opt/app-root/src/secrets/tls_key.key 4096
RUN openssl req -x509 -sha256 -days 3650 \
          -key /opt/app-root/src/secrets/tls_key.key \
          -out /opt/app-root/src/secrets/tls_cert.cer \
          -subj "/CN=gamechanger.local" \
          -addext 'subjectAltName=DNS:*.local,DNS:*.com,DNS:*'

RUN cp /opt/app-root/src/secrets/tls_cert.cer /opt/app-root/src/secrets/ca_bundle.pem

RUN npm install -g nodemon \
    && npm install -g sequelize-cli \
    && npm install -g jest \
    && yarn install
#--frozen-lockfile
COPY . /usr/src/app
EXPOSE 8990
RUN openssl rsa -in /opt/app-root/src/secrets/tls_key.key -pubout -out pubkey.key
RUN SAML_CERT=$(cat pubkey.key)
RUN export SAML_CERT
RUN ./generateCombinedEnv.sh > .env
CMD ./start.sh
#CMD sleep 600000
