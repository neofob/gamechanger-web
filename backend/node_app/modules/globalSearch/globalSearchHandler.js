const LOGGER = require('@dod-advana/advana-logger');
const SearchHandler = require('../base/searchHandler');
const lunr = require('lunr');
const __ = require('lodash');
const lunrSearchUtils = require('../../utils/lunrSearchUtils');
const constantsFile = require('../../config/constants');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const _ = require('lodash');
const dataCatalogUtils = require('../../utils/DataCatalogUtils');
const Sequelize = require('sequelize');
const databaseFile = require('../../models/game_changer');
const { getUserIdFromSAMLUserId } = require('../../utils/userUtility');

const redisAsyncClientDB = 7;

const { QLIK_URL, QLIK_WS_URL, CA, KEY, CERT, AD_DOMAIN, QLIK_SYS_ACCOUNT } = constantsFile.QLIK_OPTS;

const STREAM_PROD_FILTER = `customProperties.value eq 'Production' and customProperties.definition.name eq 'StreamType'`;
const APP_PROD_FILTER = `stream.customProperties.value eq 'Production' and stream.customProperties.definition.name eq 'StreamType'`;

class GlobalSearchHandler extends SearchHandler {
	constructor(opts = {}) {
		const {
			logger = LOGGER,
			constants = constantsFile,
			database = databaseFile,
			dcUtils = dataCatalogUtils,
		} = opts;
		super({ redisClientDB: redisAsyncClientDB, ...opts });

		this.logger = logger;
		this.constants = constants;
		this.database = database;
		this.dcUtils = dcUtils;
	}

	async searchHelper(req, userId, storeHistory) {
		const historyRec = {
			user_id: getUserIdFromSAMLUserId(req),
			searchText: '',
			startTime: new Date().toISOString(),
			numResults: -1,
			endTime: null,
			hadError: false,
			isSemanticSearch: false,
			tiny_url: '',
			cachedResult: false,
		};

		const {
			useGCCache,
			forCacheReload = false,
			showTutorial,
			getApplications,
			getDashboards,
			getDataSources,
			getDatabases,
			tiny_url,
			cloneName,
			searchType,
			searchVersion,
		} = req.body;

		try {
			const { searchText, limit, offset } = req.body;
			historyRec.searchText = searchText;
			historyRec.showTutorial = showTutorial;
			historyRec.tiny_url = tiny_url;
			historyRec.clone_name = cloneName;
			historyRec.searchType = searchType;
			historyRec.search_version = searchVersion;
			historyRec.request_body = req.body;

			const cloneSpecificObject = {};

			// if (!forCacheReload && useGCCache && offset === 0) {
			// 	return this.getCachedResults(req, historyRec, cloneSpecificObject, userId, storeHistory);
			// }
			const searchResults = { applications: {}, dashboards: {}, dataSources: {}, databases: {}, totalCount: 0 };
			const searchesToRun = {};

			// Applications
			if (getApplications) {
				searchesToRun['applications'] = this.getApplicationResults(searchText, offset, limit, userId);
			}

			// Dashboards
			if (getDashboards) {
				searchesToRun['dashboards'] = this.getDashboardResults(searchText, offset, limit, userId);
			}

			// Data Sources
			if (getDataSources) {
				searchesToRun['dataSources'] = this.getDataCatalogResults(
					searchText,
					offset,
					limit,
					'Data Source',
					userId
				);
			}

			// Databases
			if (getDatabases) {
				searchesToRun['databases'] = this.getDataCatalogResults(searchText, offset, limit, 'Database', userId);
			}

			const results = await Promise.all(Object.values(searchesToRun));

			Object.keys(searchesToRun).forEach((searchKey, index) => {
				searchResults[searchKey] = results[index];
			});

			// try to store to cache
			if (useGCCache && searchResults) {
				await this.storeCachedResults(req, historyRec, searchResults, cloneSpecificObject, userId);
			}

			// try storing results record
			if (storeHistory) {
				try {
					const { totalCount } = searchResults;
					historyRec.endTime = new Date().toISOString();
					historyRec.numResults = totalCount;
					await this.storeRecordOfSearchInPg(historyRec, userId);
				} catch (e) {
					this.logger.error(e.message, 'BG3V9N8', userId);
				}
			}

			return searchResults;
		} catch (err) {
			const { message } = err;
			this.logger.error(message, 'VU2YLNH', userId);
			historyRec.endTime = new Date().toISOString();
			historyRec.hadError = true;
			throw message;
		}
	}

	async callFunctionHelper(req, userId, res) {
		const { functionName } = req.body;

		switch (functionName) {
			default:
				this.logger.error(
					`There is no function called ${functionName} defined in the policySearchHandler`,
					'4BC876D',
					userId
				);
		}
	}

	async getApplicationResults(searchText, offset, limit, userId) {
		try {
			const t0 = new Date().getTime();
			const hitQuery = `select description, permission, href, link_label, id
							  from megamenu_links
							  where (section = 'Applications' and link_label not like '%Overview%' and href is not null)
								 or (href like 'https://covid-status.data.mil%' and section = 'Analytics')`;
			const results = await this.database.uot.query(hitQuery, { type: Sequelize.QueryTypes.SELECT, raw: true });
			const [apps, appResults] = this.performApplicationSearch(results, lunrSearchUtils.parse(searchText));
			const tmpReturn = this.generateRespData(apps, appResults, offset, limit);
			const t1 = new Date().getTime();
			this.logger.info(`Get Application Results Time: ${((t1 - t0) / 1000).toFixed(2)}`, 'MJ2D6VGTime', userId);
			return tmpReturn;
		} catch (err) {
			this.logger.error(err, 'MJ2D6VG', userId);
			return { hits: [], totalCount: 0, count: 0 };
		}
	}

