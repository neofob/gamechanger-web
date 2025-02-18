const GC_ADMINS = require('../models').admin;
const LOGGER = require('@dod-advana/advana-logger');
const sparkMD5Lib = require('spark-md5');
const APP_SETTINGS = require('../models').app_settings;
const SearchUtility = require('../utils/searchUtility');
const MLSearchUtility = require('../utils/MLsearchUtility');
const { ElasticSearchController } = require('./elasticSearchController');

const constantsFile = require('../config/constants');
class AdminController {
	constructor(opts = {}) {
		const {
			logger = LOGGER,
			gcAdmins = GC_ADMINS,
			sparkMD5 = sparkMD5Lib,
			appSettings = APP_SETTINGS,
			searchUtility = new SearchUtility(opts),
			MLsearchUtility = new MLSearchUtility(opts),
			esController = new ElasticSearchController(opts),

			constants = constantsFile,
		} = opts;

		this.logger = logger;
		this.gcAdmins = gcAdmins;
		this.sparkMD5 = sparkMD5;
		this.appSettings = appSettings;
		this.searchUtility = searchUtility;
		this.MLsearchUtility = MLsearchUtility;
		this.esController = esController;

		this.constants = constants;

		this.getGCAdminData = this.getGCAdminData.bind(this);
		this.storeGCAdminData = this.storeGCAdminData.bind(this);
		this.deleteGCAdminData = this.deleteGCAdminData.bind(this);
		this.getHomepageEditorData = this.getHomepageEditorData.bind(this);
		this.setHomepageEditorData = this.setHomepageEditorData.bind(this);
		this.getHomepageUserData = this.getHomepageUserData.bind(this);
		this.cacheQlikApps = this.cacheQlikApps.bind(this);
	}

	async cacheQlikApps(req, res) {
		let userId = 'webapp_unknown';
		try {
			userId = req.session?.user?.id || req.get('SSL_CLIENT_S_DN_CN');
			await this.esController.cacheStoreQlikApps();
			res.status(200).send('ok');
		} catch (err) {
			this.logger.error(err, 'ANJMS52', userId);
			res.status(500).send(err);
		}
	}

	async getGCAdminData(req, res) {
		let userId = 'webapp_unknown';
		try {
			// const { searchQuery, docTitle } = req.body;
			userId = req.session?.user?.id || req.get('SSL_CLIENT_S_DN_CN');

			this.gcAdmins.findAll({ raw: true }).then((results) => {
				res.status(200).send({ admins: results, timeStamp: new Date().toISOString() });
			});
		} catch (err) {
			this.logger.error(err, '9BN7UGI', userId);
			res.status(500).send(err);
		}
	}

	async storeGCAdminData(req, res) {
		let userId = 'webapp_unknown';
		try {
			const { adminData } = req.body;
			userId = req.session?.user?.id || req.get('SSL_CLIENT_S_DN_CN');

			const [admin, created] = await this.gcAdmins.findOrCreate({
				where: { username: adminData.username },
				defaults: {
					username: adminData.username,
				},
			});

			if (!created) {
				admin.username = adminData.username;
				await admin.save();
			}

			res.status(200).send({ created: created, updated: !created });
		} catch (err) {
			this.logger.error(err, 'GZ3D0DQ', userId);
			res.status(500).send(err);
		}
	}

	async deleteGCAdminData(req, res) {
		let userId = 'webapp_unknown';
		try {
			const { username } = req.body;
			userId = req.session?.user?.id || req.get('SSL_CLIENT_S_DN_CN');

			const admin = await this.gcAdmins.findOne({ where: { username } });
			await admin.destroy();

			res.status(200).send({ deleted: true });
		} catch (err) {
			this.logger.error(err, 'QH2QBDU', userId);
			res.status(500).send(err);
		}
	}
	async getHomepageUserData(req, esIndex, userId) {
		let results = [];
		const { favorite_documents = [], export_history = [], pdf_opened = [] } = req.body;
		let favDocList = [];
		let exportDocList = [];
		let last_opened = [];
		// remove pdf, and get favorited docs
		for (let doc of favorite_documents) {
			favDocList.push(doc.filename.split('.pdf')[0]);
		}
		// remove pdf, and get exported docs
		for (let obj of export_history) {
			if (obj.download_request_body.cloneName === 'gamechanger') {
				const sel_docs = obj.download_request_body.selectedDocuments;
				for (let doc of sel_docs) {
					exportDocList.push(doc.split('.pdf')[0]);
				}
			}
		}
		for (let obj of pdf_opened) {
			const doc = obj.document;
			last_opened.push(doc.split(' - ')[1].split('.pdf')[0]);
			last_opened = [...new Set(last_opened)];
		}
		// combine list
		let combinedDocList = favDocList.concat(exportDocList).concat(last_opened);

		let docs = {};
		let recDocs = {};
		docs.key = 'popular_docs';
		recDocs.key = 'rec_docs';
		try {
			docs.value = await this.searchUtility.getPopularDocs(userId, esIndex);
		} catch (err) {
			this.logger.error(err, 'FL1LLDU', userId);
			docs.value = [];
		}
		try {
			if (combinedDocList.length > 0) {
				// get recommendations
				const rec_results = await this.MLsearchUtility.getRecDocs(combinedDocList, userId);
				recDocs.value = rec_results.results ? rec_results.results : [];
				// only get top 20 recommendations
				recDocs.value = recDocs.value.slice(0, 10);
			} else {
				recDocs.value = [];
			}
		} catch (err) {
			this.logger.error(err, 'FL2LLDU', userId);
			recDocs.value = [];
		}
		results.push(docs);
		results.push(recDocs);
		return results;
	}
	async getHomepageEditorData(req, res) {
		let userId = 'webapp_unknown';
		let esIndex = 'gamechanger';
		let userResults = [];
		try {
			userResults = await this.getHomepageUserData(req, esIndex, userId);
		} catch (err) {
			this.logger.error(err, 'PP1QOA3', userId);
		}

		try {
			userId = req.session?.user?.id || req.get('SSL_CLIENT_S_DN_CN');
			let results = await this.appSettings.findAll({
				where: {
					key: ['homepage_topics', 'homepage_major_pubs', 'homepage_popular_docs_inactive'],
				},
			});
			results = results.concat(userResults);
			res.status(200).send(results);
		} catch (err) {
			this.logger.error(err, '7R9BUO3', userId);
			res.status(500).send(err);
		}
	}

	async setHomepageEditorData(req, res) {
		let userId = 'webapp_unknown';

		try {
			const { key, tableData } = req.body;
			userId = req.session?.user?.id || req.get('SSL_CLIENT_S_DN_CN');
			await this.appSettings.update(
				{
					value: JSON.stringify(tableData),
				},
				{
					where: {
						key: `homepage_${key}`,
					},
				}
			);
			res.status(200).send();
		} catch (err) {
			this.logger.error(err, 'QKTBF4J', userId);
			res.status(500).send(err);
		}
	}
}

module.exports.AdminController = AdminController;
