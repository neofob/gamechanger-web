\connect game_changer;
INSERT INTO admins (username) VALUES ('007') ON CONFLICT DO NOTHING;
INSERT INTO admins (id, username) VALUES (123456, 'TEST.TEST.T.7890123456');

INSERT INTO api_keys (username, active, "createdAt") VALUES ('007', 'true', '2023-03-30 00:00:00+9') ON CONFLICT DO NOTHING;
INSERT INTO permissions (name, "createdAt", "updatedAt") VALUES ('Gamechanger Admin','2023-03-30 00:00:00+9','2023-03-30 00:00:00+9') ON CONFLICT DO NOTHING;
INSERT INTO roles(name, "createdAt", "updatedAt", owner, application, product, sod_id, description) VALUES ('Gamechanger Admin', '2023-03-30 00:00:00+9', '2023-03-30 00:00:00+9', '007', 'test', 'test','test','test') ON CONFLICT DO NOTHING;
INSERT INTO userroles(userid, roleid, "createdAt", "updatedAt") VALUES ('1', '1', '2023-03-30 00:00:00+9', '2023-03-30 00:00:00+9') ON CONFLICT DO NOTHING;
INSERT INTO roleperms(roleid, permissionid, "createdAt", "updatedAt") VALUES ('1', '1', '2023-03-30 00:00:00+9', '2023-03-30 00:00:00+9') ON CONFLICT DO NOTHING;
-- INSERT INTO gc_users (user_id, "createdAt", is_admin, cn) VALUES ('1', '2023-03-30 00:00:00+9', 'true', '007') ON CONFLICT DO NOTHING;
