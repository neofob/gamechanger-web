export default {
	HOME_APP_BASE_URL: "http://localhost:8080",
	DASHBOARD_DEFAULT_SYSTEM: 'GFEBS',
	API_URL: "http://localhost:8990",
	ROOT_CLONE: "gamechanger",
	GLUU_SSO_ENABLED: 'disabled',
	TLD: 'mil',
	QLIK_URL: "http://localhost:8080",
	GAMECHANGER_DECOUPLED_URL: 'https://gamechanger.advana.data.mil',
	STREAMSETS_URL: 'https://streamsets',
	CLASSIFICATION_BANNER_TEXT: 'DEVELOPMENT',
	CLASSIFICATION_BANNER_COLOR: 'green',
	HELP_DESK_LINK: 'https://support.advana.data.mil',
	TRIFACTA_LINK: 'https://trifacta.advana.data.mil',
	CONFLUENCE_LINK: 'https://wiki.advana.data.mil',
	NFR_LINK: 'https://nfr.advana.data.mil',
	DATA_CATALOG_LINK: "http://data-catalog.local:8443",
  MATOMO_LINK: 'https://matomo',
//	MATOMO_LINK: window?.__env__?.REACT_APP_MATOMO_LINK
//		? window?.__env__?.REACT_APP_MATOMO_LINK
//		: process.env.REACT_APP_MATOMO_LINK,
	MATOMO_SITE_ID: window?.__env__?.REACT_APP_MATOMO_SITE_ID
		? window?.__env__?.REACT_APP_MATOMO_SITE_ID
		: process.env.REACT_APP_MATOMO_SITE_ID
		? process.env.REACT_APP_MATOMO_SITE_ID
		: 2,
	MAX_SIMPLE_TABLE_CELLS: 50000,
	PERMISSIONS: {
		GAMECHANGER_ADMIN: 'Gamechanger Admin',
		SUPER_ADMIN: 'Webapp Super Admin',
		UNSUPER_ADMIN: 'Tier 3 Support',
	},
	GAMECHANGER: {
		SHOW_ASSIST: true,
		USE_NEO4J: true,
		SEARCH_VERSION: 1,
		SHOW_TOPICS: true,
		SHOW_DATERANGES: true,
		SHOW_SOURCE_TRACKER: false,
	},
	USER_TOKEN_ENDPOINT: "http://localhost:8080/api/auth/token",
	JEXNET_LINK: "http://localhost:8080",
};
