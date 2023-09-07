-- \connect game_changer;
CREATE TABLE IF NOT EXISTS admins (
     id SERIAL,
     username text NOT NULL
 );

INSERT INTO admins (username) VALUES ('007') ON CONFLICT DO NOTHING;

INSERT INTO admins ("user_id", username) VALUES (7890123456, 'TEST.TEST.T.7890123456');

INSERT INTO users ("user_id", cn, first_name, last_name, extra_fields, is_super_admin) VALUES (7890123456, 'TEST.TEST.T.7890123456' ,'TEST','TEST', '{"gamechanger": {"is_beta": true, "is_admin": true, "is_internal": true},  "clones_visited": ["gamechanger"]}', TRUE);
CREATE USER postgres_agent;
