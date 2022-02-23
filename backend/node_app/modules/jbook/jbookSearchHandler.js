const _ = require('lodash');
const SearchUtility = require('../../utils/searchUtility');
const CONSTANTS = require('../../config/constants');
const { MLApiClient } = require('../../lib/mlApiClient');
const sparkMD5 = require('spark-md5');
const { DataLibrary } = require('../../lib/dataLibrary');
const JBookSearchUtility = require('./jbookSearchUtility');
const SearchHandler = require('../base/searchHandler');

const PDOC = require('../../models').pdoc;
const RDOC = require('../../models').rdoc;
const OM = require('../../models').om;
const ACCOMP = require('../../models').accomp;
const KEYWORD = require('../../models').keyword;
const KEYWORD_ASSOC = require('../../models').keyword_assoc;
const REVIEW = require('../../models').review;
const DB = require('../../models/index');
const { result } = require('underscore');
const { Sequelize } = require('sequelize');
const { Reports } = require('../../lib/reports');
const ExcelJS = require('exceljs');
const moment = require("moment");
const constants = require("../../config/constants");

const excelStyles = {
	middleAlignment: { vertical: 'middle', horizontal: 'center' },
	leftAlignment: { vertical: 'middle', horizontal: 'left' },
	topAlignment: { vertical: 'top', horizontal: 'left' },
	yellowFill: {
		type: 'pattern',
		pattern:'solid',
		fgColor:{argb:'FFFF00'},
	},
	greyFill: {
		type: 'pattern',
		pattern:'solid',
		fgColor:{argb:'E5E5E5'},
	},
	borderAllThin: {
		top: {style:'thin'},
		left: {style:'thin'},
		bottom: {style:'thin'},
		right: {style:'thin'}
	},
	borderAllMedium: {
		top: {style:'medium'},
		left: {style:'medium'},
		bottom: {style:'medium'},
		right: {style:'medium'}
	}
};


class JBookSearchHandler extends SearchHandler {
	constructor(opts = {}) {
		const {
			dataLibrary = new DataLibrary(opts),
			constants = CONSTANTS,
			mlApi = new MLApiClient(opts),
			searchUtility = new SearchUtility(opts),
			jbookSearchUtility = new JBookSearchUtility(opts),
			pdoc = PDOC,
			rdoc = RDOC,
			om = OM,
			accomp = ACCOMP,
			review = REVIEW,
			db = DB,
			reports = Reports
		} = opts;

		super({ ...opts });
		this.dataLibrary = dataLibrary;
		this.constants = constants;
		this.mlApi = mlApi;
		this.searchUtility = searchUtility;
		this.jbookSearchUtility = jbookSearchUtility;

		this.pdocs = pdoc;
		this.rdocs = rdoc;
		this.om = om;
		this.accomp = accomp;
		this.review = review;
		this.db = db;
		this.reports = new Reports();

	}

	async searchHelper(req, userId, res) {
		const historyRec = {
			user_id: userId,
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
			searchVersion,
			cloneName,
			offset,
			showTutorial = false,
			tiny_url,
			jbookSearchSettings = {}
		} = req.body;

		try {
			historyRec.search = searchText;
			historyRec.searchText = searchText;
			historyRec.tiny_url = tiny_url;
			historyRec.clone_name = cloneName;
			historyRec.search_version = searchVersion;
			historyRec.request_body = req.body;
			historyRec.showTutorial = showTutorial;

			let searchResults;

			// search postgres
			searchResults = await this.documentSearch(req, userId, res);

			// store record in history
			try {
				const { totalCount } = searchResults;
				historyRec.endTime = new Date().toISOString();
				historyRec.numResults = totalCount;
				// await this.storeRecordOfSearchInPg(historyRec, userId);
			} catch (e) {
				this.logger.error(e.message, 'ZMVI2TO', userId);
			}

			return searchResults;

		} catch (err) {
			const { message } = err;
			this.logger.error(message, 'WHMU1G2', userId);
			historyRec.endTime = new Date().toISOString();
			historyRec.hadError = true;
			// await this.storeRecordOfSearchInPg(historyRec, showTutorial);

			throw err;
		}
	}

