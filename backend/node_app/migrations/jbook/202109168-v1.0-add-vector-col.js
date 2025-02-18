'use strict';

module.exports = {
	up: async (queryInterface, _Sequelize) => {
		const { sequelize } = queryInterface;
		return new Promise((resolve, _reject) => {
			try {
				return sequelize
					.query(`ALTER TABLE pdoc ADD COLUMN "P3a-20_Milestone_Desc_search" TSVECTOR;`)
					.then(() => {
						return sequelize.query(`ALTER TABLE pdoc ADD COLUMN "P40-01_LI_Number_search" TSVECTOR;`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE pdoc ADD COLUMN "P40-11_BA_Title_search" TSVECTOR;`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE pdoc ADD COLUMN "P40-02_LI_Title_search" TSVECTOR;`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE rdoc ADD COLUMN "pe_msn_desc_search" TSVECTOR;`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE rdoc ADD COLUMN "ba_title_search" TSVECTOR;`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE rdoc ADD COLUMN "proj_title_search" TSVECTOR;`);
					})
					.then(() => {
						return sequelize.query(
							`ALTER TABLE om ADD COLUMN "sag_budget_line_item_title_search" TSVECTOR;`
						);
					})
					.then(() => {
						resolve();
					});
			} catch (err) {
				console.error(err);
			}
		});
	},

	down: async (queryInterface, _Sequelize) => {
		const { sequelize } = queryInterface;
		return new Promise((resolve, _reject) => {
			try {
				return sequelize
					.query(`ALTER TABLE pdoc DROP COLUMN "P3a-20_Milestone_Desc_search";`)
					.then(() => {
						return sequelize.query(`ALTER TABLE pdoc DROP COLUMN "P40-01_LI_Number_search";`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE pdoc DROP COLUMN "P40-11_BA_Title_search";`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE pdoc DROP COLUMN "P40-02_LI_Title_search";`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE rdoc DROP COLUMN "pe_msn_desc_search";`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE rdoc DROP COLUMN "ba_title_search";`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE rdoc DROP COLUMN "proj_title_search";`);
					})
					.then(() => {
						return sequelize.query(`ALTER TABLE om DROP COLUMN "sag_budget_line_item_title_search";`);
					})
					.then(() => {
						resolve();
					});
			} catch (err) {
				console.error(err);
			}
		});
	},
};
