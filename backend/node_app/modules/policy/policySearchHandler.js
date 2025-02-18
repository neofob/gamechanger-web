const SearchUtility = require('../../utils/searchUtility');
const MLSearchUtility = require('../../utils/MLsearchUtility');
const { PolicyPreSearchAggregationQuery } = require('./elasticsearch/queries');
const { PolicyPreSearchAggregationResponse } = require('./elasticsearch/responses');
const constantsFile = require('../../config/constants');
const { MLApiClient } = require('../../lib/mlApiClient');
const { DataTrackerController } = require('../../controllers/dataTrackerController');
const { DataLibrary } = require('../../lib/dataLibrary');
const { Thesaurus } = require('../../lib/thesaurus');
const thesaurus = new Thesaurus();
const FAVORITE_SEARCH = require('../../models').favorite_searches;
const _ = require('lodash');
const SearchHandler = require('../base/searchHandler');
const { getUserIdFromSAMLUserId } = require('../../utils/userUtility');
const APP_SETTINGS = require('../../models').app_settings;
const redisAsyncClientDB = 7;
const testing = false;
const { performance } = require('perf_hooks');

class PolicySearchHandler extends SearchHandler {
	constructor(opts = {}) {
		const {
			dataTracker = new DataTrackerController(opts),
			searchUtility = new SearchUtility(opts),
			MLsearchUtility = new MLSearchUtility(opts),
			dataLibrary = new DataLibrary(opts),
			mlApi = new MLApiClient(opts),
			app_settings = APP_SETTINGS,
			constants = constantsFile,
			favorite_search = FAVORITE_SEARCH,
		} = opts;
		super({ redisClientDB: redisAsyncClientDB, ...opts });

		this.dataTracker = dataTracker;
		this.searchUtility = searchUtility;
		this.MLsearchUtility = MLsearchUtility;

		this.dataLibrary = dataLibrary;
		this.mlApi = mlApi;
		this.app_settings = app_settings;
		this.constants = constants;
		this.error = {};
		this.favorite_Search = favorite_search;
	}