	async addKeywords(raw, dataType) {
		if (!raw || !raw.length) return raw;

		let results = [];

		let rawIds = [];
		raw.forEach((r) => {
			rawIds.push(r.id);
		});
		let assoc_query = '';
		if (dataType === 'pdoc') {
			assoc_query = `SELECT * from keyword_assoc where pdoc_id in (${rawIds})`;
		} else if (dataType === 'rdoc') {
			assoc_query = `SELECT * from keyword_assoc where rdoc_id in (${rawIds})`;
		} else if (dataType === 'om') {
			assoc_query = `SELECT * from keyword_assoc where om_id in (${rawIds})`;
		}
		let assoc_results = await KEYWORD_ASSOC.sequelize.query(assoc_query);
		assoc_results = assoc_results && assoc_results[0] ? assoc_results[0] : [];

		let lookup = {};
		let keyword_ids = [];
		assoc_results.forEach((ka) => {
			if (dataType === 'pdoc') {
				if (ka.pdoc_id) {
					if (!lookup[ka.pdoc_id]) {
						lookup[ka.pdoc_id] = [];
					}
					lookup[ka.pdoc_id].push(ka.keyword_id);
					keyword_ids.push(ka.keyword_id);
				}
			} else if (dataType === 'rdoc') {
				if (ka.rdoc_id) {
					if (!lookup[ka.rdoc_id]) {
						lookup[ka.rdoc_id] = [];
					}
					lookup[ka.rdoc_id].push(ka.keyword_id);
					keyword_ids.push(ka.keyword_id);
				}
			} else if (dataType === 'om') {
				if (ka.om_id) {
					if (!lookup[ka.om_id]) {
						lookup[ka.om_id] = [];
					}
					lookup[ka.om_id].push(ka.om_id);
					keyword_ids.push(ka.keyword_id);
				}
			}
		});

		let keyword_recs = [];
		if (keyword_ids && keyword_ids.length) {
			let keyword_query = `SELECT id, name from keyword where id in (${keyword_ids})`;
			keyword_recs = await KEYWORD.sequelize.query(keyword_query);
			keyword_recs = keyword_recs && keyword_recs[0] ? keyword_recs[0] : [];
		}

		raw.forEach((r) => {
			let result = r;
			if (lookup[r.id] && lookup[r.id].length) {
				result.keywords = [];
				lookup[r.id].forEach((keyword_id) => {
					keyword_recs.forEach((k) => {
						if (k.id === keyword_id) {
							result.keywords.push(k.name);
						}
					})
				});
			}
			results.push(result);
		})

		return results;
	}

	async addReviewData(raw, dataType) {
		if (!raw || !raw.length) return raw;

		let results = [];

		let review_query = '';
		let rawBlis = [];
		if (dataType === 'pdoc') {
			raw.forEach((r) => {
				rawBlis.push('\'' + r.budgetLineItem + '\'');
			});
			review_query = `SELECT * from review where budget_type = 'pdoc' and budget_line_item in (${rawBlis})`;
		} else if (dataType === 'rdoc') {
			raw.forEach((r) => {
				rawBlis.push('\'' + r.projectNum + '\'');
			});
			review_query = `SELECT * from review where budget_type = 'rdoc' and budget_line_item in (${rawBlis})`;
		} else if (dataType === 'om') {
			raw.forEach((r) => {
				rawBlis.push('\'' + r.line_number + '\'');
			});
			review_query = `SELECT * from review where budget_type = 'om' and budget_line_item in (${rawBlis})`;// where doc_id in (${rawIds})`;
		}

		let review_results = await REVIEW.sequelize.query(review_query);
		review_results = review_results && review_results[0] ? review_results[0] : [];

		raw.forEach((r) => {
			let result = r;
			let reviews = [];

			// don't match on budget year for now
			if (dataType === 'rdoc') {
				reviews = review_results.filter(rev => rev.budgetYear === r.BudgetYear && rev.program_element === r.programElement && rev.budget_line_item === r.projectNum);
			} else if (dataType === 'pdoc') {
				reviews = review_results.filter(rev => rev.budgetYear === r['P40-04_BudgetYear'] && rev.budget_line_item === r.budgetLineItem);
			} else if (dataType === 'om') {
				reviews = review_results.filter(rev => rev.budget_line_item === r.line_number);
			}

			if (reviews && reviews.length) {
				result.primaryReviewer = reviews[0].primary_reviewer;
				result.primaryClassLabel = reviews[0].primary_class_label;
				result.serviceReviewStatus = reviews[0].service_review_status;
			}

			results.push(result);
		})

		return results;
	}

	async documentSearch(req, userId, res, statusExport = false) {

		try {
			//return this.postgresDocumentSearch(req, userId, res, statusExport);
			return this.elasticSearchDocumentSearch(req, userId, res, statusExport);
		} catch (e) {
			console.log(e);
			const { message } = e;
			this.logger.error(message, 'IDD6Y19', userId);
			throw e;
		}
	}

