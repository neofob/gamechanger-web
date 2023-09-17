'use strict';
module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define(
		'user',
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			username: {
				type: DataTypes.TEXT,
				unique: true,
			},
			displayname: {
				type: DataTypes.TEXT,
			},
			lastlogin: {
				type: DataTypes.DATE,
			},
		  sandbox_id: {
				type: DataTypes.INTEGER,
			},
			disabled: {
				type: DataTypes.BOOLEAN,
			},
			createdAt: {
				type: DataTypes.DATE,
			},
			updatedAt: {
				type: DataTypes.DATE,
			},
			session_id: {
				type: DataTypes.TEXT,
			},
			email: {
				type: DataTypes.TEXT,
			},
			sub_agency: {
				type: DataTypes.TEXT,
			},
			extra_fields: {
				type: DataTypes.JSONB,
			},
		},
		{
			freezeTableName: true,
			tableName: 'users',
			timestamps: false,
		}
		// {
		// 	classMethods: {
		// 		associate: (models) => {
		// 			User.hasMany(models.user_app_versions, { foreignKey: 'username' })
		// 			User.hasMany(models.userrole, { foreignKey: 'userid' });
		// 			User.belongsToMany(models.role, { through: models.userrole, foreignKey: 'userid' });
		// 			User.hasMany(models.darq_group_user, { foreignKey: 'user_id' });
		// 			User.belongsToMany(models.darq_group, { through: models.darq_group_user, foreignKey: 'user_id' });
		// 		},
		// 	}
		// }
	);
	return User;
};