	async searchHelper(req, userId, storeHistory) {
		const { searchText, reviseFilterCounts = false } = req.body;

		let { historyRec, cloneSpecificObject, clientObj } = await this.createRecObject(
			req.body,
			userId,
			storeHistory,
			getUserIdFromSAMLUserId(req)
		);
		// cleaning incomplete double quote issue
		const doubleQuoteCount = (searchText.match(/"/g) || []).length;
		if (doubleQuoteCount % 2 === 1) {
			req.body.searchText = searchText.replace(/"+/g, '');
		}
		req.body.questionFlag = this.MLsearchUtility.isQuestion(searchText);

		let startTime = performance.now();
		let expansionDict = await this.gatherExpansionTerms(req.body, userId);
		let searchResults = (await this.doSearch(req, expansionDict, clientObj, userId, reviseFilterCounts)) || {
			docs: [],
		};
		let startTimeInt = performance.now();
		let enrichedResults = await this.enrichSearchResults(req, searchResults, clientObj, userId);
		let endTimeInt = performance.now();
		let endTime = performance.now();
		this.logger.info(
			`Total search time: ${endTime - startTime} milliseconds --- Enriched search took: ${
				endTimeInt - startTimeInt
			}`
		);

		if (storeHistory) {
			await this.storeHistoryRecords(req, historyRec, enrichedResults, cloneSpecificObject, userId);
		}
		return enrichedResults;
	}

	async callFunctionHelper(req, userId) {
		const { functionName, searchText = '' } = req.body;
		// cleaning incomplete double quote issue
		const doubleQuoteCount = (searchText.match(/"/g) || []).length;
		if (doubleQuoteCount % 2 === 1) {
			req.body.searchText = searchText.replace(/"+/g, '');
		}

		switch (functionName) {
			case 'getSingleDocumentFromES':
				return this.getSingleDocumentFromESHelper(req, userId);
			case 'getDocumentsBySourceFromESHelper':
				return this.getDocumentsBySourceFromESHelper(req, userId);
			case 'documentSearchPagination':
				let { clientObj } = await this.createRecObject(req.body, userId, false, getUserIdFromSAMLUserId(req));
				let expansionDict = await this.gatherExpansionTerms(req.body, userId);
				req.body.questionFlag = this.MLsearchUtility.isQuestion(searchText);
				return this.doSearch(req, expansionDict, clientObj, userId);
			case 'entityPagination':
				return this.entitySearch(req.body.searchText, req.body.offset, req.body.limit, userId);
			case 'topicPagination':
				return this.topicSearch(req.body.searchText, req.body.offset, req.body.limit, userId);
			case 'getPresearchData':
				return this.getPresearchData(userId);
			default:
				this.logger.error(
					`There is no function called ${functionName} defined in the policySearchHandler`,
					'4BC876D',
					userId
				);
		}
	}

	// searchHelper function breakouts
	async createRecObject(body, _userId, storeHistory, non_hashed_id) {
		const historyRec = {
			user_id: non_hashed_id,
			clone_name: undefined,
			search: '',
			startTime: new Date().toISOString(),
			numResults: -1,
			endTime: null,
			hadError: false,
			tiny_url: '',
			cachedResult: false,
			search_version: 1,
			request_body: {},
		};

		const {
			searchText,
			searchType,
			searchVersion,
			cloneName,
			offset,
			orgFilterString = [],
			showTutorial = false,
			tiny_url,
			searchFields = {},
			includeRevoked,
		} = body;

		const clientObj = {
			esClientName: 'gamechanger',
			esIndex: body.archivedCongressSelected
				? [
						this.constants.GAMECHANGER_ELASTIC_SEARCH_OPTS.index,
						this.constants.GAMECHANGER_ELASTIC_SEARCH_OPTS.legislation_index,
						this.constants.GAMECHANGER_ELASTIC_SEARCH_OPTS.assist_index,
				  ]
				: [
						this.constants.GAMECHANGER_ELASTIC_SEARCH_OPTS.index,
						this.constants.GAMECHANGER_ELASTIC_SEARCH_OPTS.assist_index,
				  ],
		};

		try {
			historyRec.searchText = searchText;
			historyRec.orgFilters = JSON.stringify(orgFilterString);
			historyRec.tiny_url = tiny_url;
			historyRec.clone_name = cloneName;
			historyRec.searchType = searchType;
			historyRec.search_version = searchVersion;
			historyRec.request_body = body;
			historyRec.showTutorial = showTutorial;

			const cloneSpecificObject = { orgFilterString, searchFields: Object.values(searchFields), includeRevoked };

			await this.redisDB.select(redisAsyncClientDB);

			// log query to ES
			if (storeHistory) {
				await this.storeEsRecord(clientObj.esClientName, offset, cloneName, non_hashed_id, searchText);
			}
			return { historyRec, cloneSpecificObject, clientObj };
		} catch (e) {
			this.logger.error(e.message, 'AC3CP8H');
		}
		// if fail, return empty objects
		return {
			historyRec,
			cloneSpecificObject: { orgFilterString, searchFields: Object.values(searchFields), includeRevoked },
		};
	}

	async gatherExpansionTerms(body, userId) {
		const { searchText, forCacheReload = false, cloneName } = body;
		try {
			// try to get search expansion
			const termsArray = this.searchUtility.getEsSearchTerms({ searchText })[1];
			let expansionDict = await this.mlApiExpansion(termsArray, forCacheReload, userId);
			let synonyms = this.thesaurusExpansion(searchText, termsArray)[0];
			const cleanedAbbreviations = await this.abbreviationCleaner(termsArray, userId);
			let relatedSearches = await this.MLsearchUtility.getRelatedSearches(
				searchText,
				expansionDict,
				cloneName,
				userId
			);
			expansionDict = this.searchUtility.combineExpansionTerms(
				expansionDict,
				synonyms,
				relatedSearches,
				termsArray[0],
				cleanedAbbreviations,
				userId
			);
			return expansionDict;
		} catch (e) {
			this.logger.error(e.message, 'B6X9EPJ');
		}
	}

	async mlApiExpansion(termsArray, forCacheReload, userId) {
		let expansionDict = {};
		try {
			expansionDict = await this.mlApi.getExpandedSearchTerms(termsArray, userId);
		} catch (e) {
			// log error and move on, expansions are not required
			if (forCacheReload) {
				throw Error('Cannot get expanded search terms in cache reload');
			}
			this.error.category = 'ML API';
			this.error.code = '93SQB38';
			this.logger.error(
				'DETECTED ERROR: Cannot get expanded search terms, continuing with search',
				'93SQB38',
				userId
			);
		}
		return expansionDict;
	}

	thesaurusExpansion(searchText, termsArray) {
		let lookUpTerm = searchText.replace(/\"/g, '');
		let useText = true;
		let synList = [];
		if (termsArray && termsArray.length && termsArray[0]) {
			useText = false;
			for (let term in termsArray) {
				lookUpTerm = termsArray[term].replace(/\"/g, '');
				const synonyms = thesaurus.lookUp(lookUpTerm);
				if (synonyms && synonyms.length > 1) {
					synList = synList.concat(synonyms.slice(0, 2));
				}
			}
		}

		let text = searchText;
		if (!useText && termsArray && termsArray.length && termsArray[0]) {
			text = termsArray[0];
		}
		return [synList, text];
	}

	async abbreviationCleaner(termsArray, userId) {
		// get expanded abbreviations
		const esClientName = 'gamechanger';
		const entitiesIndex = this.constants.GAME_CHANGER_OPTS.entityIndex;
		let abbreviationExpansions = [];
		let searchString = termsArray.join(' ');
		let replaceString = '';
		let alias = await this.searchUtility.findAliases(termsArray, esClientName, entitiesIndex, userId);
		if (alias._source) {
			let expandedName = alias._source.name.replace('United States ', '');
			replaceString = searchString.replace(alias.match.toLowerCase(), expandedName.toLowerCase());
			abbreviationExpansions.push('"' + replaceString + '"');
			let expandedAliases = alias._source.aliases;
			expandedAliases.forEach((term) => {
				if (term['name'] !== alias.match) {
					replaceString = searchString.replace(alias.match.toLowerCase(), term['name'].toLowerCase());
					abbreviationExpansions.push('"' + replaceString + '"');
				}
			});
		}
		return abbreviationExpansions;
	}

	async doSearch(req, expansionDict, clientObj, userId, reviseFilterCounts = false) {
		try {
			// caching db
			await this.redisDB.select(redisAsyncClientDB);

			let fullSearchResults;
			const operator = 'and';

			if (!reviseFilterCounts) {
				fullSearchResults = await this.searchUtility.documentSearch(
					req,
					{ ...req.body, expansionDict, operator },
					clientObj,
					userId
				);
			} else {
				const docResultsPromise = this.searchUtility.documentSearch(
					req,
					{ ...req.body, expansionDict, operator },
					clientObj,
					userId
				);
				const aggregationsPromise = this.searchUtility.getDocOrgAndTypeCounts(
					req,
					{ ...req.body, expansionDict, operator },
					clientObj,
					userId
				);
				const [docResults, aggregationsResults] = await Promise.allSettled([
					docResultsPromise,
					aggregationsPromise,
				]);

				let aggregations;
				if (docResults.status === 'rejected') {
					throw new Error(docResults.reason);
				} else if (aggregationsResults.status === 'rejected') {
					this.logger.error(aggregationsResults.reason);
					aggregations = {
						doc_orgs: [],
						doc_types: [],
					};
				} else {
					aggregations = aggregationsResults.value;
				}

				fullSearchResults = {
					...docResults.value,
					...aggregations,
				};
			}

			// insert crawler dates into search results
			fullSearchResults = await this.dataTracker.crawlerDateHelper(fullSearchResults, userId);
			return fullSearchResults;
		} catch (e) {
			this.logger.error(e.message, 'ML8P7GO');
		}
	}

	async enrichSearchResults(req, searchResults, clientObj, userId) {
		const { searchText, offset } = req.body;
		try {
			let sentenceResults = {};

			let enrichedResults = searchResults;
			//set empty values
			enrichedResults.qaResults = { question: '', answers: [], qaContext: [], params: {} };
			enrichedResults.intelligentSearch = {};
			enrichedResults.entities = [];
			enrichedResults.totalEntities = 0;
			enrichedResults.topics = [];
			enrichedResults.totalTopics = 0;
			enrichedResults.sentenceResults = [];

			// intelligent search data
			let intelligentSearchOn = await this.app_settings.findOrCreate({
				where: { key: 'combined_search' },
				defaults: { value: 'true' },
			});
			intelligentSearchOn =
				intelligentSearchOn.length > 0 ? intelligentSearchOn[0].dataValues.value === 'true' : false;
			if (intelligentSearchOn) {
				// get sentence search from ML API
				sentenceResults = await this.MLsearchUtility.getSentResults(req.body.searchText, userId);
				enrichedResults.sentenceResults = sentenceResults;
			}

			// QA data
			let intelligentAnswersOn = await this.app_settings.findOrCreate({
				where: { key: 'intelligent_answers' },
				defaults: { value: 'true' },
			});
			let qaParams = {
				maxLength: 1500,
				maxDocContext: 3,
				maxParaContext: 2,
				minLength: 200,
				scoreThreshold: 100,
				entityLimit: 10,
			};
			intelligentAnswersOn =
				intelligentAnswersOn.length > 0 ? intelligentAnswersOn[0].dataValues.value === 'true' : false;
			if (intelligentAnswersOn && intelligentSearchOn) {
				const QA = await this.qaEnrichment(req, sentenceResults, qaParams, userId);
				enrichedResults.qaResults = QA;
			}

			if (intelligentSearchOn && _.isEqual(enrichedResults.qaResults.answers, [])) {
				// add intelligent search result if QA empty
				// query ES for the document from the sentence search results
				const intelligentSearchResult = await this.intelligentSearch(req, sentenceResults, clientObj, userId);
				enrichedResults.intelligentSearch = intelligentSearchResult;
			}

			// add entities
			let entitySearchOn = await this.app_settings.findOrCreate({
				where: { key: 'entity_search' },
				defaults: { value: 'true' },
			});
			entitySearchOn = entitySearchOn.length > 0 ? entitySearchOn[0].dataValues.value === 'true' : false;
			if (entitySearchOn) {
				const entities = await this.entitySearch(searchText, offset, 6, userId);
				enrichedResults.entities = entities.entities;
				enrichedResults.totalEntities = entities.totalEntities;
			}

			//add topics
			let topicSearchOn = await this.app_settings.findOrCreate({
				where: { key: 'topic_search' },
				defaults: { value: 'true' },
			});
			topicSearchOn = topicSearchOn.length > 0 ? topicSearchOn[0].dataValues.value === 'true' : false;
			if (topicSearchOn) {
				// make a topicSearch switch
				const topics = await this.topicSearch(searchText, offset, 6, userId);
				enrichedResults.topics = topics.topics;
				enrichedResults.totalTopics = topics.totalTopics;
			}

			// add results to search report
			if (testing === true) {
				let saveResults = {};
				saveResults.regular = searchResults.docs.slice(0, 10);
				saveResults.entities = enrichedResults.entities;
				saveResults.topics = enrichedResults.topics;
				saveResults.qaResponses = enrichedResults.qaResults;
				this.MLsearchUtility.addSearchReport(searchText, enrichedResults.qaResults.params, saveResults, userId);
			}
			return enrichedResults;
		} catch (e) {
			this.logger.error(e.message, 'I9D42WM');
		}
		return searchResults;
	}

	async intelligentSearch(req, sentenceResults, clientObj, userId) {
		const {
			searchText,
			orgFilterString = [],
			typeFilterString = [],
			forCacheReload = false,
			searchFields = {},
			sort = 'Relevance',
			order = 'desc',
		} = req.body;
		let intelligentSearchResult = {};

		// combined search: run if not clone + sort === 'relevance' + flag enabled
		const verbatimSearch = searchText.startsWith('"') && searchText.endsWith('"');
		const noFilters = _.isEqual(searchFields, { initial: { field: null, input: '' } });
		const noSourceSpecified = _.isEqual([], orgFilterString);
		const noPubDateSpecified = req.body.publicationDateAllTime;
		const noTypeSpecified = _.isEqual([], typeFilterString);
		let combinedSearch = await this.app_settings.findOrCreate({
			where: { key: 'combined_search' },
			defaults: { value: 'true' },
		});
		combinedSearch = combinedSearch.length > 0 ? combinedSearch[0].dataValues.value === 'true' : false;
		if (
			sort === 'Relevance' &&
			order === 'desc' &&
			noFilters &&
			noSourceSpecified &&
			noPubDateSpecified &&
			noTypeSpecified &&
			combinedSearch &&
			!verbatimSearch
		) {
			try {
				// get intelligent search result
				intelligentSearchResult = await this.MLsearchUtility.intelligentSearchHandler(
					sentenceResults,
					userId,
					req,
					clientObj
				);
				return intelligentSearchResult;
			} catch (e) {
				if (forCacheReload) {
					throw Error('Cannot transform document search terms in cache reload');
				}
				this.logger.error(
					`Error sentence transforming document search results ${e.message}`,
					'L6SPJU9',
					userId
				);
				const { message } = e;
				this.logger.error(message, 'H6XFEIW', userId);
				return intelligentSearchResult;
			}
		}
		return intelligentSearchResult;
	}

	async qaEnrichment(req, sentenceResults, qaParams, userId) {
		const { searchText } = req.body;

		let QA = { question: '', answers: [], params: qaParams, qaContext: [] };

		let esClientName = 'gamechanger';
		let esIndex = this.constants.GAME_CHANGER_OPTS.index;
		let entitiesIndex = this.constants.GAME_CHANGER_OPTS.entityIndex;
		let intelligentQuestions = await this.app_settings.findOrCreate({
			where: { key: 'intelligent_answers' },
			defaults: { value: 'true' },
		});
		if (intelligentQuestions.length > 0) {
			intelligentQuestions = intelligentQuestions[0].dataValues.value === 'true';
		}
		if (intelligentQuestions && req.body.questionFlag) {
			try {
				let queryType = 'documents';
				let entities = { QAResults: {}, allResults: {} };
				let qaQueries = await this.MLsearchUtility.formatQAquery(
					searchText,
					esClientName,
					entitiesIndex,
					userId
				);
				QA.question = qaQueries.display;
				let bigramQueries = this.MLsearchUtility.getBigramQueries(qaQueries.list, qaQueries.alias);
				try {
					entities = await this.MLsearchUtility.getQAEntities(
						entities,
						qaQueries,
						bigramQueries,
						qaParams,
						esClientName,
						entitiesIndex,
						userId
					);
				} catch (e) {
					this.logger.error(e.message, 'FLPQX67M');
				}
				let qaDocQuery = this.MLsearchUtility.getPhraseQAQuery(
					bigramQueries,
					queryType,
					qaParams.entityLimit,
					qaParams.maxLength,
					userId
				);
				let docQAResults = await this.dataLibrary.queryElasticSearch(esClientName, esIndex, qaDocQuery, userId);
				let context = await this.MLsearchUtility.getQAContext(
					docQAResults,
					entities.QAResults,
					sentenceResults,
					esClientName,
					esIndex,
					userId,
					qaParams
				);
				if (testing === true) {
					this.MLsearchUtility.addSearchReport(searchText, qaParams, { results: context }, userId);
				}
				if (context.length > 0) {
					// if context results, query QA model
					QA.qaContext = context;
					let shortenedResults = await this.mlApi.getIntelAnswer(
						qaQueries.text,
						context.map((item) => item.text),
						userId
					);
					QA = this.MLsearchUtility.cleanQAResults(QA, shortenedResults, context);
				}
			} catch (e) {
				this.error.category = 'ML API';
				this.error.code = 'KBBIOYCJ';
				this.logger.error('DETECTED ERROR:', e.message, 'KBBIOYCJ', userId);
			}
		}
		return QA;
	}

	async storeHistoryRecords(req, historyRec, enrichedResults, cloneSpecificObject, userId) {
		const { useGCCache, showTutorial = false, forCacheReload = false } = req.body;
		try {
			// try to store to cache
			if (useGCCache && enrichedResults) {
				await this.storeCachedResults(req, historyRec, enrichedResults, cloneSpecificObject, userId);
			}

			// try storing results record
			if (!forCacheReload) {
				try {
					const { totalCount } = enrichedResults;
					historyRec.endTime = new Date().toISOString();
					historyRec.numResults = totalCount;
					await this.storeRecordOfSearchInPg(historyRec, userId);
				} catch (e) {
					this.logger.error(e.message, 'MPK1GGN', userId);
				}
			}
		} catch (err) {
			if (!forCacheReload) {
				const { message } = err;
				this.logger.error(message, 'VKSB5GQ', userId);
				historyRec.endTime = new Date().toISOString();
				historyRec.hadError = true;
				await this.storeRecordOfSearchInPg(historyRec, showTutorial);
			}
			throw err;
		}
	}

	async getSingleDocumentFromESHelper(req, userId) {
		try {
			const permissions = req.permissions ? req.permissions : [];

			const { cloneName } = req.body;

			const esQuery = this.searchUtility.getElasticsearchDocDataFromId(req.body, userId);
			let clientObj = this.searchUtility.getESClient(cloneName, permissions);
			const esResults = await this.dataLibrary.queryElasticSearch(
				clientObj.esClientName,
				clientObj.esIndex,
				esQuery
			);

			if (
				esResults &&
				esResults.body &&
				esResults.body.hits &&
				esResults.body.hits.total &&
				esResults.body.hits.total.value &&
				esResults.body.hits.total.value > 0
			) {
				const searchResults = this.searchUtility.cleanUpEsResults({
					raw: esResults,
					searchTerms: '',
					user: userId,
					selectedDocuments: null,
					expansionDict: null,
					index: clientObj.esIndex,
					query: esQuery,
				});
				// insert crawler dates into search results
				return await this.dataTracker.crawlerDateHelper(searchResults, userId);
			} else {
				this.logger.error('Error with Elasticsearch results', 'D458925', userId);
				return { totalCount: 0, docs: [] };
			}
		} catch (err) {
			const msg = err && err.message ? `${err.message}` : `${err}`;
			this.logger.error(msg, 'Z9DWH7K', userId);
			return { totalCount: 0, docs: [] };
		}
	}

	async getDocumentsBySourceFromESHelper(req, userId) {
		let esQuery = '';
		try {
			const permissions = req.permissions ? req.permissions : [];
			const { searchText, offset = 0, limit = 18, cloneName } = req.body;

			esQuery = this.searchUtility.getSourceQuery(searchText, offset, limit);

			const clientObj = this.searchUtility.getESClient(cloneName, permissions);
			const esResults = await this.dataLibrary.queryElasticSearch(
				clientObj.esClientName,
				clientObj.esIndex,
				esQuery
			);
			if (
				esResults &&
				esResults.body &&
				esResults.body.hits &&
				esResults.body.hits.total &&
				esResults.body.hits.total.value &&
				esResults.body.hits.total.value > 0
			) {
				let searchResults = this.searchUtility.cleanUpEsResults({
					raw: esResults,
					searchTerms: '',
					user: userId,
					selectedDocuments: null,
					expansionDict: null,
					index: clientObj.esIndex,
					query: esQuery,
				});

				searchResults = await this.dataTracker.crawlerDateHelper(searchResults, userId);
				// insert crawler dates into search results
				return { ...searchResults, esQuery };
			} else {
				this.logger.error('Error with Elasticsearch results', '54TP85I', userId);
				if (this.searchUtility.checkESResultsEmpty(esResults)) {
					this.logger.warn('Search has no hits');
				}

				return { totalCount: 0, docs: [], esQuery };
			}
		} catch (err) {
			const msg = err && err.message ? `${err.message}` : `${err}`;
			this.logger.error(msg, 'GODULEB', userId);
			throw msg;
		}
	}

	entitySearchHelper(docDataCleaned, returnEntity, userId) {
		try {
			// if parsing and adding stuff fails, log docDataCleaned
			if (docDataCleaned && docDataCleaned.nodes && docDataCleaned.nodes.length > 0) {
				for (const key of Object.keys(docDataCleaned.nodes[0])) {
					// take highest hit, add key value pairs into return object
					if (key !== 'properties' && key !== 'nodeVec' && key !== 'pageHits' && key !== 'pageRank') {
						returnEntity[key] = docDataCleaned.nodes[0][key];
					}
				}
			}
		} catch (err) {
			const { message } = err;
			this.logger.error(message, '9WJGAKB', userId);
			this.logger.error('docDataCleaned: ' + JSON.stringify(docDataCleaned), '9WJGAKB', userId);
		}
	}

	// uses searchtext to get entity + parent, return entitySearch object
	async entitySearch(searchText, offset, limit, userId) {
		try {
			if (limit == null) {
				limit = 6;
			}
			let esIndex = this.constants.GAME_CHANGER_OPTS.entityIndex;
			let esClientName = 'gamechanger';

			const esQuery = this.searchUtility.getEntityQuery(searchText, offset, limit);
			const entityResults = await this.dataLibrary.queryElasticSearch(esClientName, esIndex, esQuery, userId);
			if (entityResults.body.hits.hits.length > 0) {
				const entityList = entityResults.body.hits.hits.map(async (obj) => {
					let returnEntity = {};
					let ent = obj;
					returnEntity = ent._source;
					returnEntity.type = 'organization';
					// get img_link
					const ent_ids = [returnEntity.name];
					const graphQueryString = `WITH ${JSON.stringify(
						ent_ids
					)} AS ids MATCH (e:Entity) WHERE e.name in ids return e;`;
					const docData = await this.dataLibrary.queryGraph(
						graphQueryString,
						{ params: { ids: ent_ids } },
						userId
					);
					const docDataCleaned = this.searchUtility.cleanNeo4jData(docData.result, false, userId);
					this.entitySearchHelper(docDataCleaned, returnEntity, userId);
					return returnEntity;
				});

				let entities = [];
				if (entityList.length > 0) {
					entities = await Promise.all(entityList);
				}
				return { entities, totalEntities: entityResults.body.hits.total.value };
			} else {
				return { entities: [], totalEntities: 0 };
			}
		} catch (e) {
			this.logger.error(e.message, 'VLPOJJJ');
			return { entities: [], totalEntities: 0 };
		}
	}

	async topicSearch(searchText, offset, limit, userId) {
		try {
			if (limit == null) {
				limit = 6;
			}
			let esIndex = this.constants.GAME_CHANGER_OPTS.entityIndex;
			let esClientName = 'gamechanger';
			const esQuery = this.searchUtility.getTopicQuery(searchText, offset, limit);
			const topicResults = await this.dataLibrary.queryElasticSearch(esClientName, esIndex, esQuery, userId);
			if (topicResults.body.hits.hits.length > 0) {
				let topics = topicResults.body.hits.hits.map(async (obj) => {
					let returnObject = obj._source;
					returnObject.type = 'topic';
					const topicDocumentCount = `MATCH (t:Topic) where t.name = "${obj._source.name.toLowerCase()}"
						OPTIONAL MATCH (t) <-[:CONTAINS]-(d:Document)-[:CONTAINS]->(t2:Topic)
						RETURN t2.name as topic_name, count(d) as doc_count
						ORDER BY doc_count DESC LIMIT 5`;
					const documentCount = `MATCH (t:Topic) where t.name = "${obj._source.name.toLowerCase()}"
						OPTIONAL MATCH (t) <-[:CONTAINS]-(d:Document)
						RETURN count(d) as doc_count`;
					try {
						const topicData = await this.dataLibrary.queryGraph(topicDocumentCount, { params: {} }, userId);
						const docData = await this.dataLibrary.queryGraph(documentCount, { params: {} }, userId);
						const topicDataCleaned = this.searchUtility.cleanNeo4jData(topicData.result, false, userId);
						const docDataCleaned = this.searchUtility.cleanNeo4jData(docData.result, false, userId);
						returnObject.relatedTopics = topicDataCleaned.graph_metadata;
						returnObject.documentCount = docDataCleaned.graph_metadata;
					} catch (err) {
						// log errors if neo4j stuff fails
						this.logger.error(err.message, 'OICE7JS');
					}
					return returnObject;
				});

				if (topics.length > 0) {
					topics = await Promise.all(topics);
				}

				return { topics, totalTopics: topicResults.body.hits.total.value };
			}
			return { topics: [], totalTopics: 0 };
		} catch (e) {
			this.logger.error(e.message, 'OICE7JS');
			return { topics: [], totalTopics: 0 };
		}
	}

	async getPresearchData(userId) {
		let results = { orgs: [], types: [] };
		const errorCode = 'RYZ919H';
		const compositeBucketSize = 100;
		const elasticsearchClientName = 'gamechanger';

		try {
			const elasticsearchIndex = this.constants.GAME_CHANGER_OPTS.index;
			const organizationQuery = PolicyPreSearchAggregationQuery.createOrganizationQuery(compositeBucketSize);
			const documentTypeQuery = PolicyPreSearchAggregationQuery.createDocumentTypeQuery(compositeBucketSize);

			const promises = [];
			[organizationQuery, documentTypeQuery].forEach((query) => {
				promises.push(
					this.dataLibrary.queryElasticSearch(elasticsearchClientName, elasticsearchIndex, query, userId)
				);
			});

			let [organizationResults, documentTypeResults] = await Promise.allSettled(promises);
			const errorMessage = 'Failed to get presearch aggregations for ';
			organizationResults.status === 'rejected' &&
				this.logger.error(errorMessage + 'organizations. ' + organizationResults.reason, errorCode, userId);
			documentTypeResults.status === 'rejected' &&
				this.logger.error(errorMessage + 'document types. ' + documentTypeResults.reason, errorCode, userId);

			results.orgs = PolicyPreSearchAggregationResponse.formatOrganizationResponse(organizationResults.value);
			results.types = PolicyPreSearchAggregationResponse.formatDocumentTypeResponse(documentTypeResults.value);

			return results;
		} catch (error) {
			this.logger.error(error.message, 'OICE7JS', userId);
			return results;
		}
	}

	async storeEsRecord(esClient, offset, clone_name, userId, searchText) {
		try {
			// log search query to elasticsearch
			if (offset === 0) {
				let clone_log = clone_name || 'policy';
				const searchLog = {
					user_id: userId,
					search_query: searchText,
					run_time: new Date().getTime(),
					clone_name: clone_log,
				};
				let search_history_index = this.constants.GAME_CHANGER_OPTS.historyIndex;

				await this.dataLibrary.putDocument(esClient, search_history_index, searchLog);
			}
		} catch (e) {
			this.logger.error(e.message, 'UA0YDAL');
		}
	}

	getError() {
		return this.error;
	}
}

module.exports = PolicySearchHandler;