	async elasticSearchDocumentSearch(req, userId, res, statusExport = false) {
		try {
			const {
				offset,
				searchText,
				jbookSearchSettings,
				exportSearch
			} = req.body;

			let searchResults = {totalCount: 0, docs: []};
			const operator = 'and';

			const clientObj = {esClientName: 'gamechanger', esIndex: 'jbook'};
			const [parsedQuery, searchTerms] = this.searchUtility.getEsSearchTerms(req.body);
			req.body.searchTerms = searchTerms;
			req.body.parsedQuery = parsedQuery;
			const esQuery = this.searchUtility.getElasticSearchQueryForJBook(req.body, userId);

			const esResults = await this.dataLibrary.queryElasticSearch(clientObj.esClientName, clientObj.esIndex, esQuery, userId);
			const { body = {} } = esResults;
			const { hits: esHits = {} } = body;
			const { hits = [], total: { value } } = esHits;

			searchResults.totalCount = value;
			searchResults.docs = this.cleanESResults(hits, userId);

			//console.log(searchResults);

			return searchResults;

		} catch (e) {
			const { message } = e;
			this.logger.error(message, 'G4W6UNW', userId);
			throw e;
		}
	}

	cleanESResults(hits, userId) {
		const results = [];
		try {
			hits.forEach(hit => {
				const result = this.jbookSearchUtility.parseFields(hit['_source'], false, 'elasticSearch');

				switch (result.budgetType) {
					case 'rdte':
						result.budgetType = 'rdoc';
						break;
					case 'om':
						result.budgetType = 'odoc';
						break;
					case 'procurement':
						result.budgetType = 'pdoc';
						break;
					default:
						break;
				}

				results.push(result);
			});

			return results;
		} catch (e) {
			const { message } = e;
			this.logger.error(message, '8V1IZLH', userId);
			return results;
		}
	}

	async postgresDocumentSearch(req, userId, res, statusExport = false)  {
		try {
			const {
				offset,
				searchText,
				jbookSearchSettings,
				exportSearch
			} = req.body;

			const perms = req.permissions;

			const hasSearchText = searchText && searchText !== '';
			let limit = 18;

			let keywordIds = undefined;

			keywordIds = {pdoc: [], rdoc: [], om: []};
			const assoc_query = `SELECT ARRAY_AGG(distinct pdoc_id) filter (where pdoc_id is not null) as pdoc_ids,
							ARRAY_AGG(distinct rdoc_id) filter (where rdoc_id is not null) as rdoc_ids,
							ARRAY_AGG(distinct om_id) filter (where om_id is not null) as om_ids FROM keyword_assoc`;
			const assoc_results = await KEYWORD_ASSOC.sequelize.query(assoc_query);
			keywordIds.pdoc = assoc_results[0][0].pdoc_ids ? assoc_results[0][0].pdoc_ids.map(i => Number(i)) : [0];
			keywordIds.rdoc = assoc_results[0][0].rdoc_ids ? assoc_results[0][0].rdoc_ids.map(i => Number(i)) : [0];
			keywordIds.om = assoc_results[0][0].om_ids ? assoc_results[0][0].om_ids.map(i => Number(i)) : [0];

			const keywordIdsParam = jbookSearchSettings.hasKeywords !== undefined && jbookSearchSettings.hasKeywords.length !== 0 ? keywordIds : null;

			const [pSelect, rSelect, oSelect] = this.jbookSearchUtility.buildSelectQuery();
			const [pWhere, rWhere, oWhere] = this.jbookSearchUtility.buildWhereQuery(jbookSearchSettings, hasSearchText, keywordIdsParam, perms, userId);
			const pQuery = pSelect + pWhere;
			const rQuery = rSelect + rWhere;
			const oQuery = oSelect + oWhere;

			let giantQuery = ``;

			// setting up promise.all
			if (!jbookSearchSettings.budgetType || jbookSearchSettings.budgetType.indexOf('Procurement') !== -1) {
				giantQuery = pQuery;
			}
			if (!jbookSearchSettings.budgetType || jbookSearchSettings.budgetType.indexOf('RDT&E') !== -1) {
				if (giantQuery.length === 0) {
					giantQuery = rQuery;
				} else {
					giantQuery += ` UNION ALL ` + rQuery;
				}
			}
			if (!jbookSearchSettings.budgetType || jbookSearchSettings.budgetType.indexOf('O&M') !== -1) {
				if (giantQuery.length === 0) {
					giantQuery = oQuery;
				} else {
					giantQuery += ` UNION ALL ` + oQuery;
				}
			}

			const structuredSearchText = this.searchUtility.getQueryAndSearchTerms(searchText);

			// grab counts, can be optimized with promise.all
			const totalCountQuery = `SELECT COUNT(*) FROM (` + giantQuery + `) as combinedRows;`;
			let totalCount = await this.db.jbook.query(totalCountQuery, {
				replacements: {
					searchText: structuredSearchText,
					offset,
					limit
				}
			});
			totalCount = totalCount[0][0].count;

			const queryEnd = this.jbookSearchUtility.buildEndQuery(jbookSearchSettings.sort);
			giantQuery += queryEnd;

			if (!exportSearch && !statusExport) {
				giantQuery += ' LIMIT :limit';
			}
			giantQuery += ' OFFSET :offset;';

			let data2 = await this.db.jbook.query(giantQuery, {
				replacements: {
					searchText: structuredSearchText,
					offset,
					limit
				}
			});

			// new data combined: no need to parse because we renamed the column names in the query to match the frontend
			let returnData = data2[0];

			// set the keywords
			returnData.map(doc => {
				const typeMap = {
					'Procurement': 'pdoc',
					'RDT&E': 'rdoc',
					'O&M': 'odoc'
				};
				doc.budgetType = typeMap[doc.type];
				doc.hasKeywords = keywordIds[typeMap[doc.type]]?.indexOf(doc.id) !== -1;
				return doc;
			});

			if (exportSearch) {
				const csvStream = await this.reports.createCsvStream({docs: returnData}, userId);
				csvStream.pipe(res);
				res.status(200);
			} else {
				return {
					totalCount,
					docs: returnData
				}
			}
		} catch (e) {
			const { message } = e;
			this.logger.error(message, 'O1U2WBP', userId);
			throw e;
		}
	}

