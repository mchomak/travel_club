#!/usr/bin/env bash
set -eu

: "${WEBSITE_APP_DB_PASSWORD:?WEBSITE_APP_DB_PASSWORD is required}"
: "${WEBSITE_MIGRATOR_DB_PASSWORD:?WEBSITE_MIGRATOR_DB_PASSWORD is required}"
: "${WEBSITE_DATABASE_NAME:=travel_club_website}"
export WEBSITE_DATABASE_NAME

psql --username "$POSTGRES_USER" --dbname postgres <<'SQL'
\getenv app_password WEBSITE_APP_DB_PASSWORD
\getenv migrator_password WEBSITE_MIGRATOR_DB_PASSWORD
\getenv database_name WEBSITE_DATABASE_NAME
CREATE ROLE travel_club_website_migrator LOGIN PASSWORD :'migrator_password';
CREATE ROLE travel_club_website_app LOGIN PASSWORD :'app_password';
CREATE DATABASE :"database_name" OWNER travel_club_website_migrator;
REVOKE ALL ON DATABASE :"database_name" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"database_name" TO travel_club_website_app;
SQL

psql --username "$POSTGRES_USER" --dbname "$WEBSITE_DATABASE_NAME" <<'SQL'
ALTER SCHEMA public OWNER TO travel_club_website_migrator;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO travel_club_website_app;
SQL