	async getDashboardResults(searchText, offset, limit, userId) {
		try {
			const t0 = new Date().getTime();
			let results = await Promise.all([
				this.getQlikApps(),
				this.getQlikApps({}, userId.substring(0, userId.length - 4)),
			]);
			const [apps, searchResults] = this.performSearch(
				this.mergeUserApps(results[0].data || [], results[1].data || []),
				lunrSearchUtils.parse(searchText)
			);
			const tmpReturn = this.generateRespData(apps, searchResults, offset, limit);
			const t1 = new Date().getTime();
			this.logger.info(`Get Dashboard Results Time: ${((t1 - t0) / 1000).toFixed(2)}`, 'WS18EKRTime', userId);
			return tmpReturn;
		} catch (err) {
			this.logger.error(err, 'WS18EKR', userId);
			return { hits: [], totalCount: 0, count: 0 };
		}
	}

	async getDataCatalogResults(searchText, offset, limit, searchType = 'all', userId) {
		const t0 = new Date().getTime();
		const searchTypeIds = await this.dcUtils.getSearchTypeId(searchType);
		const qStatus = await this.dcUtils.getQueryableStatuses();
		try {
			const defaultSearchOptions = {
				keywords: this.dcUtils.cleanSearchText(searchText),
				filters: [
					{
						field: 'assetType',
						values: searchTypeIds,
					},
					{
						field: 'status',
						values: qStatus,
					},
				],
				highlights: {
					preTag: '<highlight>',
					postTag: '</highlight>',
				},
				limit,
				offset,
			};

			if (!searchText) throw new Error('keywords is required in the request body');

			const url = this.dcUtils.getCollibraUrl() + '/search';
			const fullSearch = { ...defaultSearchOptions, limit, offset, searchText, searchType };
			const response = await axios.post(url, fullSearch, this.dcUtils.getAuthConfig());

			const t1 = new Date().getTime();
			this.logger.info(
				`Get Data Catalog Results Time for ${searchType}: ${((t1 - t0) / 1000).toFixed(2)}`,
				'FE656U9Time',
				userId
			);

			return response.data || { total: 0, results: [] };
		} catch (err) {
			this.logger.error(err, 'FE656U9', userId);
			return { total: 0, results: [] };
		}
	}

	performApplicationSearch(allApps, searchText) {
		// create a map of apps keyed by id field so that we can reference them from the search results
		let apps = __.keyBy(allApps, 'id');

		// create lunr search index
		let idx = lunr(function () {
			// key field in our data that search results will be keyed by
			this.ref('id');
			// fields to search
			this.field('link_label');
			this.field('description');
			// data to search
			allApps.forEach(function (app) {
				this.add(app);
			}, this);
		});

		// perform search
		let searchResults = idx.search(searchText);

		return [apps, searchResults];
	}

	generateRespData(apps, searchResults, offset, limit) {
		try {
			let ret = [];

			let pagedResult = searchResults.slice(offset, offset + limit);

			for (let res of pagedResult) {
				ret.push({ ...apps[res.ref], score: res.score });
			}

			return { hits: ret, totalCount: searchResults.length, count: ret.length };
		} catch (e) {
			this.logger.error(e, 'QW8UGJM');
			return { hits: [], totalCount: 0, count: 0 };
		}
	}

	async getQlikApps(params = {}, userId) {
		try {
			let url = `${QLIK_URL}/qrs/app/full`;
			let result = await axios.get(url, this.getRequestConfigs({ filter: APP_PROD_FILTER, ...params }, userId));
			return result;
		} catch (err) {
			if (!userId)
				// most common error is user wont have a qlik account which we dont need to log on every single search/hub hit
				this.logger.error(err, 'O799J51', userId);

			return {};
		}
	}

	getRequestConfigs(params = {}, userid = QLIK_SYS_ACCOUNT) {
		return {
			params: {
				Xrfkey: 1234567890123456,
				...params,
			},
			headers: {
				'content-type': 'application/json',
				'X-Qlik-xrfkey': '1234567890123456',
				'X-Qlik-user': this.getUserHeader(userid),
			},
			httpsAgent: new https.Agent({
				rejectUnauthorized: false,
				ca: CA,
				key: KEY,
				cert: CERT,
			}),
		};
	}

	getUserHeader(userid = QLIK_SYS_ACCOUNT) {
		return `UserDirectory=${AD_DOMAIN}; UserId=${userid}`;
	}

	performSearch(allApps, searchText) {
		// create a map of apps keyed by id field so that we can reference them from the search results
		let apps = _.keyBy(allApps, 'id');

		// create lunr search index
		let idx = lunr(function () {
			// key field in our data that search results will be keyed by
			this.ref('id');
			// fields to search
			this.field('name');
			this.field('description');
			this.field('stream', { extractor: ({ stream: { name } }) => name });

			this.field('customProperties', {
				extractor: ({ customProperties }) =>
					customProperties.reduce((prev, curr) => {
						return prev.concat([curr?.value, curr?.schemaPath, curr?.definition?.name]);
					}, []),
			});

			this.field('tags', { extractor: ({ tags: { name } }) => name });

			// data to search
			allApps.forEach(function (app) {
				this.add(app);
			}, this);
		});

		// perform search
		let searchResults = idx.search(searchText);

		return [apps, searchResults];
	}

	mergeUserApps(apps, userApps) {
		for (let app of apps) {
			app.restricted = !_.find(userApps, (userApp) => userApp.id === app.id);
		}
		return apps;
	}
}

module.exports = GlobalSearchHandler;