	async callFunctionHelper(req, userId, res) {
		const { functionName } = req.body;

		try {
			switch (functionName) {
				case 'getDataForFilters':
					return await this.getDataForFilters(req, userId);
				case 'getDataForReviewStatus':
					return await this.getExcelDataForReviewStatus(req, userId, res);
				default:
					this.logger.error(
						`There is no function called ${functionName} defined in the JBookSearchHandler`,
						'71739D8',
						userId
					);
					return {};
			}
		} catch (err) {
			console.log(err);
			const { message } = err;
			this.logger.error(message, 'D03Z7K6', userId);
			throw err;
		}


	}

	async getDataForFilters(req, userId) {
		let returnData = {};

		const reviewQuery = `SELECT array_agg(DISTINCT primary_reviewer) as primaryReviewer,
	       array_agg(DISTINCT service_reviewer) as serviceReviewer,
	       array_agg(DISTINCT service_secondary_reviewer) as serviceSecondaryReviewer,
	       array_agg(DISTINCT review_status) as reviewStatus,
	       array_agg(DISTINCT primary_class_label) as primaryClassLabel,
	       array_agg(DISTINCT source_tag) as sourceTag
	       FROM review`;
		const reviewData = await this.db.jbook.query(reviewQuery, { replacements: {} });

		if (reviewData[0][0]) {
			returnData = reviewData[0][0];
		}

		returnData.budgetYear = [];
		returnData.serviceAgency = [];

		const pdocQuery = `SELECT array_agg(DISTINCT "P40-04_BudgetYear") as budgetYear, array_agg(DISTINCT "P40-06_Organization") as serviceAgency FROM pdoc`;
		const odocQuer = `SELECT array_agg(DISTINCT "budget_year") as budgetYear, array_agg(DISTINCT "organization") as serviceAgency FROM om`;
		const rdocQuer = `SELECT array_agg(DISTINCT "BudgetYear") as budgetYear, array_agg(DISTINCT "Organization") as serviceAgency FROM rdoc`;

		const mainQuery = `${pdocQuery} UNION ALL ${odocQuer} UNION ALL ${rdocQuer};`

		const agencyYearData = await this.db.jbook.query(mainQuery, { replacements: {} });

		returnData.budgetYear = [];
		returnData.serviceAgency = [];

		if (agencyYearData[0].length > 0) {
			agencyYearData[0].forEach(data => {
				returnData.budgetYear = [...new Set([...returnData.budgetYear, ...data.budgetyear])];
				returnData.serviceAgency = [...new Set([...returnData.serviceAgency, ...data.serviceagency])];
			})
		}


		const serviceReviewers = Array.from(new Set([...returnData.servicereviewer, ...returnData.servicesecondaryreviewer]));

		// cover null index of service reviewer + service agency
		let index = serviceReviewers.indexOf('');
		if (index !== undefined) {
			serviceReviewers.splice(index, 1);
		}
		returnData.servicereviewer = serviceReviewers;

		index = returnData.serviceAgency.indexOf('');
		if (index !== undefined) {
			returnData.serviceAgency.splice(index, 1);
		}

		returnData.serviceAgency.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
		returnData.budgetYear.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
		returnData.serviceAgency.push(null);
		returnData.reviewstatus.push(null);

		return returnData;
	}

