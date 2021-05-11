import React, { useReducer } from 'react';
import {orgFilters, typeFilters, SEARCH_TYPES} from "../../../gamechangerUtils";

const initState = {
	cloneDataSet: false,
	cloneData: {
		clone_name: 'gamechanger',
		search_module: 'policy/policySearchHandler',
		export_module: 'simple/simpleExportHandler',
		title_bar_module: 'policy/policyTitleBarHandler',
		navigation_module: 'policy/policyNavigationHandler',
		display_name: 'GAMECHANGER',
		is_live: true,
		url: '/',
		permissions_required: false,
		clone_to_advana: true,
		clone_togamchanger: true,
		clone_to_jupiter: true,
		clone_to_sipr: false,
		show_tutorial: true,
		show_graph: true,
		show_crowd_source: true,
		show_feedback: true,
		
	},
	history: undefined,
	historySet: false,
	
	// Notifications
	notifications: [],
	notificationIds: [],
	alerts: {
		noResultsMessage: null,
		unauthorizedError: false,
		transformFailed: false,
	},
	
	// User
	userData: { favorite_searches: [], favorite_documents: [], favorite_topics: [], search_history: [], export_history: [], api_key:'' },
	newUser: false,
	userInfoModalOpen: false,
	userInfo: {
		email: '',
		org: '',
		q1: '',
		q2: ''
	},
	
	// Tutorial
	showTutorial: false,
	clickedTutorial: false,
	tutorialStepIndex: 0,
	componentStepNumbers: {},
	tutorialJoyrideSteps: [],
	
	// Show Modals
	showFeedbackModal: false,
	showAssistModal: false,
	assistVoluntary: true,
	loginModalOpen: false,
	showSnackbar: false,
	exportDialogVisible: false,
	showEsQueryDialog: false,
	showEsDocDialog: false,
	
	selectedDoc: {},
	
	loading: false,
	isResetting: false,
	documentProperties: [],
	pageDisplayed: 'main',
	listView: false,
	
	// Documents
	iframePreviewLink: null,
	detailViewId: 0,
	
	// Export
	selectedDocuments: new Map(),
	docsDrawerOpen: false,
	isSelectedDocs: false,
	isDrawerReady: false,
	
	// Navigation
	menuOpen: false,
	tabName: '',
	hideTabs: true,
	
	// Graph
	runGraphSearch: false,
	
	// SideBar
	sidebarDocTypes: [],
	sidebarOrgs: [],
	runningEntitySearch: false,
	metricsCounted: false,
	metricsLoading: false,
	entitiesForSearch: [],
	topicsForSearch: [],
	runningTopicSearch: false,
	showSideFilters: false,
	
	// Search
	offset: 0,
	esIndex: '',
	autoCompleteItems: [],
	didYouMean: '',
	timeSinceCache: 0,
	isCachedResult: false,
	transformFailed: false,
	timeFound: 0.0,
	hasExpansionTerms: false,
	noSearches: true,
	count: 0,
	resultsPage: 1,
	searchText: '',
	prevSearchText: null,
	runSearch: false,
	runningSearch: false,
	expansionDict: {},
	rawSearchResults: [],
	docSearchResults: [],
	isFavoriteSearch: false,
	searchSettings: {
		searchType: SEARCH_TYPES.keyword,
		orgFilter: orgFilters,
		allOrgsSelected: true,
		typeFilter: typeFilters,
		allTypesSelected: true,
		specificTypesSelected: false,
		searchFields: {'initial': {field: null, input: ''}},
		specificOrgsSelected: false,
		publicationDateFilter: [null, null],
		accessDateFilter: [null, null],
		includeRevoked: false
	}
};

const init = (initialState) => {
	return initialState;
};

const handleSetAlert = (state, action) => {
	const alerts = {
		...state.alerts,
		...action.payload
	}
	return {
		...state,
		alerts
	};
}

const handleSetMultipleStates = (state, action) => {
	return {
		...state,
		...action.payload
	}
}

function reducer(state, action) {
	switch (action.type) {
		case 'SET_STATE':
			return handleSetMultipleStates(state, action);
		case 'SET_ALERT':
			return handleSetAlert(state, action);
		case 'SET_EXPORT_DIALOG_VISIBLE':
			return {
				...state,
				exportDialogVisible: action.payload,
				isSelectedDocs: action.payload
			};
		case 'REST_SEARCH_SETTINGS':
			return {
				...state,
				searchSettings: initState.searchSettings
			};
		case 'RESET_STATE':
			return {
				...initState,
				searchSettings: state.searchSettings,
				componentStepNumbers: state.componentStepNumbers,
				tutorialJoyrideSteps: state.tutorialJoyrideSteps,
				userData: state.userData,
				documentProperties: state.documentProperties
			};
		default:
			return state;
	}
}

const DefaultContext = React.createContext(initState);

const DefaultProvider = React.memo((props) => {
	const [state, dispatch] = useReducer(reducer, initState, init);
	
	return (
		<DefaultContext.Provider value={{state, dispatch}}>
			{props.children}
		</DefaultContext.Provider>
	);
});

export { DefaultContext, DefaultProvider };
