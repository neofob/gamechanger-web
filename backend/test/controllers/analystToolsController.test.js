const assert = require('assert');
const { constructorOptionsMock } = require('../resources/testUtility');
const { AnalystToolsController } = require('../../node_app/controllers/analystToolsController');
const { reqMock, resMock } = require('../resources/testUtility');

describe('AnalystToolsController', function () {
	const opts = {
		...constructorOptionsMock,
		constants: {
			GAME_CHANGER_OPTS: {
				allow_daterange: true,
			},
		},
		compareFeedbackModel: {
			findOrCreate: async () => {
				return Promise.resolve([{}, true]);
			},
		},
		mlApi: {
			getSentenceTransformerResultsForCompare() {
				return {
					0: {
						score: 0.9682086706161499,
						id: 'AFH 36-2235V12.pdf_279',
						text: 'a valid test measures what it s supposed to measure a reliable test yields consistent results',
					},
					1: {
						score: 0.9666107296943665,
						id: 'CJCSI 6723.01B.pdf_272',
						text: 'd testable is the requirement testable would an independent testing party be able to determine how if the requirement has been satisfied',
					},
					2: {
						score: 0.9502548575401306,
						id: 'AOP 21.pdf_605',
						text: 'for the evaluation of the test data one of two different evaluation methods can be selected',
					},
					3: {
						score: 0.9430625438690186,
						id: 'AECTP 400.pdf_4161',
						text: 'a examine the test item and carry out any required performance checks',
					},
					4: {
						score: 0.847284734249115,
						id: 'DoDI 1304.12E.pdf_52',
						text: 'the purposes of the do d student testing program are to',
					},
					paragraphIdBeingMatched: 0,
				};
			},
		},
		dataLibrary: {
			queryElasticSearch() {
				return {
					body: {
						took: 83,
						timed_out: false,
						_shards: { total: 3, successful: 3, skipped: 0, failed: 0 },
						hits: {
							total: { value: 5, relation: 'eq' },
							max_score: 1,
							hits: [
								{
									_index: 'gamechanger_sans_abbreviations',
									_type: '_doc',
									_id: '1527d6589a258abc2d3f963b798ec5658240c70e9208b1202e6af8948367a50c',
									_score: 1,
									_source: { kw_doc_score_r: null },
									fields: {
										display_title_s: [
											'DoDI 1304.12E: DoD Military Personnel Accession Testing Programs',
										],
										display_org_s: ['Dept. of Defense'],
										crawler_used_s: ['dod_issuances'],
										doc_num: ['1304.12E'],
										summary_30: [
											'USD, except for test score data routinely provided to applicants, the Military Services, and policy on military personnel accession testing and shall ensure that under the USD, the',
										],
										is_revoked_b: [false],
										doc_type: ['DoDI'],
										title: ['DoD Military Personnel Accession Testing Programs'],
										type: ['document'],
										keyw_5: [
											'testing sessions',
											'military services',
											'testing program',
											'steering committee',
											'public service',
											'overseas testing',
											'military service',
											'materials required',
											'enlistment tests',
											'dodi 12e',
										],
										filename: ['DoDI 1304.12E.pdf'],
										access_timestamp_dt: ['2021-08-28T13:30:39'],
										id: ['DoDI 1304.12E.pdf_0'],
										display_doc_type_s: ['Instruction'],
										ref_list: ['DoD 5025.1-M', 'DoDD 1304.12', 'DoDD 1145.2E', 'DoDI 1304.12E'],
										publication_date_dt: ['2005-09-20T00:00:00'],
										page_count: [9],
									},
									inner_hits: {
										paragraphs: {
											hits: {
												total: { value: 1, relation: 'eq' },
												max_score: 1,
												hits: [
													{
														_index: 'gamechanger_sans_abbreviations',
														_type: '_doc',
														_id: '1527d6589a258abc2d3f963b798ec5658240c70e9208b1202e6af8948367a50c',
														_nested: { field: 'paragraphs', offset: 52 },
														_score: 1,
														_source: {
															type: 'paragraph',
															filename: 'DoDI 1304.12E.pdf',
															par_inc_count: 52,
															id: 'DoDI 1304.12E.pdf_52',
															par_count_i: 14,
															page_num_i: 2,
															par_raw_text_t:
																'3.2.1 .The purposes of the Do D Student Testing Program are to : ',
															entities: {
																ORG_s: [],
																GPE_s: [],
																NORP_s: [],
																LAW_s: [],
																LOC_s: [],
																PERSON_s: [],
															},
														},
													},
												],
											},
										},
									},
								},
								{
									_index: 'gamechanger_sans_abbreviations',
									_type: '_doc',
									_id: '1519b6c3531b89356ee10e339c035b3eec0aa5cebc859f5156a30726e5c9f0bf',
									_score: 1,
									_source: { kw_doc_score_r: null },
									fields: {
										display_title_s: [
											'AFH 36-2235V12: INFORMATION FOR DESIGNERS OF INSTRUCTIONAL SYSTEMS TEST AND MEASUREMENT HANDBOOK',
										],
										display_org_s: ['Dept. of the Air Force'],
										crawler_used_s: ['air_force_pubs'],
										doc_num: ['36-2235V12'],
										summary_30: [
											'Develop predictive or performance test items to measure the Performance test items rate the student on the actual Rating scales that measure criterion performance require test Instructional material required by the students. Use a single-group of students if the instructional materials the instructional materials as required to help the students CR test analysis statistics indicate how far a students score Match the test item question closely to the instructional objective it is supposed to performance not specifically learned during instruction, the CRT is a transfer test.',
										],
										is_revoked_b: [false],
										doc_type: ['AFH'],
										title: [
											'INFORMATION FOR DESIGNERS OF INSTRUCTIONAL SYSTEMS TEST AND MEASUREMENT HANDBOOK',
										],
										type: ['document'],
										keyw_5: [
											'test items',
											'test item',
											'instructional materials',
											'instructional system',
											'training equipment',
											'lessons learned',
											'internal evaluation',
											'educational technology',
											'training systems',
											'intellectual skills',
										],
										filename: ['AFH 36-2235V12.pdf'],
										access_timestamp_dt: ['2021-08-26T22:15:48'],
										id: ['AFH 36-2235V12.pdf_0'],
										display_doc_type_s: ['Document'],
										ref_list: [
											'AFMAN 37-139',
											'AFMAN 36-2234',
											'AFH 36-2235',
											'AFH 36-2235, Volume 12',
											'AFM 36-22',
											'AF 1284',
										],
										publication_date_dt: ['2002-11-01T00:00:00'],
										page_count: [240],
									},
									inner_hits: {
										paragraphs: {
											hits: {
												total: { value: 1, relation: 'eq' },
												max_score: 1,
												hits: [
													{
														_index: 'gamechanger_sans_abbreviations',
														_type: '_doc',
														_id: '1519b6c3531b89356ee10e339c035b3eec0aa5cebc859f5156a30726e5c9f0bf',
														_nested: { field: 'paragraphs', offset: 279 },
														_score: 1,
														_source: {
															type: 'paragraph',
															filename: 'AFH 36-2235V12.pdf',
															par_inc_count: 279,
															id: 'AFH 36-2235V12.pdf_279',
															par_count_i: 6,
															page_num_i: 26,
															par_raw_text_t:
																'A valid test measures what it ’s supposed to measure .A reliable test yields consistent results .',
															entities: {
																ORG_s: [],
																GPE_s: [],
																NORP_s: [],
																LAW_s: [],
																LOC_s: [],
																PERSON_s: [],
															},
														},
													},
												],
											},
										},
									},
								},
								{
									_index: 'gamechanger_sans_abbreviations',
									_type: '_doc',
									_id: '03a267efb18a7a6abdcdfabcc0d8923c9bbd06f86c2d6749b3a7aca20eb219b2',
									_score: 1,
									_source: { kw_doc_score_r: null },
									fields: {
										display_title_s: [
											'CJCSI 6723.01B: Global Combat Support System Family of Systems Requirements Management Structure',
										],
										display_org_s: ['Joint Chiefs of Staff'],
										crawler_used_s: ['jcs_pubs'],
										doc_num: ['6723.01B'],
										summary_30: [
											'Staff with information concerning GCSS FOS requirements, objectives, and Changes to existing Service systems that provide data to GCSS FOS Provide for information to the Joint Staff J-4 and J-6, Service GCSS FOS',
										],
										is_revoked_b: [false],
										doc_type: ['CJCSI'],
										title: [
											'Global Combat Support System Family of Systems Requirements Management Structure',
										],
										type: ['document'],
										keyw_5: [
											'gcss fos',
											'joint staff',
											'joint chiefs',
											'intentionally blank',
											'information assurance',
											'desired functionality',
											'combatant command',
											'working group',
											'testing requirements',
											'technical architectures',
										],
										filename: ['CJCSI 6723.01B.pdf'],
										access_timestamp_dt: ['2021-04-20T07:50:05'],
										id: ['CJCSI 6723.01B.pdf_0'],
										display_doc_type_s: ['Instruction'],
										ref_list: [
											'DoDD 5000.01',
											'DoDD 4630.5',
											'DoDI 5000.02',
											'CJCSI 6723.01B',
											'CJCSI 6723.01A',
											'CJCSI 3170.01',
											'CJCSI 5123.01',
											'CJCSI 6212.01',
											'CJCSM 3170.01',
											'CJCSM 3150.05',
											'JP 4-0',
										],
										publication_date_dt: ['2009-07-31T00:00:00'],
										page_count: [36],
									},
									inner_hits: {
										paragraphs: {
											hits: {
												total: { value: 1, relation: 'eq' },
												max_score: 1,
												hits: [
													{
														_index: 'gamechanger_sans_abbreviations',
														_type: '_doc',
														_id: '03a267efb18a7a6abdcdfabcc0d8923c9bbd06f86c2d6749b3a7aca20eb219b2',
														_nested: { field: 'paragraphs', offset: 272 },
														_score: 1,
														_source: {
															type: 'paragraph',
															filename: 'CJCSI 6723.01B.pdf',
															par_inc_count: 272,
															id: 'CJCSI 6723.01B.pdf_272',
															par_count_i: 9,
															page_num_i: 26,
															par_raw_text_t:
																'd . Testable .Is the requirement testable ?Would an independent testing party be able to determine how/if the requirement has been satisfied ?',
															entities: {
																ORG_s: [],
																GPE_s: [],
																NORP_s: [],
																LAW_s: [],
																LOC_s: [],
																PERSON_s: [],
															},
														},
													},
												],
											},
										},
									},
								},
								{
									_index: 'gamechanger_sans_abbreviations',
									_type: '_doc',
									_id: '72c50469c8be702b475353c1d4e99ef39363a9e8b45498246b189980cb3accaf',
									_score: 1,
									_source: { kw_doc_score_r: 0.00001 },
									fields: {
										display_title_s: ['AECTP 400: MECHANICAL ENVIRONMENTAL TESTS'],
										display_org_s: ['NATO'],
										crawler_used_s: ['nato_stanag'],
										doc_num: ['400'],
										summary_30: [
											'Note 1: For the fixed frequency sinusoidal testing, if the materiel exhibits significant resonances in the bands When measured data is available, the SRS required for the test will be determined from shock base input time history; , acceleration, of duration (see Figure 1 for the vibration materiel response data during an in-service test. materiel response pulse, and input to the test item at the firing rate of the gun, see pyroshock testing, and comment for cases in which measured data are not available. item using the load and duration specified in the Test Instruction in',
										],
										is_revoked_b: [false],
										doc_type: ['AECTP'],
										title: ['MECHANICAL ENVIRONMENTAL TESTS'],
										type: ['document'],
										keyw_5: [
											'test item',
											'annex',
											'time trace',
											'measured data',
											'test method',
											'vertical test',
											'test results',
											'time traces',
											'time history',
											'edition',
										],
										filename: ['AECTP 400.pdf'],
										access_timestamp_dt: ['2021-04-20T07:50:08'],
										id: ['AECTP 400.pdf_0'],
										display_doc_type_s: ['Document'],
										ref_list: ['DoDD 4510.11', 'Title 40', 'AR 70-44', 'TM 55-2200-001-12'],
										publication_date_dt: ['2019-11-29T00:00:00'],
										page_count: [942],
									},
									inner_hits: {
										paragraphs: {
											hits: {
												total: { value: 1, relation: 'eq' },
												max_score: 1,
												hits: [
													{
														_index: 'gamechanger_sans_abbreviations',
														_type: '_doc',
														_id: '72c50469c8be702b475353c1d4e99ef39363a9e8b45498246b189980cb3accaf',
														_nested: { field: 'paragraphs', offset: 4161 },
														_score: 1,
														_source: {
															type: 'paragraph',
															filename: 'AECTP 400.pdf',
															par_inc_count: 4161,
															id: 'AECTP 400.pdf_4161',
															par_count_i: 7,
															page_num_i: 428,
															par_raw_text_t:
																'a . Examine the test item and carry out any required performance checks .',
															entities: {
																ORG_s: [],
																GPE_s: [],
																NORP_s: [],
																LAW_s: [],
																LOC_s: [],
																PERSON_s: [],
															},
														},
													},
												],
											},
										},
									},
								},
								{
									_index: 'gamechanger_sans_abbreviations',
									_type: '_doc',
									_id: '5fdf6900a3715b0def1c10ee341b29186a8898b3219b4dc5ac46860316aa195d',
									_score: 1,
									_source: { kw_doc_score_r: 0.00001 },
									fields: {
										display_title_s: [
											'AOP 21: INITIATION SYSTEMS: TESTING FOR THE ASSESSMENT OF DETONATING EXPLOSIVE COMPONENTS',
										],
										display_org_s: ['NATO'],
										crawler_used_s: ['nato_stanag'],
										doc_num: ['21'],
										summary_30: [
											'EXPLOSIVE COMPONENT WATER GAP TEST RESULT SHEET . EXPLOSIVE COMPONENT WATER GAP TEST RESULT SHEET . The results of testing of detonating explosive components for initiation systems',
										],
										is_revoked_b: [false],
										doc_type: ['AOP'],
										title: [
											'INITIATION SYSTEMS: TESTING FOR THE ASSESSMENT OF DETONATING EXPLOSIVE COMPONENTS',
										],
										type: ['document'],
										keyw_5: [
											'annex',
											'version 1',
											'water gap',
											'explosive component',
											'shock pressure',
											'shock gauges',
											'water column',
											'shock wave',
											'explosive components',
											'evaluation method',
										],
										filename: ['AOP 21.pdf'],
										access_timestamp_dt: ['2021-04-20T07:50:08'],
										id: ['AOP 21.pdf_0'],
										display_doc_type_s: ['Document'],
										publication_date_dt: ['2020-03-16T00:00:00'],
										page_count: [92],
									},
									inner_hits: {
										paragraphs: {
											hits: {
												total: { value: 1, relation: 'eq' },
												max_score: 1,
												hits: [
													{
														_index: 'gamechanger_sans_abbreviations',
														_type: '_doc',
														_id: '5fdf6900a3715b0def1c10ee341b29186a8898b3219b4dc5ac46860316aa195d',
														_nested: { field: 'paragraphs', offset: 605 },
														_score: 1,
														_source: {
															type: 'paragraph',
															filename: 'AOP 21.pdf',
															par_inc_count: 605,
															id: 'AOP 21.pdf_605',
															par_count_i: 8,
															page_num_i: 64,
															par_raw_text_t:
																'1 . For the evaluation of the test data one of two different evaluation methods can be selected .',
															entities: {
																ORG_s: [],
																GPE_s: [],
																NORP_s: [],
																LAW_s: [],
																LOC_s: [],
																PERSON_s: [],
															},
														},
													},
												],
											},
										},
									},
								},
							],
						},
					},
					statusCode: 200,
					headers: {
						date: 'Mon, 04 Oct 2021 02:12:20 GMT',
						'content-type': 'application/json; charset=UTF-8',
						'content-length': '11097',
						connection: 'keep-alive',
						'access-control-allow-origin': '*',
					},
					meta: {
						context: null,
						request: {
							params: {
								method: 'POST',
								path: '/gamechanger/_search',
								body: '{"_source":{"includes":["pagerank_r","kw_doc_score_r","topics_rs"]},"stored_fields":["filename","title","page_count","doc_type","doc_num","ref_list","id","summary_30","keyw_5","p_text","type","p_page","display_title_s","display_org_s","display_doc_type_s","is_revoked_b","access_timestamp_dt","publication_date_dt","crawler_used_s","topics_rs"],"query":{"bool":{"should":[{"nested":{"path":"paragraphs","inner_hits":{"_source":true,"highlight":{"fields":{"paragraphs.filename.search":{"number_of_fragments":0},"paragraphs.par_raw_text_t":{"fragment_size":200,"number_of_fragments":1}},"fragmenter":"span"}},"query":{"bool":{"must":[{"terms":{"paragraphs.id":["AFH 36-2235V12.pdf_279","CJCSI 6723.01B.pdf_272","AOP 21.pdf_605","AECTP 400.pdf_4161","DoDI 1304.12E.pdf_52","undefined"]}}]}}}}]}}}',
								querystring: '',
								headers: {
									'user-agent':
										'elasticsearch-js/7.13.0 (linux 5.10.47-linuxkit-x64; Node.js v14.17.6)',
									'x-elastic-client-meta': 'es=7.13.0,js=14.17.6,t=7.13.0,hc=14.17.6',
									'content-type': 'application/json',
									'content-length': '793',
								},
								timeout: 60000,
							},
							options: {},
							id: 1,
						},
						name: 'elasticsearch-js',
						connection: {
							url: 'https://vpc-gamechanger-iquxkyq2dobz4antllp35g2vby.us-east-1.es.amazonaws.com/',
							id: 'https://vpc-gamechanger-iquxkyq2dobz4antllp35g2vby.us-east-1.es.amazonaws.com/',
							headers: {},
							deadCount: 0,
							resurrectTimeout: 0,
							_openRequests: 0,
							status: 'alive',
							roles: { master: true, data: true, ingest: true, ml: false },
						},
						attempts: 0,
						aborted: false,
					},
				};
			},
		},
	};
	const controller = new AnalystToolsController(opts);

	describe('#compareDocument', () => {
		it('should compare documents', async (done) => {
			const req = {
				...reqMock,
				body: {
					paragraphs: ['Test'],
				},
			};

			let resCode;
			let resMsg;

			const res = {
				status(code) {
					resCode = code;
					return this;
				},
				send(msg) {
					resMsg = msg;
					return this;
				},
			};

			await controller.compareDocument(req, res);

			const expected = {
				doc_orgs: [],
				doc_types: [],
				docs: [
					{
						access_timestamp_dt: '2021-08-26T22:15:48',
						crawler_used_s: 'air_force_pubs',
						display_doc_type_s: 'Document',
						display_org_s: 'Dept. of the Air Force',
						display_title_s:
							'AFH 36-2235V12: INFORMATION FOR DESIGNERS OF INSTRUCTIONAL SYSTEMS TEST AND MEASUREMENT HANDBOOK',
						doc_num: '36-2235V12',
						doc_type: 'AFH',
						esIndex: null,
						filename: 'AFH 36-2235V12.pdf',
						id: 'AFH 36-2235V12.pdf_0',
						is_revoked_b: false,
						keyw_5: 'test items, test item, instructional materials, instructional system, training equipment, lessons learned, internal evaluation, educational technology, training systems, intellectual skills',
						pageHits: [],
						page_count: 240,
						paragraphs: [
							{
								entities: [],
								id: 'AFH 36-2235V12.pdf_279',
								page_num_i: 26,
								par_raw_text_t:
									'A valid test measures what it ’s supposed to measure .A reliable test yields consistent results .',
								paragraphIdBeingMatched: 0,
								score: 0.9682086706161499,
								score_display: undefined,
								transformTextMatch:
									'a valid test measures what it s supposed to measure a reliable test yields consistent results',
							},
						],
						publication_date_dt: '2002-11-01T00:00:00',
						ref_list: [
							'AFMAN 37-139',
							'AFMAN 36-2234',
							'AFH 36-2235',
							'AFH 36-2235, Volume 12',
							'AFM 36-22',
							'AF 1284',
						],
						score: 0.9682086706161499,
						summary_30:
							'Develop predictive or performance test items to measure the Performance test items rate the student on the actual Rating scales that measure criterion performance require test Instructional material required by the students. Use a single-group of students if the instructional materials the instructional materials as required to help the students CR test analysis statistics indicate how far a students score Match the test item question closely to the instructional objective it is supposed to performance not specifically learned during instruction, the CRT is a transfer test.',
						title: 'INFORMATION FOR DESIGNERS OF INSTRUCTIONAL SYSTEMS TEST AND MEASUREMENT HANDBOOK',
						type: 'document',
					},
					{
						access_timestamp_dt: '2021-04-20T07:50:05',
						crawler_used_s: 'jcs_pubs',
						display_doc_type_s: 'Instruction',
						display_org_s: 'Joint Chiefs of Staff',
						display_title_s:
							'CJCSI 6723.01B: Global Combat Support System Family of Systems Requirements Management Structure',
						doc_num: '6723.01B',
						doc_type: 'CJCSI',
						esIndex: null,
						filename: 'CJCSI 6723.01B.pdf',
						id: 'CJCSI 6723.01B.pdf_0',
						is_revoked_b: false,
						keyw_5: 'gcss fos, joint staff, joint chiefs, intentionally blank, information assurance, desired functionality, combatant command, working group, testing requirements, technical architectures',
						pageHits: [],
						page_count: 36,
						paragraphs: [
							{
								entities: [],
								id: 'CJCSI 6723.01B.pdf_272',
								page_num_i: 26,
								par_raw_text_t:
									'd . Testable .Is the requirement testable ?Would an independent testing party be able to determine how/if the requirement has been satisfied ?',
								paragraphIdBeingMatched: 0,
								score: 0.9666107296943665,
								score_display: undefined,
								transformTextMatch:
									'd testable is the requirement testable would an independent testing party be able to determine how if the requirement has been satisfied',
							},
						],
						publication_date_dt: '2009-07-31T00:00:00',
						ref_list: [
							'DoDD 5000.01',
							'DoDD 4630.5',
							'DoDI 5000.02',
							'CJCSI 6723.01B',
							'CJCSI 6723.01A',
							'CJCSI 3170.01',
							'CJCSI 5123.01',
							'CJCSI 6212.01',
							'CJCSM 3170.01',
							'CJCSM 3150.05',
							'JP 4-0',
						],
						score: 0.9666107296943665,
						summary_30:
							'Staff with information concerning GCSS FOS requirements, objectives, and Changes to existing Service systems that provide data to GCSS FOS Provide for information to the Joint Staff J-4 and J-6, Service GCSS FOS',
						title: 'Global Combat Support System Family of Systems Requirements Management Structure',
						type: 'document',
					},
					{
						access_timestamp_dt: '2021-04-20T07:50:08',
						crawler_used_s: 'nato_stanag',
						display_doc_type_s: 'Document',
						display_org_s: 'NATO',
						display_title_s:
							'AOP 21: INITIATION SYSTEMS: TESTING FOR THE ASSESSMENT OF DETONATING EXPLOSIVE COMPONENTS',
						doc_num: '21',
						doc_type: 'AOP',
						esIndex: null,
						filename: 'AOP 21.pdf',
						id: 'AOP 21.pdf_0',
						is_revoked_b: false,
						keyw_5: 'annex, version 1, water gap, explosive component, shock pressure, shock gauges, water column, shock wave, explosive components, evaluation method',
						pageHits: [],
						page_count: 92,
						paragraphs: [
							{
								entities: [],
								id: 'AOP 21.pdf_605',
								page_num_i: 64,
								par_raw_text_t:
									'1 . For the evaluation of the test data one of two different evaluation methods can be selected .',
								paragraphIdBeingMatched: 0,
								score: 0.9502548575401306,
								score_display: undefined,
								transformTextMatch:
									'for the evaluation of the test data one of two different evaluation methods can be selected',
							},
						],
						publication_date_dt: '2020-03-16T00:00:00',
						ref_list: [],
						score: 0.9502548575401306,
						summary_30:
							'EXPLOSIVE COMPONENT WATER GAP TEST RESULT SHEET . EXPLOSIVE COMPONENT WATER GAP TEST RESULT SHEET . The results of testing of detonating explosive components for initiation systems',
						title: 'INITIATION SYSTEMS: TESTING FOR THE ASSESSMENT OF DETONATING EXPLOSIVE COMPONENTS',
						type: 'document',
					},
					{
						access_timestamp_dt: '2021-04-20T07:50:08',
						crawler_used_s: 'nato_stanag',
						display_doc_type_s: 'Document',
						display_org_s: 'NATO',
						display_title_s: 'AECTP 400: MECHANICAL ENVIRONMENTAL TESTS',
						doc_num: '400',
						doc_type: 'AECTP',
						esIndex: null,
						filename: 'AECTP 400.pdf',
						id: 'AECTP 400.pdf_0',
						is_revoked_b: false,
						keyw_5: 'test item, annex, time trace, measured data, test method, vertical test, test results, time traces, time history, edition',
						pageHits: [],
						page_count: 942,
						paragraphs: [
							{
								entities: [],
								id: 'AECTP 400.pdf_4161',
								page_num_i: 428,
								par_raw_text_t:
									'a . Examine the test item and carry out any required performance checks .',
								paragraphIdBeingMatched: 0,
								score: 0.9430625438690186,
								score_display: undefined,
								transformTextMatch:
									'a examine the test item and carry out any required performance checks',
							},
						],
						publication_date_dt: '2019-11-29T00:00:00',
						ref_list: ['DoDD 4510.11', 'Title 40', 'AR 70-44', 'TM 55-2200-001-12'],
						score: 0.9430625438690186,
						summary_30:
							'Note 1: For the fixed frequency sinusoidal testing, if the materiel exhibits significant resonances in the bands When measured data is available, the SRS required for the test will be determined from shock base input time history; , acceleration, of duration (see Figure 1 for the vibration materiel response data during an in-service test. materiel response pulse, and input to the test item at the firing rate of the gun, see pyroshock testing, and comment for cases in which measured data are not available. item using the load and duration specified in the Test Instruction in',
						title: 'MECHANICAL ENVIRONMENTAL TESTS',
						type: 'document',
					},
					{
						access_timestamp_dt: '2021-08-28T13:30:39',
						crawler_used_s: 'dod_issuances',
						display_doc_type_s: 'Instruction',
						display_org_s: 'Dept. of Defense',
						display_title_s: 'DoDI 1304.12E: DoD Military Personnel Accession Testing Programs',
						doc_num: '1304.12E',
						doc_type: 'DoDI',
						esIndex: null,
						filename: 'DoDI 1304.12E.pdf',
						id: 'DoDI 1304.12E.pdf_0',
						is_revoked_b: false,
						keyw_5: 'testing sessions, military services, testing program, steering committee, public service, overseas testing, military service, materials required, enlistment tests, dodi 12e',
						pageHits: [],
						page_count: 9,
						paragraphs: [
							{
								entities: [],
								id: 'DoDI 1304.12E.pdf_52',
								page_num_i: 2,
								par_raw_text_t: '3.2.1 .The purposes of the Do D Student Testing Program are to : ',
								paragraphIdBeingMatched: 0,
								score: 0.847284734249115,
								score_display: undefined,
								transformTextMatch: 'the purposes of the do d student testing program are to',
							},
						],
						publication_date_dt: '2005-09-20T00:00:00',
						ref_list: ['DoD 5025.1-M', 'DoDD 1304.12', 'DoDD 1145.2E', 'DoDI 1304.12E'],
						score: 0.847284734249115,
						summary_30:
							'USD, except for test score data routinely provided to applicants, the Military Services, and policy on military personnel accession testing and shall ensure that under the USD, the',
						title: 'DoD Military Personnel Accession Testing Programs',
						type: 'document',
					},
				],
				expansionDict: {},
				query: {
					_source: { includes: ['pagerank_r', 'kw_doc_score_r'] },
					query: {
						bool: {
							filter: [{ term: { is_revoked_b: 'false' } }],
							must: [],
							should: [
								{
									nested: {
										path: 'paragraphs',
										inner_hits: {
											_source: true,
											highlight: {
												fields: {
													'paragraphs.filename.search': { number_of_fragments: 0 },
													'paragraphs.par_raw_text_t': {
														fragment_size: 200,
														number_of_fragments: 1,
													},
												},
												fragmenter: 'span',
											},
										},
										query: {
											bool: {
												must: [
													{
														terms: {
															'paragraphs.id': [
																'AFH 36-2235V12.pdf_279',
																'CJCSI 6723.01B.pdf_272',
																'AOP 21.pdf_605',
																'AECTP 400.pdf_4161',
																'DoDI 1304.12E.pdf_52',
																'undefined',
															],
														},
													},
												],
											},
										},
									},
								},
							],
						},
					},
					from: 0,
					size: 100,
					stored_fields: [
						'filename',
						'title',
						'page_count',
						'doc_type',
						'doc_num',
						'ref_list',
						'id',
						'summary_30',
						'keyw_5',
						'p_text',
						'type',
						'p_page',
						'display_title_s',
						'display_org_s',
						'display_doc_type_s',
						'is_revoked_b',
						'access_timestamp_dt',
						'publication_date_dt',
						'crawler_used_s',
						'topics_s',
					],
				},
				searchTerms: [],
				totalCount: 5,
			};

			assert.deepStrictEqual(resMsg, expected);
			done();
		});
	});

	describe('#getFilterCounts', () => {
		it('should get filter counts', async (done) => {
			const req = {
				...reqMock,
				body: {
					paragraphs: ['Test'],
				},
			};

			let resCode;
			let resMsg;
			const res = {
				status(code) {
					resCode = code;
					return this;
				},
				send(msg) {
					resMsg = msg;
					return this;
				},
			};

			await controller.getFilterCounts(req, res);

			const expected = {
				orgCount: {
					'Dept. of the Air Force': 1,
					'Joint Chiefs of Staff': 1,
					NATO: 2,
					'Dept. of Defense': 1,
				},
				typeCount: { Document: 3, Instruction: 2 },
			};

			assert.deepStrictEqual(resMsg, expected);
			done();
		});
	});

	describe('#compareFeedback', () => {
		it('should create a row in the compare_feedback table', async (done) => {
			const req = {
				...reqMock,
				body: {
					searchedParagraph: 'This is a test',
					matchedParagraphId: 'test.pdf_0',
					docId: 'test.pdf',
					positiveFeedback: false,
				},
			};

			let resCode;
			let resMsg;

			const res = {
				status(code) {
					resCode = code;
					return this;
				},
				send(msg) {
					resMsg = msg;
					return this;
				},
			};

			await controller.compareFeedback(req, res);

			const expected = 200;

			assert.equal(resCode, expected);
			done();
		});
	});
});
