'use strict';
module.exports = (sequelize, DataTypes) => {
	const PORTFOLIO = sequelize.define(
		'portfolio',
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: DataTypes.TEXT,
			},
			description: {
				type: DataTypes.TEXT,
			},
			creator: {
				type: DataTypes.INTEGER,
			},
			user_ids: {
				type: DataTypes.ARRAY(DataTypes.INTEGER),
			},
			admins: {
				type: DataTypes.ARRAY(DataTypes.INTEGER),
			},
			tags: {
				type: DataTypes.ARRAY(DataTypes.TEXT),
			},
			deleted: {
				type: DataTypes.BOOLEAN,
			},
			isPrivate: {
				type: DataTypes.BOOLEAN,
			},
		},
		{
			freezeTableName: true,
			timestamps: false,
			tableName: 'portfolio',
		}
	);
	return PORTFOLIO;
};