	async getExcelDataForReviewStatus(req, userId, res) {
		try {
			const workbook = new ExcelJS.Workbook();

			const sheet = workbook.addWorksheet('Review Status', {properties: {tabColor: {argb: 'FFC0000'}}});

			sheet.columns = [
				{width: 14},
				{width: 6},
				{width: 14},
				{width: 14},
				{width: 14},
				{width: 6},
				{width: 14},
				{width: 14},
				{width: 14},
				{width: 14},
				{width: 6},
			];
			sheet.mergeCells('A1:A3');
			sheet.getCell('A1').value = `As of: ${moment().format('DDMMMYY')}`;
			sheet.getCell('A1:A3').fill = excelStyles.yellowFill;

			sheet.mergeCells('B1:E1');
			sheet.getCell('B1').value = 'Has AI Keywords';
			sheet.getCell('B1:E1').fill = excelStyles.greyFill;
			sheet.mergeCells('F1:J1');
			sheet.getCell('F1').value = 'Has No AI Keywords';
			sheet.getCell('F1:J1').fill = excelStyles.greyFill;

			sheet.mergeCells('C2:E2');
			sheet.getCell('C2').value = 'Review Status';
			sheet.mergeCells('G2:I2');
			sheet.getCell('G2').value = 'Review Status (JAIC 2021 Review Only)';

			['A1:A3', 'B1:E1', 'F1:J1', 'C2:E2', 'G2:I2', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3'].forEach(col => {
				sheet.getCell(`${col}`).font = {bold: true};
				sheet.getCell(`${col}`).alignment = excelStyles.middleAlignment;
				sheet.getCell(`${col}`).border = excelStyles.borderAllThin;
			});

			sheet.getCell('B3').value = 'Total';
			sheet.getCell('C3').value = 'Service';
			sheet.getCell('D3').value = 'POC';
			sheet.getCell('E3').value = 'Finished';
			sheet.getCell('F3').value = 'Total';
			sheet.getCell('G3').value = 'Service';
			sheet.getCell('H3').value = 'POC';
			sheet.getCell('I3').value = 'Finished';
			sheet.getCell('J3').value = 'Other Projects';
			sheet.getCell('K3').value = 'Total';
			sheet.getCell('A4').value = 'FY22 Results';
			sheet.getCell('A5').value = 'Army';
			sheet.getCell('A6').value = 'Air Force';
			sheet.getCell('A7').value = 'Navy';
			sheet.getCell('A8').value = 'USMC';
			sheet.getCell('A9').value = 'SOCOM';
			sheet.getCell('A10').value = 'OSD';
			sheet.getCell('A11').value = 'Joint Staff';
			sheet.getCell('A12').value = 'Other Agencies';
			sheet.getCell('A13').value = 'FY21 Results';
			sheet.getCell('A14').value = 'Army';
			sheet.getCell('A15').value = 'Air Force';
			sheet.getCell('A16').value = 'Navy';
			sheet.getCell('A17').value = 'USMC';
			sheet.getCell('A18').value = 'SOCOM';
			sheet.getCell('A19').value = 'OSD';
			sheet.getCell('A20').value = 'Joint Staff';
			sheet.getCell('A21').value = 'Other Agencies';
			sheet.getCell('A22').value = 'All Results';

			sheet.mergeCells('K4:K12');
			sheet.mergeCells('B13:E13');
			sheet.mergeCells('F13:J13');
			sheet.mergeCells('K13:K21');
			sheet.mergeCells('B22:E22');
			sheet.mergeCells('F22:J22');

			sheet.getCell('B13:E13').alignment = excelStyles.leftAlignment;
			sheet.getCell('B22:E22').alignment = excelStyles.leftAlignment;
			sheet.getCell('F13:J13').alignment = excelStyles.leftAlignment;
			sheet.getCell('F22:J22').alignment = excelStyles.leftAlignment;
			sheet.getCell('K4:K12').alignment = excelStyles.topAlignment;
			sheet.getCell('K13:K21').alignment = excelStyles.topAlignment;

			['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4:K12', 'A13', 'B13:E13', 'F13:J13', 'K13:K21', 'B22:E22', 'F22:J22', 'K22', 'A22', 'J2'].forEach(col => {
				sheet.getCell(`${col}`).font = {bold: true};
				sheet.getCell(`${col}`).border = excelStyles.borderAllThin;
			});

			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}5`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}6`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}7`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}8`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}9`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}10`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}11`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}12`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}14`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}15`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}16`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}17`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}18`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}19`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}20`).border = excelStyles.borderAllThin;
			});
			['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
				sheet.getCell(`${col}21`).border = excelStyles.borderAllThin;
			});

			const results = await this.documentSearch({
				body: {
					offset: 0,
					searchText: '',
					jbookSearchSettings: {
						budgetYear: ['2022', '2021']
					},
					exportSearch: false
				}
			}, userId, null, true);

			const counts = {
				fy22: {
					hasKeywords: {
						army: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						af: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						navy: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						usmc: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						socom: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						osd: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						js: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						other: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						total: 0,
						service: 0,
						poc: 0,
						finished: 0
					},
					noKeywords: {
						army: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						af: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						navy: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						usmc: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						socom: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						osd: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						js: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						other: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						total: 0,
						service: 0,
						poc: 0,
						finished: 0
					},
				},
				fy21: {
					hasKeywords: {
						army: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						af: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						navy: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						usmc: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						socom: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						osd: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						js: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						other: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						total: 0,
						service: 0,
						poc: 0,
						finished: 0
					},
					noKeywords: {
						army: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						af: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						navy: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						usmc: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						socom: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						osd: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						js: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						other: {
							total: 0,
							service: 0,
							poc: 0,
							finished: 0
						},
						total: 0,
						service: 0,
						poc: 0,
						finished: 0
					},
				}
			}

			if (results && results.docs) {
				results.docs.forEach(result => {
					let serviceKey;
					let reviewStep = 'service';
					let keywordsKey;
					let yearKey;

					switch (result.serviceAgency) {
						case 'Army':
							serviceKey = 'army';
							break;
						case 'Air Force (AF)':
							serviceKey = 'af';
							break;
						case 'Navy':
							serviceKey = 'navy';
							break;
						case 'The Joint Staff (TJS)':
							serviceKey = 'js';
							break;
						case 'United States Special Operations Command (SOCOM)':
							serviceKey = 'socom';
							break;
						case 'Office of the Secretary Of Defense (OSD)':
							serviceKey = 'osd';
							break;
						case 'US Marine Corp (USMC)':
							serviceKey = 'usmc';
							break;
						default:
							serviceKey = 'other';
							break;
					}

					if (result.primaryReviewStatus === 'Finished Review') reviewStep = 'service';
					if (result.serviceReviewStatus === 'Finished Review') reviewStep = 'poc';
					if (result.pocReviewStatus === 'Finished Review') reviewStep = 'finished';

					if (result.hasKeywords === true) {
						keywordsKey = 'hasKeywords';
					}
					else {
						keywordsKey = 'noKeywords';
					}

					if (result.budgetYear ===  '2022') {
						yearKey = 'fy22';
					} else {
						yearKey = 'fy21';
					}

					counts[yearKey][keywordsKey][serviceKey].total = counts[yearKey][keywordsKey][serviceKey].total + 1;
					counts[yearKey][keywordsKey].total = counts[yearKey][keywordsKey].total + 1;
					counts[yearKey][keywordsKey][serviceKey][reviewStep] = counts[yearKey][keywordsKey][serviceKey][reviewStep] + 1;
					counts[yearKey][keywordsKey][reviewStep] = counts[yearKey][keywordsKey][reviewStep] + 1;
				});
			}

			// FY22 Totals
			sheet.getCell('B4').value = counts.fy22.hasKeywords.total;
			sheet.getCell('C4').value = counts.fy22.hasKeywords.service;
			sheet.getCell('D4').value = counts.fy22.hasKeywords.poc;
			sheet.getCell('E4').value = counts.fy22.hasKeywords.finished;
			sheet.getCell('F4').value = counts.fy22.noKeywords.total;
			sheet.getCell('G4').value = counts.fy22.noKeywords.service;
			sheet.getCell('H4').value = counts.fy22.noKeywords.poc;
			sheet.getCell('I4').value = counts.fy22.noKeywords.finished;
			sheet.getCell('J4').value = counts.fy22.noKeywords.total - (counts.fy22.noKeywords.service + counts.fy22.noKeywords.poc + counts.fy22.noKeywords.finished);
			sheet.getCell('K4').value = counts.fy22.hasKeywords.total + counts.fy22.noKeywords.total;

			//FY22  Army
			sheet.getCell('B5').value = counts.fy22.hasKeywords.army.total;
			sheet.getCell('C5').value = counts.fy22.hasKeywords.army.service;
			sheet.getCell('D5').value = counts.fy22.hasKeywords.army.poc;
			sheet.getCell('E5').value = counts.fy22.hasKeywords.army.finished;
			sheet.getCell('F5').value = counts.fy22.noKeywords.army.total;
			sheet.getCell('G5').value = counts.fy22.noKeywords.army.service;
			sheet.getCell('H5').value = counts.fy22.noKeywords.army.poc;
			sheet.getCell('I5').value = counts.fy22.noKeywords.army.finished;
			sheet.getCell('J5').value = counts.fy22.noKeywords.army.total - (counts.fy22.noKeywords.army.service + counts.fy22.noKeywords.army.poc + counts.fy22.noKeywords.army.finished);

			//FY22  AF
			sheet.getCell('B6').value = counts.fy22.hasKeywords.af.total;
			sheet.getCell('C6').value = counts.fy22.hasKeywords.af.service;
			sheet.getCell('D6').value = counts.fy22.hasKeywords.af.poc;
			sheet.getCell('E6').value = counts.fy22.hasKeywords.af.finished;
			sheet.getCell('F6').value = counts.fy22.noKeywords.af.total;
			sheet.getCell('G6').value = counts.fy22.noKeywords.af.service;
			sheet.getCell('H6').value = counts.fy22.noKeywords.af.poc;
			sheet.getCell('I6').value = counts.fy22.noKeywords.af.finished;
			sheet.getCell('J6').value = counts.fy22.noKeywords.af.total - (counts.fy22.noKeywords.af.service + counts.fy22.noKeywords.af.poc + counts.fy22.noKeywords.af.finished);

			//FY22  Navy
			sheet.getCell('B7').value = counts.fy22.hasKeywords.navy.total;
			sheet.getCell('C7').value = counts.fy22.hasKeywords.navy.service;
			sheet.getCell('D7').value = counts.fy22.hasKeywords.navy.poc;
			sheet.getCell('E7').value = counts.fy22.hasKeywords.navy.finished;
			sheet.getCell('F7').value = counts.fy22.noKeywords.navy.total;
			sheet.getCell('G7').value = counts.fy22.noKeywords.navy.service;
			sheet.getCell('H7').value = counts.fy22.noKeywords.navy.poc;
			sheet.getCell('I7').value = counts.fy22.noKeywords.navy.finished;
			sheet.getCell('J7').value = counts.fy22.noKeywords.navy.total - (counts.fy22.noKeywords.navy.service + counts.fy22.noKeywords.navy.poc + counts.fy22.noKeywords.navy.finished);

			//FY22  USMC
			sheet.getCell('B8').value = counts.fy22.hasKeywords.usmc.total;
			sheet.getCell('C8').value = counts.fy22.hasKeywords.usmc.service;
			sheet.getCell('D8').value = counts.fy22.hasKeywords.usmc.poc;
			sheet.getCell('E8').value = counts.fy22.hasKeywords.usmc.finished;
			sheet.getCell('F8').value = counts.fy22.noKeywords.usmc.total;
			sheet.getCell('G8').value = counts.fy22.noKeywords.usmc.service;
			sheet.getCell('H8').value = counts.fy22.noKeywords.usmc.poc;
			sheet.getCell('I8').value = counts.fy22.noKeywords.usmc.finished;
			sheet.getCell('J8').value = counts.fy22.noKeywords.usmc.total - (counts.fy22.noKeywords.usmc.service + counts.fy22.noKeywords.usmc.poc + counts.fy22.noKeywords.usmc.finished);

			//FY22  SOCOM
			sheet.getCell('B9').value = counts.fy22.hasKeywords.socom.total;
			sheet.getCell('C9').value = counts.fy22.hasKeywords.socom.service;
			sheet.getCell('D9').value = counts.fy22.hasKeywords.socom.poc;
			sheet.getCell('E9').value = counts.fy22.hasKeywords.socom.finished;
			sheet.getCell('F9').value = counts.fy22.noKeywords.socom.total;
			sheet.getCell('G9').value = counts.fy22.noKeywords.socom.service;
			sheet.getCell('H9').value = counts.fy22.noKeywords.socom.poc;
			sheet.getCell('I9').value = counts.fy22.noKeywords.socom.finished;
			sheet.getCell('J9').value = counts.fy22.noKeywords.socom.total - (counts.fy22.noKeywords.socom.service + counts.fy22.noKeywords.socom.poc + counts.fy22.noKeywords.socom.finished);

			//FY22  OSD
			sheet.getCell('B10').value = counts.fy22.hasKeywords.osd.total;
			sheet.getCell('C10').value = counts.fy22.hasKeywords.osd.service;
			sheet.getCell('D10').value = counts.fy22.hasKeywords.osd.poc;
			sheet.getCell('E10').value = counts.fy22.hasKeywords.osd.finished;
			sheet.getCell('F10').value = counts.fy22.noKeywords.osd.total;
			sheet.getCell('G10').value = counts.fy22.noKeywords.osd.service;
			sheet.getCell('H10').value = counts.fy22.noKeywords.osd.poc;
			sheet.getCell('I10').value = counts.fy22.noKeywords.osd.finished;
			sheet.getCell('J10').value = counts.fy22.noKeywords.osd.total - (counts.fy22.noKeywords.osd.service + counts.fy22.noKeywords.osd.poc + counts.fy22.noKeywords.osd.finished);

			//FY22  JS
			sheet.getCell('B11').value = counts.fy22.hasKeywords.js.total;
			sheet.getCell('C11').value = counts.fy22.hasKeywords.js.service;
			sheet.getCell('D11').value = counts.fy22.hasKeywords.js.poc;
			sheet.getCell('E11').value = counts.fy22.hasKeywords.js.finished;
			sheet.getCell('F11').value = counts.fy22.noKeywords.js.total;
			sheet.getCell('G11').value = counts.fy22.noKeywords.js.service;
			sheet.getCell('H11').value = counts.fy22.noKeywords.js.poc;
			sheet.getCell('I11').value = counts.fy22.noKeywords.js.finished;
			sheet.getCell('J11').value = counts.fy22.noKeywords.js.total - (counts.fy22.noKeywords.js.service + counts.fy22.noKeywords.js.poc + counts.fy22.noKeywords.js.finished);

			//FY22  Other
			sheet.getCell('B12').value = counts.fy22.hasKeywords.other.total;
			sheet.getCell('C12').value = counts.fy22.hasKeywords.other.service;
			sheet.getCell('D12').value = counts.fy22.hasKeywords.other.poc;
			sheet.getCell('E12').value = counts.fy22.hasKeywords.other.finished;
			sheet.getCell('F12').value = counts.fy22.noKeywords.other.total;
			sheet.getCell('G12').value = counts.fy22.noKeywords.other.service;
			sheet.getCell('H12').value = counts.fy22.noKeywords.other.poc;
			sheet.getCell('I12').value = counts.fy22.noKeywords.other.finished;
			sheet.getCell('J12').value = counts.fy22.noKeywords.other.total - (counts.fy22.noKeywords.other.service + counts.fy22.noKeywords.other.poc + counts.fy22.noKeywords.other.finished);

			// FY21
			sheet.getCell('B13').value = counts.fy21.hasKeywords.total;
			sheet.getCell('F13').value = counts.fy21.noKeywords.total;
			sheet.getCell('K13').value = counts.fy21.noKeywords.total + counts.fy21.hasKeywords.total;
			sheet.getCell('B14').value = counts.fy21.hasKeywords.army.total;
			sheet.getCell('F14').value = counts.fy21.noKeywords.army.total;
			sheet.getCell('B15').value = counts.fy21.hasKeywords.af.total;
			sheet.getCell('F15').value = counts.fy21.noKeywords.af.total;
			sheet.getCell('B16').value = counts.fy21.hasKeywords.navy.total;
			sheet.getCell('F16').value = counts.fy21.noKeywords.navy.total;
			sheet.getCell('B17').value = counts.fy21.hasKeywords.usmc.total;
			sheet.getCell('F17').value = counts.fy21.noKeywords.usmc.total;
			sheet.getCell('B18').value = counts.fy21.hasKeywords.socom.total;
			sheet.getCell('F18').value = counts.fy21.noKeywords.socom.total;
			sheet.getCell('B19').value = counts.fy21.hasKeywords.osd.total;
			sheet.getCell('F19').value = counts.fy21.noKeywords.osd.total;
			sheet.getCell('B20').value = counts.fy21.hasKeywords.js.total;
			sheet.getCell('F20').value = counts.fy21.noKeywords.js.total;
			sheet.getCell('B21').value = counts.fy21.hasKeywords.other.total;
			sheet.getCell('F21').value = counts.fy21.noKeywords.other.total;
			sheet.getCell('B22').value = counts.fy22.hasKeywords.total + counts.fy21.hasKeywords.total;
			sheet.getCell('F22').value = counts.fy22.noKeywords.total + counts.fy21.noKeywords.total;
			sheet.getCell('K22').value = sheet.getCell('K4').value + sheet.getCell('K13').value;


			res.status(200);
			res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.setHeader('Content-Disposition', `attachment; filename=${'data'}.xlsx`);
			await workbook.xlsx.write(res);
			res.end();
		} catch (e) {
			const { message } = e;
			this.logger.error(message, 'WW05F8X', userId);
			throw e;
		}
	}

}

module.exports = JBookSearchHandler;
