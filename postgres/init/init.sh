#!/usr/bin/env bash
set -e

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -h postgres <<-EOSQL
    CREATE DATABASE game_changer;
    CREATE DATABASE "gc-orchestration";
EOSQL
