\connect game_changer;
INSERT INTO admins (username) VALUES ('007') ON CONFLICT DO NOTHING;
