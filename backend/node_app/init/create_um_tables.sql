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

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users (
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

-- Run Manually after Sequelize scripts run

CREATE TABLE IF NOT EXISTS gc_users (
     id SERIAL,
     user_id text NOT NULL,
     cn text NOT NULL,
     is_beta,
     is_internal,
     is_admin,
     notifications jsonb,
     user_info jsonb,
     submitted_info boolean,
     api_requests INTEGER,
     is_super_admin boolean DEFAULT false,
     PRIMARY KEY (id)
);

-- \connect game_changer;

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
