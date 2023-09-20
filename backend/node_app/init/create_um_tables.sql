\connect game_changer;

CREATE TABLE public.roles (
    id SERIAL,
    name text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    owner character varying(255),
    application character varying(255),
    product character varying(255),
    sod_id character varying(255),
    description text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL,
    name text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL,
    user_id text NOT NULL,
    cn text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    preferred_name text,
    organization text,
    sub_office text,
    email text,
    phone_number text,
    country text,
    state text,
    city text,
    job_title text,
    extra_fields jsonb,
    is_super_admin boolean DEFAULT false,
    PRIMARY KEY (id)
);

INSERT INTO users ("user_id", cn, first_name, last_name, extra_fields, is_super_admin) VALUES (7890123456, 'TEST.TEST.T.7890123456' ,'TEST','TEST', '{"gamechanger": {"is_beta": true, "is_admin": true, "is_internal": true},  "clones_visited": ["gamechanger"]}', TRUE);

CREATE TABLE IF NOT EXISTS public.roleperms (
    id SERIAL,
    roleid integer NOT NULL,
    permissionid integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (roleid) REFERENCES public.roles (id)
);

CREATE TABLE IF NOT EXISTS public.userroles (
    id SERIAL,
    userid integer NOT NULL,
    roleid integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES public.users (id),
    FOREIGN KEY (roleid) REFERENCES public.roles (id)
);

INSERT INTO gc_users (id, user_id, is_admin, cn) VALUES (123456, '007', 'true', '007') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL,
    username text NOT NULL
);

INSERT INTO admins (id, username) VALUES (123456, 'TEST.TEST.T.7890123456');

--
-- Different DB now
\connect uot;

CREATE TABLE public.roles (
    id SERIAL,
    name text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    owner character varying(255),
    application character varying(255),
    product character varying(255),
    sod_id character varying(255),
    description text,
    PRIMARY KEY (id)
);


CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL,
    name text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.users(
    id SERIAL,
    username text NOT NULL,
    displayname text NOT NULL,
    lastlogin timestamp with time zone,
    sandbox_id integer,
    disabled boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    session_id text,
    email text,
    sub_agency text,
    extra_fields jsonb,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.roleperms (
    id SERIAL,
    roleid integer NOT NULL,
    permissionid integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (roleid) REFERENCES public.roles (id)
);

CREATE TABLE IF NOT EXISTS public.userroles (
    id SERIAL,
    userid integer NOT NULL,
    roleid integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES public.users (id),
    FOREIGN KEY (roleid) REFERENCES public.roles (id)
);

-- truncate table responsibilities;
-- Need to create responsibilities table here...
-- See https://github.com/dod-advana/gamechanger-web/blob/dev/backend/node_app/models/game_changer/responsibilities.js
