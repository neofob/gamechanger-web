const assert = require('assert');
const EDASearchUtility = require('../../../node_app/modules/eda/edaSearchUtility');
const { constructorOptionsMock } = require('../../resources/testUtility');


describe('EDASearchUtility', function () {

    describe('getElasticsearchPagesQuery', function() {
        it ('should return an ES query for a search with Issue Org, Signature Start Date, and Issue Agency included',
        async (done) => {

            const opts = {
				...constructorOptionsMock
			};

            // includes issue org filter, date filter, issue office agency filter
            const mockBody = {"transformResults":false,"charsPadding":90,"useGCCache":false,"tiny_url":"contractsearch?tiny=37","combinedSearch":"false","edaSearchSettings":{"allOrgsSelected":false,"organizations":{"airForce":false,"army":true,"dla":false,"marineCorps":false,"navy":false,"estate":false},"aggregations":[],"startDate":"2017-06-11","endDate":null,"issueAgency":"Dept of Army","issueOffice":null,"allYearsSelected":true,"fiscalYears":[],"allDataSelected":true,"contractData":{"pds":false,"syn":false,"none":false},"minObligatedAmount":null,"maxObligatedAmount":null},"searchVersion":1,"searchText":"test","offset":0,"limit":18,"cloneName":"eda","expansionDict":{"test":[{"phrase":"mental","source":"thesaurus"},{"phrase":"psychometric","source":"thesaurus"},{"phrase":"check","source":"ML-QE"},{"phrase":"exam","source":"thesaurus"},{"phrase":"examination","source":"thesaurus"},{"phrase":"result","source":"ML-QE"}]},"operator":"and","searchTerms":["test"],"parsedQuery":"test","extSearchFields":["*_eda_ext"],"extStoredFields":["*_eda_ext"]};
            const target = new EDASearchUtility(opts);
            try {
                const actual = await target.getElasticsearchPagesQuery(mockBody, 'test user');
                const expected = {"_source":{"includes":["pagerank_r","kw_doc_score_r","orgs_rs","*_eda_n*"]},"stored_fields":["filename","title","page_count","doc_type","doc_num","ref_list","id","summary_30","keyw_5","p_text","type","p_page","display_title_s","display_org_s","display_doc_type_s","*_eda_ext"],"from":0,"size":18,"track_total_hits":true,"query":{"bool":{"must":[{"bool":{"should":[{"nested":{"path":"pages","inner_hits":{"_source":false,"stored_fields":["pages.filename","pages.p_raw_text"],"from":0,"size":5,"highlight":{"fields":{"pages.filename.search":{"number_of_fragments":0},"pages.p_raw_text":{"fragment_size":180,"number_of_fragments":1}},"fragmenter":"span"}},"query":{"bool":{"should":[{"wildcard":{"pages.filename.search":{"value":"test*","boost":15}}},{"query_string":{"query":"test","default_field":"pages.p_raw_text","default_operator":"and","fuzzy_max_expansions":100,"fuzziness":"AUTO"}}]}}}},{"multi_match":{"query":"test","fields":["*_eda_ext"],"operator":"or"}}]}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"must":[{"match":{"extracted_data_eda_n.contract_issue_office_name_eda_ext":"Dept of Army"}}]}}}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"should":[{"match":{"extracted_data_eda_n.dodaac_org_type_eda_ext":"army"}}]}}}},{"nested":{"path":"extracted_data_eda_n","query":{"range":{"extracted_data_eda_n.signature_date_eda_ext_dt":{"gte":"2017-06-11"}}}}}],"should":[{"multi_match":{"query":"test","fields":["keyw_5^2","id^2","summary_30","pages.p_raw_text"],"operator":"or"}},{"rank_feature":{"field":"pagerank_r","boost":0.5}},{"rank_feature":{"field":"kw_doc_score_r","boost":0.1}}]}}}

                assert.deepStrictEqual(actual, expected);
                done();
            } catch(err) {
                assert.fail(err);
            }
        });

        it('should return an ES query based on the Fiscal Year and EDA Contract Data filters',
        async (done) => {
            const opts = {
				...constructorOptionsMock
			};

            // includes issue org filter, date filter, issue office agency filter
            const mockBody = {"transformResults":false,"charsPadding":90,"useGCCache":false,"tiny_url":"contractsearch?tiny=37","combinedSearch":"false","edaSearchSettings":{"allOrgsSelected":true,"organizations":{"airForce":false,"army":false,"dla":false,"marineCorps":false,"navy":false,"estate":false},"aggregations":[],"startDate":null,"endDate":null,"issueAgency":null,"issueOffice":"","allYearsSelected":false,"fiscalYears":["2017"],"allDataSelected":false,"contractData":{"pds":true,"syn":true,"none":false}},"searchVersion":1,"searchText":"test","offset":0,"limit":18,"cloneName":"eda","expansionDict":{"test":[{"phrase":"mental","source":"thesaurus"},{"phrase":"psychometric","source":"thesaurus"},{"phrase":"check","source":"ML-QE"},{"phrase":"exam","source":"thesaurus"},{"phrase":"examination","source":"thesaurus"},{"phrase":"result","source":"ML-QE"}]},"operator":"and","searchTerms":["test"],"parsedQuery":"test","extSearchFields":["*_eda_ext"],"extStoredFields":["*_eda_ext"]};
            const target = new EDASearchUtility(opts);
            try {
                const actual = await target.getElasticsearchPagesQuery(mockBody, 'test user');
                const expected = {"_source":{"includes":["pagerank_r","kw_doc_score_r","orgs_rs","*_eda_n*"]},"stored_fields":["filename","title","page_count","doc_type","doc_num","ref_list","id","summary_30","keyw_5","p_text","type","p_page","display_title_s","display_org_s","display_doc_type_s","*_eda_ext"],"from":0,"size":18,"track_total_hits":true,"query":{"bool":{"must":[{"bool":{"should":[{"nested":{"path":"pages","inner_hits":{"_source":false,"stored_fields":["pages.filename","pages.p_raw_text"],"from":0,"size":5,"highlight":{"fields":{"pages.filename.search":{"number_of_fragments":0},"pages.p_raw_text":{"fragment_size":180,"number_of_fragments":1}},"fragmenter":"span"}},"query":{"bool":{"should":[{"wildcard":{"pages.filename.search":{"value":"test*","boost":15}}},{"query_string":{"query":"test","default_field":"pages.p_raw_text","default_operator":"and","fuzzy_max_expansions":100,"fuzziness":"AUTO"}}]}}}},{"multi_match":{"query":"test","fields":["*_eda_ext"],"operator":"or"}}]}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"should":[{"range":{"extracted_data_eda_n.signature_date_eda_ext_dt":{"gte":"2017","lte":"2018","format":"yyyy"}}}]}}}},{"bool":{"should":[{"bool":{"must":[{"match":{"metadata_type_eda_ext":"pds, syn"}},{"match":{"is_supplementary_data_included_eda_ext_b":true}}]}}]}}],"should":[{"multi_match":{"query":"test","fields":["keyw_5^2","id^2","summary_30","pages.p_raw_text"],"operator":"or"}},{"rank_feature":{"field":"pagerank_r","boost":0.5}},{"rank_feature":{"field":"kw_doc_score_r","boost":0.1}}]}}}
                assert.deepStrictEqual(actual, expected);
                done();
            } catch(err) {
                assert.fail(err);
            }
        });

        it('should return an ES query based on the Issue Office DoDAAC and Obligated Amount filters',
        async (done) => {
            const opts = {
                ...constructorOptionsMock
            };

            // includes issue org filter, date filter, issue office agency filter
            const mockBody = {"transformResults":false,"charsPadding":90,"useGCCache":false,"tiny_url":"contractsearch?tiny=37","combinedSearch":"false","edaSearchSettings":{"allOrgsSelected":true,"organizations":{"airForce":false,"army":false,"dla":false,"marineCorps":false,"navy":false,"estate":false},"aggregations":[],"startDate":null,"endDate":null,"issueAgency":null,"issueOffice":"N66001","allYearsSelected":true,"fiscalYears":[],"allDataSelected":true,"contractData":{"pds":false,"syn":false,"none":false},"minObligatedAmount":"200000","maxObligatedAmount":null},"searchVersion":1,"searchText":"test","offset":0,"limit":18,"cloneName":"eda","expansionDict":{"test":[{"phrase":"mental","source":"thesaurus"},{"phrase":"psychometric","source":"thesaurus"},{"phrase":"check","source":"ML-QE"},{"phrase":"exam","source":"thesaurus"},{"phrase":"examination","source":"thesaurus"},{"phrase":"result","source":"ML-QE"}]},"operator":"and","searchTerms":["test"],"parsedQuery":"test","extSearchFields":["*_eda_ext"],"extStoredFields":["*_eda_ext"]};

            const target = new EDASearchUtility(opts);
            try {
                const actual = await target.getElasticsearchPagesQuery(mockBody, 'test user');
                const expected =  {"_source":{"includes":["pagerank_r","kw_doc_score_r","orgs_rs","*_eda_n*"]},"stored_fields":["filename","title","page_count","doc_type","doc_num","ref_list","id","summary_30","keyw_5","p_text","type","p_page","display_title_s","display_org_s","display_doc_type_s","*_eda_ext"],"from":0,"size":18,"track_total_hits":true,"query":{"bool":{"must":[{"bool":{"should":[{"nested":{"path":"pages","inner_hits":{"_source":false,"stored_fields":["pages.filename","pages.p_raw_text"],"from":0,"size":5,"highlight":{"fields":{"pages.filename.search":{"number_of_fragments":0},"pages.p_raw_text":{"fragment_size":180,"number_of_fragments":1}},"fragmenter":"span"}},"query":{"bool":{"should":[{"wildcard":{"pages.filename.search":{"value":"test*","boost":15}}},{"query_string":{"query":"test","default_field":"pages.p_raw_text","default_operator":"and","fuzzy_max_expansions":100,"fuzziness":"AUTO"}}]}}}},{"multi_match":{"query":"test","fields":["*_eda_ext"],"operator":"or"}}]}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"must":[{"match":{"extracted_data_eda_n.contract_issue_office_dodaac_eda_ext":"N66001"}}]}}}},{"nested":{"path":"extracted_data_eda_n","query":{"range":{"extracted_data_eda_n.total_obligated_amount_eda_ext_f":{"gte":"200000"}}}}}],"should":[{"multi_match":{"query":"test","fields":["keyw_5^2","id^2","summary_30","pages.p_raw_text"],"operator":"or"}},{"rank_feature":{"field":"pagerank_r","boost":0.5}},{"rank_feature":{"field":"kw_doc_score_r","boost":0.1}}]}}};

                assert.deepStrictEqual(actual, expected);
                done();
            } catch(err) {
                assert.fail(err);
            }
        });

        it('should return an ES query based on the contract filter',
        async (done) => {
            const opts = {
                ...constructorOptionsMock
            };

            // includes issue org filter, date filter, issue office agency filter
            const mockBody = {"transformResults":false,"charsPadding":90,"useGCCache":false,"tiny_url":"contractsearch?tiny=37","combinedSearch":"false","edaSearchSettings":{"allOrgsSelected":true,"organizations":{"airForce":false,"army":false,"dla":false,"marineCorps":false,"navy":false,"estate":false},"aggregations":[],"startDate":null,"endDate":null,"issueAgency":null,"issueOffice":null,"allYearsSelected":true,"fiscalYears":[],"allDataSelected":true,"contractData":{"pds":false,"syn":false,"none":false},"minObligatedAmount":null,"maxObligatedAmount":null,"contractsOrMods":"contracts"},"searchVersion":1,"searchText":"test","offset":0,"limit":18,"cloneName":"eda","expansionDict":{"test":[{"phrase":"mental","source":"thesaurus"},{"phrase":"psychometric","source":"thesaurus"},{"phrase":"check","source":"ML-QE"},{"phrase":"exam","source":"thesaurus"},{"phrase":"examination","source":"thesaurus"},{"phrase":"result","source":"ML-QE"}]},"operator":"and","searchTerms":["test"],"parsedQuery":"test","extSearchFields":["*_eda_ext"],"extStoredFields":["*_eda_ext"]};

            const target = new EDASearchUtility(opts);
            try {
                const actual = await target.getElasticsearchPagesQuery(mockBody, 'test user');
                const expected =  {"_source":{"includes":["pagerank_r","kw_doc_score_r","orgs_rs","*_eda_n*"]},"stored_fields":["filename","title","page_count","doc_type","doc_num","ref_list","id","summary_30","keyw_5","p_text","type","p_page","display_title_s","display_org_s","display_doc_type_s","*_eda_ext"],"from":0,"size":18,"track_total_hits":true,"query":{"bool":{"must":[{"bool":{"should":[{"nested":{"path":"pages","inner_hits":{"_source":false,"stored_fields":["pages.filename","pages.p_raw_text"],"from":0,"size":5,"highlight":{"fields":{"pages.filename.search":{"number_of_fragments":0},"pages.p_raw_text":{"fragment_size":180,"number_of_fragments":1}},"fragmenter":"span"}},"query":{"bool":{"should":[{"wildcard":{"pages.filename.search":{"value":"test*","boost":15}}},{"query_string":{"query":"test","default_field":"pages.p_raw_text","default_operator":"and","fuzzy_max_expansions":100,"fuzziness":"AUTO"}}]}}}},{"multi_match":{"query":"test","fields":["*_eda_ext"],"operator":"or"}}]}},{"match":{"mod_identifier_eda_ext":"base_award"}}],"should":[{"multi_match":{"query":"test","fields":["keyw_5^2","id^2","summary_30","pages.p_raw_text"],"operator":"or"}},{"rank_feature":{"field":"pagerank_r","boost":0.5}},{"rank_feature":{"field":"kw_doc_score_r","boost":0.1}}]}}};

                assert.deepStrictEqual(actual, expected);
                done();
            } catch(err) {
                assert.fail(err);
            }
        });
    });

    describe('getElasticSearchStatsQuery', function () {
        it ('should return an ES query for a search with filters included',
        async (done) => {
            const opts = {
                ...constructorOptionsMock
            };
            const mockBody = {"transformResults":false,"charsPadding":90,"useGCCache":false,"tiny_url":"contractsearch?tiny=304","combinedSearch":"false","edaSearchSettings":{"allOrgsSelected":false,"organizations":{"airForce":false,"army":true,"dla":false,"marineCorps":false,"navy":false,"estate":false},"aggregations":{"officeAgency":false,"vendor":false,"parentIDV":false},"startDate":"2017-06-10","endDate":null,"issueAgency":"Dept of Army"},"forStats":true,"searchVersion":1,"searchText":"test","offset":0,"limit":10000,"cloneName":"eda","expansionDict":{"test":[{"phrase":"check","source":"ML-QE"},{"phrase":"result","source":"ML-QE"}]},"operator":"and","searchTerms":["test"],"parsedQuery":"test","extSearchFields":["pdf_filename_eda_ext","pds_contract_eda_ext","pds_filename_eda_ext","pdf_contract_eda_ext","pds_modification_eda_ext"],"extStoredFields":["*_eda_ext"]}
    
            const target = new EDASearchUtility(opts);
            try {
                const actual = await target.getElasticsearchStatsQuery(mockBody, 'test user');
                const expected = {"_source":{"includes":["extracted_data_eda_n","metadata_type_eda_ext"]},"from":0,"size":10000,"track_total_hits":true,"query":{"bool":{"must":[{"bool":{"should":[{"nested":{"path":"pages","inner_hits":{"_source":false,"stored_fields":["pages.filename","pages.p_raw_text"],"from":0,"size":5,"highlight":{"fields":{"pages.filename.search":{"number_of_fragments":0},"pages.p_raw_text":{"fragment_size":180,"number_of_fragments":1}},"fragmenter":"span"}},"query":{"bool":{"should":[{"wildcard":{"pages.filename.search":{"value":"test*","boost":15}}},{"query_string":{"query":"test","default_field":"pages.p_raw_text","default_operator":"and","fuzzy_max_expansions":100,"fuzziness":"AUTO"}}]}}}},{"multi_match":{"query":"test","fields":["pdf_filename_eda_ext","pds_contract_eda_ext","pds_filename_eda_ext","pdf_contract_eda_ext","pds_modification_eda_ext"],"operator":"or"}}]}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"must":[{"match":{"extracted_data_eda_n.contract_issue_office_name_eda_ext":"Dept of Army"}}]}}}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"should":[{"match":{"extracted_data_eda_n.dodaac_org_type_eda_ext":"army"}}]}}}},{"nested":{"path":"extracted_data_eda_n","query":{"range":{"extracted_data_eda_n.signature_date_eda_ext_dt":{"gte":"2017-06-10"}}}}}],"should":[{"multi_match":{"query":"test","fields":["keyw_5^2","id^2","summary_30","pages.p_raw_text"],"operator":"or"}},{"rank_feature":{"field":"pagerank_r","boost":0.5}},{"rank_feature":{"field":"kw_doc_score_r","boost":0.1}}]}}};
                assert.deepStrictEqual(actual, expected);
                done();
            } catch(err) {
                assert.fail(err);
            }
        });
    });

    describe('cleanUpEsResults', function () {
        it ('should return cleaned up ES results to frontend', 
        async (done) => {
            const mockResults = {"body":{"took":14,"timed_out":false,"_shards":{"total":3,"successful":3,"skipped":0,"failed":0},"hits":{"total":{"value":1,"relation":"eq"},"max_score":10.341896,"hits":[{"_index":"gc_eda_2021_syn_pds","_type":"_doc","_id":"ff904a99f190fc7819326a4d3748b3c87760f9a09e826f43772d2d4faad8b7db","_score":10.341896,"_source":{"extracted_data_eda_n":{"contract_payment_office_dodaac_eda_ext":"DFAS COLUMBUS CENTER","vendor_name_eda_ext":"Booz Allen Hamilton Inc.","contract_issue_office_name_eda_ext":"US ARMY ACC-APG-RTP W911NF","dodaac_org_type_eda_ext":"army","vendor_duns_eda_ext":"006928857","contract_admin_office_dodaac_eda_ext":"DCMA SPRINGFIELD","contract_issue_office_dodaac_eda_ext":"W911NF","effective_date_eda_ext_dt":"2017-09-21","contract_admin_agency_name_eda_ext":"S3101A","signature_date_eda_ext_dt":"2017-09-21","naics_eda_ext":"541330","modification_number_eda_ext":"Award","vendor_cage_eda_ext":"17038","award_id_eda_ext":"0002","referenced_idv_eda_ext":"W911NF17D0002","total_obligated_amount_eda_ext_f":6472000,"contract_payment_office_name_eda_ext":"HQ0338"},"pagerank_r":0.00001},"fields":{"metadata_type_eda_ext":["pds"],"pds_grouping_eda_ext":["pds_974_filenames_and_size"],"pdf_ordernum_eda_ext":["0002"],"pdf_modification_eda_ext":["empty"],"pds_ordernum_eda_ext":["0002"],"doc_num":["/var//tmp/tmp.vf4dXzVgIA/gc/pdf/eda/piee/unarchive_pdf/pdf_bah_2/EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"],"dir_location_eda_ext":["eda/piee/unarchive_pdf/pdf_bah_2"],"file_location_eda_ext":["gamechanger/projects/eda/pdf/eda/piee/unarchive_pdf/pdf_bah_2/EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"],"pds_contract_eda_ext":["W911NF17D0002"],"s3_path_eda_ext":[""],"doc_type":["/var//tmp/tmp.vf4dXzVgIA/gc/pdf/eda/piee/unarchive_pdf/pdf_bah_2/EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"],"pds_category_eda_ext":["'historic'"],"type":["document"],"title":["W911NF17D0002-0002-empty"],"pdf_filename_eda_ext":["EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"],"pdf_category_eda_ext":["'historic'"],"pds_filename_eda_ext":["EDAPDS-59C397E8DE995F6AE05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-22.json"],"pdf_contract_eda_ext":["W911NF17D0002"],"filename":["EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"],"pdf_grouping_eda_ext":["pdf_log_217"],"pds_modification_eda_ext":["empty"],"id":["EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf_0"],"page_count":[48]},"inner_hits":{"pages":{"hits":{"total":{"value":7,"relation":"eq"},"max_score":6.5625486,"hits":[{"_index":"gc_eda_2021_syn_pds","_type":"_doc","_id":"ff904a99f190fc7819326a4d3748b3c87760f9a09e826f43772d2d4faad8b7db","_nested":{"field":"pages","offset":11},"_score":6.5625486,"fields":{"pages.filename":["EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"]},"highlight":{"pages.p_raw_text":["testing, and adjust units under <em>test</em>."]}},{"_index":"gc_eda_2021_syn_pds","_type":"_doc","_id":"ff904a99f190fc7819326a4d3748b3c87760f9a09e826f43772d2d4faad8b7db","_nested":{"field":"pages","offset":8},"_score":4.782032,"fields":{"pages.filename":["EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"]},"highlight":{"pages.p_raw_text":["Report \nDI-QCIC-81891 - ACCEPTANCE <em>TEST</em> REPORT (ATR) \nDI-SESS-80255A - FAILURE SUMMARY & ANALYSIS REPORT \nDI-SESS-81628A - RELIABILITY <em>TEST</em> REPORT \nDI-TMSS-80527C - Commercial Off"]}},{"_index":"gc_eda_2021_syn_pds","_type":"_doc","_id":"ff904a99f190fc7819326a4d3748b3c87760f9a09e826f43772d2d4faad8b7db","_nested":{"field":"pages","offset":15},"_score":4.0893645,"fields":{"pages.filename":["EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"]},"highlight":{"pages.p_raw_text":["and Demo Support \n \n3.2.14.1 The Contractor shall support scheduled and ad-hoc testing events and demonstrations, which may include events \nsuch as NIE, E15, <em>test</em> events at but not"]}},{"_index":"gc_eda_2021_syn_pds","_type":"_doc","_id":"ff904a99f190fc7819326a4d3748b3c87760f9a09e826f43772d2d4faad8b7db","_nested":{"field":"pages","offset":29},"_score":3.580061,"fields":{"pages.filename":["EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"]},"highlight":{"pages.p_raw_text":["This includes a stool sample <em>test</em> for ova and parasites."]}},{"_index":"gc_eda_2021_syn_pds","_type":"_doc","_id":"ff904a99f190fc7819326a4d3748b3c87760f9a09e826f43772d2d4faad8b7db","_nested":{"field":"pages","offset":31},"_score":2.8506374,"fields":{"pages.filename":["EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf"]},"highlight":{"pages.p_raw_text":["., special \nradio <em>test</em> equipment, when the contractor is responsible for radio testing or repair) \n \n(End of Clause) \n \n5152.225-5910 \nCONTRACTOR HEALTH AND SAFETY \n(DEC 2011) \n \n(a"]}}]}}}}]}},"statusCode":200,"headers":{"date":"Thu, 13 May 2021 23:48:02 GMT","content-type":"application/json; charset=UTF-8","content-length":"5146","connection":"keep-alive","access-control-allow-origin":"*"},"meta":{"context":null,"request":{"params":{"method":"POST","path":"/gc_eda_2021_syn_pds/_search","body":"{\"_source\":{\"includes\":[\"pagerank_r\",\"kw_doc_score_r\",\"orgs_rs\",\"*_eda_n*\"]},\"stored_fields\":[\"filename\",\"title\",\"page_count\",\"doc_type\",\"doc_num\",\"ref_list\",\"id\",\"summary_30\",\"keyw_5\",\"p_text\",\"type\",\"p_page\",\"display_title_s\",\"display_org_s\",\"display_doc_type_s\",\"*_eda_ext\"],\"from\":0,\"size\":20,\"track_total_hits\":true,\"query\":{\"bool\":{\"must\":[{\"bool\":{\"should\":[{\"nested\":{\"path\":\"pages\",\"inner_hits\":{\"_source\":false,\"stored_fields\":[\"pages.filename\",\"pages.p_raw_text\"],\"from\":0,\"size\":5,\"highlight\":{\"fields\":{\"pages.filename.search\":{\"number_of_fragments\":0},\"pages.p_raw_text\":{\"fragment_size\":180,\"number_of_fragments\":1}},\"fragmenter\":\"span\"}},\"query\":{\"bool\":{\"should\":[{\"wildcard\":{\"pages.filename.search\":{\"value\":\"test*\",\"boost\":15}}},{\"query_string\":{\"query\":\"test\",\"default_field\":\"pages.p_raw_text\",\"default_operator\":\"and\",\"fuzzy_max_expansions\":100,\"fuzziness\":\"AUTO\"}}]}}}},{\"multi_match\":{\"query\":\"test\",\"fields\":[\"pdf_filename_eda_ext\",\"pds_contract_eda_ext\",\"pds_filename_eda_ext\",\"pdf_contract_eda_ext\",\"pds_modification_eda_ext\"],\"operator\":\"or\"}}]}},{\"nested\":{\"path\":\"extracted_data_eda_n\",\"query\":{\"bool\":{\"should\":[{\"match\":{\"extracted_data_eda_n.dodaac_org_type_eda_ext\":\"army\"}}]}}}},{\"nested\":{\"path\":\"extracted_data_eda_n\",\"query\":{\"bool\":{\"must\":[{\"match\":{\"extracted_data_eda_n.contract_issue_office_name_eda_ext\":\"Dept of Army\"}}]}}}},{\"nested\":{\"path\":\"extracted_data_eda_n\",\"query\":{\"range\":{\"extracted_data_eda_n.signature_date_eda_ext_dt\":{\"gte\":\"2017-06-10\"}}}}}],\"should\":[{\"multi_match\":{\"query\":\"test\",\"fields\":[\"keyw_5^2\",\"id^2\",\"summary_30\",\"pages.p_raw_text\"],\"operator\":\"or\"}},{\"rank_feature\":{\"field\":\"pagerank_r\",\"boost\":0.5}},{\"rank_feature\":{\"field\":\"kw_doc_score_r\",\"boost\":0.1}}]}}}","querystring":"","headers":{"user-agent":"elasticsearch-js/7.11.0 (linux 4.19.76-linuxkit-x64; Node.js v10.9.0)","x-elastic-client-meta":"es=7.11.0,js=10.9.0,t=7.11.0,hc=10.9.0","content-type":"application/json","content-length":"1736"},"timeout":30000},"options":{},"id":2},"name":"elasticsearch-js","connection":{"url":"https://vpc-gamechanger-iquxkyq2dobz4antllp35g2vby.us-east-1.es.amazonaws.com/","id":"https://vpc-gamechanger-iquxkyq2dobz4antllp35g2vby.us-east-1.es.amazonaws.com/","headers":{},"deadCount":0,"resurrectTimeout":0,"_openRequests":0,"status":"alive","roles":{"master":true,"data":true,"ingest":true,"ml":false}},"attempts":0,"aborted":false}};
            const mockSearchResults = ['test'];
            const mockUserId = 'test';
            const mockSelectedDocuments = undefined;
            const mockExpansionDict = {"test":[{"phrase":"mental","source":"thesaurus"},{"phrase":"psychometric","source":"thesaurus"},{"phrase":"check","source":"ML-QE"},{"phrase":"exam","source":"thesaurus"},{"phrase":"examination","source":"thesaurus"},{"phrase":"result","source":"ML-QE"}]};
            const mockESIndex = 'gc_eda_2021_syn_pds';
            const mockESQuery = {"_source":{"includes":["pagerank_r","kw_doc_score_r","orgs_rs","*_eda_n*"]},"stored_fields":["filename","title","page_count","doc_type","doc_num","ref_list","id","summary_30","keyw_5","p_text","type","p_page","display_title_s","display_org_s","display_doc_type_s","*_eda_ext"],"from":0,"size":20,"track_total_hits":true,"query":{"bool":{"must":[{"bool":{"should":[{"nested":{"path":"pages","inner_hits":{"_source":false,"stored_fields":["pages.filename","pages.p_raw_text"],"from":0,"size":5,"highlight":{"fields":{"pages.filename.search":{"number_of_fragments":0},"pages.p_raw_text":{"fragment_size":180,"number_of_fragments":1}},"fragmenter":"span"}},"query":{"bool":{"should":[{"wildcard":{"pages.filename.search":{"value":"test*","boost":15}}},{"query_string":{"query":"test","default_field":"pages.p_raw_text","default_operator":"and","fuzzy_max_expansions":100,"fuzziness":"AUTO"}}]}}}},{"multi_match":{"query":"test","fields":["pdf_filename_eda_ext","pds_contract_eda_ext","pds_filename_eda_ext","pdf_contract_eda_ext","pds_modification_eda_ext"],"operator":"or"}}]}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"should":[{"match":{"extracted_data_eda_n.dodaac_org_type_eda_ext":"army"}}]}}}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"must":[{"match":{"extracted_data_eda_n.contract_issue_office_name_eda_ext":"Dept of Army"}}]}}}},{"nested":{"path":"extracted_data_eda_n","query":{"range":{"extracted_data_eda_n.signature_date_eda_ext_dt":{"gte":"2017-06-10"}}}}}],"should":[{"multi_match":{"query":"test","fields":["keyw_5^2","id^2","summary_30","pages.p_raw_text"],"operator":"or"}},{"rank_feature":{"field":"pagerank_r","boost":0.5}},{"rank_feature":{"field":"kw_doc_score_r","boost":0.1}}]}}};
            const opts = {
                ...constructorOptionsMock
            };
            const target = new EDASearchUtility(opts);

            try {
                const actual = target.cleanUpEsResults(mockResults, mockSearchResults, mockUserId, mockSelectedDocuments, mockExpansionDict, mockESIndex, mockESQuery);
                const expected =  {"query":{"_source":{"includes":["pagerank_r","kw_doc_score_r","orgs_rs","*_eda_n*"]},"stored_fields":["filename","title","page_count","doc_type","doc_num","ref_list","id","summary_30","keyw_5","p_text","type","p_page","display_title_s","display_org_s","display_doc_type_s","*_eda_ext"],"from":0,"size":20,"track_total_hits":true,"query":{"bool":{"must":[{"bool":{"should":[{"nested":{"path":"pages","inner_hits":{"_source":false,"stored_fields":["pages.filename","pages.p_raw_text"],"from":0,"size":5,"highlight":{"fields":{"pages.filename.search":{"number_of_fragments":0},"pages.p_raw_text":{"fragment_size":180,"number_of_fragments":1}},"fragmenter":"span"}},"query":{"bool":{"should":[{"wildcard":{"pages.filename.search":{"value":"test*","boost":15}}},{"query_string":{"query":"test","default_field":"pages.p_raw_text","default_operator":"and","fuzzy_max_expansions":100,"fuzziness":"AUTO"}}]}}}},{"multi_match":{"query":"test","fields":["pdf_filename_eda_ext","pds_contract_eda_ext","pds_filename_eda_ext","pdf_contract_eda_ext","pds_modification_eda_ext"],"operator":"or"}}]}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"should":[{"match":{"extracted_data_eda_n.dodaac_org_type_eda_ext":"army"}}]}}}},{"nested":{"path":"extracted_data_eda_n","query":{"bool":{"must":[{"match":{"extracted_data_eda_n.contract_issue_office_name_eda_ext":"Dept of Army"}}]}}}},{"nested":{"path":"extracted_data_eda_n","query":{"range":{"extracted_data_eda_n.signature_date_eda_ext_dt":{"gte":"2017-06-10"}}}}}],"should":[{"multi_match":{"query":"test","fields":["keyw_5^2","id^2","summary_30","pages.p_raw_text"],"operator":"or"}},{"rank_feature":{"field":"pagerank_r","boost":0.5}},{"rank_feature":{"field":"kw_doc_score_r","boost":0.1}}]}}},"totalCount":1,"docs":[{"metadata_type_eda_ext":"pds","pds_grouping_eda_ext":"pds_974_filenames_and_size","pdf_ordernum_eda_ext":"0002","pdf_modification_eda_ext":"empty","pds_ordernum_eda_ext":"0002","doc_num":"/var//tmp/tmp.vf4dXzVgIA/gc/pdf/eda/piee/unarchive_pdf/pdf_bah_2/EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf","dir_location_eda_ext":"eda/piee/unarchive_pdf/pdf_bah_2","file_location_eda_ext":"gamechanger/projects/eda/pdf/eda/piee/unarchive_pdf/pdf_bah_2/EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf","pds_contract_eda_ext":"W911NF17D0002","s3_path_eda_ext":"","doc_type":"/var//tmp/tmp.vf4dXzVgIA/gc/pdf/eda/piee/unarchive_pdf/pdf_bah_2/EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf","pds_category_eda_ext":"'historic'","type":"document","title":"W911NF17D0002-0002-empty","pdf_filename_eda_ext":"EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf","pdf_category_eda_ext":"'historic'","pds_filename_eda_ext":"EDAPDS-59C397E8DE995F6AE05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-22.json","pdf_contract_eda_ext":"W911NF17D0002","filename":"EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf","pdf_grouping_eda_ext":"pdf_log_217","pds_modification_eda_ext":"empty","id":"EDAPDF-59BE6A9B163C1247E05400215A9BA3BA-W911NF17D0002-0002-empty-empty-PDS-2017-09-21.pdf_0","page_count":48,"topics_rs":[],"pageHits":[{"snippet":"Report \nDI-QCIC-81891 - ACCEPTANCE <em>TEST</em> REPORT (ATR) \nDI-SESS-80255A - FAILURE SUMMARY & ANALYSIS REPORT \nDI-SESS-81628A - RELIABILITY <em>TEST</em> REPORT \nDI-TMSS-80527C - Commercial Off","pageNumber":9},{"snippet":"testing, and adjust units under <em>test</em>.","pageNumber":12},{"snippet":"and Demo Support \n \n3.2.14.1 The Contractor shall support scheduled and ad-hoc testing events and demonstrations, which may include events \nsuch as NIE, E15, <em>test</em> events at but not","pageNumber":16},{"snippet":"This includes a stool sample <em>test</em> for ova and parasites.","pageNumber":30},{"snippet":"., special \nradio <em>test</em> equipment, when the contractor is responsible for radio testing or repair) \n \n(End of Clause) \n \n5152.225-5910 \nCONTRACTOR HEALTH AND SAFETY \n(DEC 2011) \n \n(a","pageNumber":32}],"pageHitCount":5,"contract_issue_name_eda_ext":"US ARMY ACC-APG-RTP W911NF","contract_issue_dodaac_eda_ext":"W911NF","issuing_organization_eda_ext":"Army","vendor_name_eda_ext":"Booz Allen Hamilton Inc.","vendor_duns_eda_ext":"006928857","vendor_cage_eda_ext":"17038","contract_admin_name_eda_ext":"S3101A","contract_admin_office_dodaac_eda_ext":"DCMA SPRINGFIELD","paying_office_name_eda_ext":"HQ0338","paying_office_dodaac_eda_ext":"DFAS COLUMBUS CENTER","modification_eda_ext":"Award","award_id_eda_ext":"0002","reference_idv_eda_ext":"W911NF17D0002","signature_date_eda_ext":"2017-09-21","effective_date_eda_ext":"2017-09-21","obligated_amounts_eda_ext":6472000,"naics_eda_ext":"541330","esIndex":"gc_eda_2021_syn_pds","keyw_5":"","ref_list":[]}],"doc_types":[],"doc_orgs":[],"searchTerms":["test"],"expansionDict":{"test":[{"phrase":"mental","source":"thesaurus"},{"phrase":"psychometric","source":"thesaurus"},{"phrase":"check","source":"ML-QE"},{"phrase":"exam","source":"thesaurus"},{"phrase":"examination","source":"thesaurus"},{"phrase":"result","source":"ML-QE"}]}};
                assert.deepStrictEqual(actual, expected);
                done();
            } catch(err) {
                assert.fail(err);
            }
        })
    })
})