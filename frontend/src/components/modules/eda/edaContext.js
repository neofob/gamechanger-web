import React, { useReducer } from 'react';
import { orgFilters } from '../../../utils/gamechangerUtils';

const initState = {
	filterDataFetched: false,
	edaFilterData: {
		fiscalYear: [],
		issueOfficeName: [],
		issueOfficeDoDAAC: [],
		vendorName: [],
		fundingOfficeDoDAAC: [],
		fundingAgencyName: [],
		psc: [],
		psc_hierarchy: [],
		naics: [],
		naicsCode_hierarchy: [],
		duns: [],
		modNumber: [],
	},
	edaSearchSettings: {
		allOrgsSelected: true,
		organizations: [],
		aggregations: [],
		startDate: '',
		endDate: '',
		issueAgency: '',
		issueOfficeDoDAAC: [],
		issueOfficeName: [],
		allYearsSelected: true,
		fiscalYears: [],
		allDataSelected: true,
		contractData: {
			pds: false,
			syn: false,
			fpds: false,
			none: false,
		},
		minObligatedAmount: '',
		maxObligatedAmount: '',
		contractsOrMods: 'contracts',
		majcoms: {
			'air force': [],
			army: [],
			defense: [],
			navy: [],
		},
		excludeTerms: '',
		vendorName: '',
		fundingOfficeCode: [],
		idvPIID: '',
		modNumber: [],
		piid: '',
		reqDesc: '',
		psc: [],
		fundingAgencyName: [],
		naicsCode: [],
		duns: [],
		contractSOW: '',
		clinText: '',
	},
	contractAwards: {},
	showDialog: false,
	resultsPage: 1,
	showSideFilters: true,
	issuingOrgs: {},
	statsLoading: false,
	summaryCardView: false,
	summaryCardData: [],
	resultsText: '',
	resetSettingsSwitch: false,
	categorySorting: {
		Documents: ['Relevance', 'Publishing Date', 'Alphabetical', 'References'],
	},

	// not part of EDA (yet) but currently required in NewGameChangerPage:
	notifications: [],
	alerts: {},
	userInfo: {},
	searchSettings: {
		allCategoriesSelected: true,
		specificCategoriesSelected: false,
	},
	analystToolsSearchSettings: {
		isFilterUpdate: false,
		orgUpdate: false,
		orgFilter: orgFilters,
		orgCount: {},
		organizations: [],
		majcoms: {
			'air force': [],
			army: [],
			defense: [],
			navy: [],
		},
		fiscalYears: [],
		allYearsSelected: true,
		contractsOrMods: 'contracts',
		idvPIID: '',
		allOrgsSelected: true,
		specificOrgsSelected: false,
	},
	rawSearchResults: [],
	userData: {
		favorite_searches: [],
		favorite_documents: [],
	},
	notificationIds: [],
	componentStepNumbers: [],
	selectedDocuments: [],
	totalObligatedAmount: 0,
	loading: false,
};

const init = (initialState) => {
	return initialState;
};

const handleSetMultipleStates = (state, action) => {
	return {
		...state,
		...action.payload,
	};
};

function reducer(state, action) {
	switch (action.type) {
		case 'SET_STATE':
			return handleSetMultipleStates(state, action);
		case 'RESET_STATE':
			return {
				...initState,
			};
		case 'RESET_ANALYST_TOOLS_SEARCH_SETTINGS':
			const newState = {
				...state,
				analystToolsSearchSettings: initState.analystToolsSearchSettings,
			};
			newState.analystToolsSearchSettings.typeFilter = state.presearchTypes;
			newState.analystToolsSearchSettings.orgFilter = state.presearchSources;
			return newState;
		case 'RESET_SEARCH_SETTINGS':
			return {
				...state,
				edaSearchSettings: initState.edaSearchSettings,
			};
		default:
			return state;
	}
}

const EDAContext = React.createContext(initState);

const EDAProvider = React.memo((props) => {
	const [state, dispatch] = useReducer(reducer, initState, init);

	return <EDAContext.Provider value={{ state, dispatch }}>{props.children}</EDAContext.Provider>;
});

export { EDAContext, EDAProvider };
