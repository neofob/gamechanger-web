-- \connect game_changer;
CREATE TABLE IF NOT EXISTS admins (
     id SERIAL,
     username text NOT NULL
 );

INSERT INTO admins (username) VALUES ('007') ON CONFLICT DO NOTHING;

INSERT INTO admins ("user_id", username) VALUES (7890123456, 'TEST.TEST.T.7890123456');

CREATE USER postgres_agent;
