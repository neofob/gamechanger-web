#!/usr/bin/env bash

sleep 10 && \
sequelize --options-path ./.sequelize-game_changer --env game_changer db:migrate --url "postgresql://postgres:password@postgres/game_changer" && \
sequelize --options-path ./.sequelize-gc-orchestration --env gc_orchestration db:migrate --url "postgresql://postgres:password@postgres/gc-orchestration" && \
psql -U postgres -h postgres -d game_changer -f /usr/src/app/node_app/init/create_clones.sql && \
psql -U postgres -h postgres -d game_changer -f /usr/src/app/node_app/init/create_admins.sql && \
psql -U postgres -h postgres -d game_changer -f /usr/src/app/node_app/init/pop_mini_RE.sql && \
nodemon --ignore './build/config.js' -x 'sleep 1 && node --trace-warnings --inspect=0.0.0.0:9229 index.js || (sleep 10; touch index.js)'
