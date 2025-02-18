import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Select, MenuItem, Typography, Grid, Card, CardContent } from '@material-ui/core';
import moment from 'moment';
import { Tabs, Tab, TabPanel, TabList } from 'react-tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { gcOrange } from '../common/gc-colors';
import TabStyles from '../common/TabStyles';
import GameChangerAPI from '../api/gameChanger-service-api';
import LoadingIndicator from '@dod-advana/advana-platform-ui/dist/loading/LoadingIndicator';
import GCPrimaryButton from '../common/GCButton';
import { trackEvent } from '../telemetry/Matomo';
import { encode } from '../../utils/gamechangerUtils';
import { styles } from './util/GCAdminStyles';
import './searchPdfStyles.css';

const gameChangerAPI = new GameChangerAPI();

const DatePickerWrapper = styled.div`
	margin-right: 10px;
	display: flex;
	flex-direction: column;

	> label {
		text-align: left;
		margin-bottom: 2px;
		color: #3f4a56;
		font-size: 15px;
		font-family: Noto Sans;
	}

	> .react-datepicker-wrapper {
		> .react-datepicker__input-container {
			> input {
				width: 225px;
				border: 0;
				outline: 0;
				border-bottom: 1px solid black;
			}
		}
	}
`;

const TableRow = styled.div`
	text-align: center;
`;

export const filterCaseInsensitiveIncludes = (filter, row) => {
	const id = filter.pivotId || filter.id;
	return row[id] !== undefined ? String(row[id].toLowerCase()).includes(filter.value.toLowerCase()) : false;
};

const getDateAsStringWithoutSeconds = (date) => {
	return date.toLocaleString([], {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const columns = [
	{
		Header: 'User ID',
		accessor: 'idvisitor',
		width: 200,
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Visit ID',
		accessor: 'idvisit',
		width: 100,
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Search Time',
		accessor: 'searchtime_formatted',
		width: 200,
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Action',
		accessor: 'action',
		width: 200,
		style: { whiteSpace: 'unset' },
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Search',
		accessor: 'value',
		width: 200,
		style: { whiteSpace: 'unset' },
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Document Opened',
		accessor: 'display_title_s',
		width: 250,
		style: { whiteSpace: 'unset' },
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Document Time',
		accessor: 'documenttime',
		width: 200,
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Displayed Document Type',
		accessor: 'display_doc_type_s',
		width: 175,
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Document Type',
		accessor: 'doc_type',
		width: 100,
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Organization',
		accessor: 'display_org_s',
		width: 100,
		style: { whiteSpace: 'unset' },
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Topics',
		accessor: 'topics_rs',
		style: { whiteSpace: 'unset' },
		width: 250,
		Cell: (row) => {
			let finalString = '';
			if (row.value !== undefined) {
				finalString = Object.keys(row.value).join(', ');
			}
			return <TableRow>{finalString}</TableRow>;
		},
	},
	{
		Header: 'Keywords',
		accessor: 'keyw_5',
		width: 250,
		style: { whiteSpace: 'unset' },
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Crawler',
		accessor: 'crawler_used_s',
		width: 250,
		style: { whiteSpace: 'unset' },
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Source',
		accessor: 'display_source_s',
		width: 250,
		style: { whiteSpace: 'unset' },
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
];

const userAggColumns = [
	{
		Header: 'User ID',
		accessor: 'user_id',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Organization',
		accessor: 'org',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Documents Opened',
		accessor: 'docs_opened',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Total Searches',
		accessor: 'searches_made',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Last Search Made',
		accessor: 'last_search_formatted',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
];

const feedbackColumns = [
	{
		Header: 'Feedback Event',
		accessor: 'event_name',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'User ID',
		accessor: 'user_id',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Feedback Time',
		accessor: 'createdAt',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Search',
		accessor: 'value_1',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Returned',
		accessor: 'value_2',
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
];

const documentUsageColumns = [
	{
		Header: 'Document',
		accessor: 'document',
		width: 400,
		headerStyle: { textAlign: 'left', paddingLeft: '15px' },
		style: { whiteSpace: 'unset' },
		filterMethod: (filter, row) => filterCaseInsensitiveIncludes(filter, row),
		Cell: (row) => <TableRow style={{ textAlign: 'left', paddingLeft: '15px' }}>{row.value}</TableRow>,
	},
	{
		Header: 'View Count',
		accessor: 'visit_count',
		width: 140,
		filterable: false,
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Unique Viewers',
		accessor: 'user_count',
		width: 140,
		filterable: false,
		Cell: (row) => <TableRow>{row.value}</TableRow>,
	},
	{
		Header: 'Viewer List',
		accessor: 'user_list',
		headerStyle: { textAlign: 'left', paddingLeft: '15px' },
		sortable: false,
		filterMethod: (filter, row) => filterCaseInsensitiveIncludes(filter, row),
		style: { whiteSpace: 'unset' },
		Cell: (row) => <TableRow style={{ textAlign: 'left', paddingLeft: '15px' }}>{row.value}</TableRow>,
	},
	{
		Header: 'Searches',
		accessor: 'searches',
		sortable: false,
		filterMethod: (filter, row) => filterCaseInsensitiveIncludes(filter, row),
		style: { whiteSpace: 'unset' },
		Cell: (row) => <TableRow style={{ textAlign: 'left', paddingLeft: '15px' }}>{row.value}</TableRow>,
	},
];

const sourceInteractionsColumns = [
	{
		Header: 'Crawler',
		accessor: 'crawler',
		width: 200,
		Cell: (row) => <TableRow className="source-interaction-row">{row.value}</TableRow>,
	},
	{
		Header: 'Data Source',
		accessor: 'dataSource',
		width: 200,
		Cell: (row) => <TableRow className="source-interaction-row">{row.value}</TableRow>,
	},
	{
		Header: 'Organization',
		accessor: 'org',
		width: 200,
		Cell: (row) => <TableRow className="source-interaction-row">{row.value}</TableRow>,
	},
	{
		Header: '# Total Documents (current)',
		accessor: 'numTotalDocuments',
		width: 200,
		Cell: (row) => <TableRow className="source-interaction-row">{row.value}</TableRow>,
	},
	{
		Header: '# Events',
		accessor: 'numTotalEvents',
		width: 200,
		Cell: (row) => <TableRow className="source-interaction-row">{row.value}</TableRow>,
	},
	{
		Header: '# Unique Documents Interacted With',
		accessor: 'numUniqueDocuments',
		width: 200,
		Cell: (row) => <TableRow className="source-interaction-row">{row.value}</TableRow>,
	},
	{
		Header: '# Unique Users',
		accessor: 'numUniqueUsers',
		width: 200,
		Cell: (row) => <TableRow className="source-interaction-row">{row.value}</TableRow>,
	},
	{
		Header: '# Events by User',
		accessor: 'userCounts',
		width: 300,
		Cell: (row) => (
			<TableRow>
				{Object.entries(row.value).map(([userId, count]) => (
					<li key={userId} className="source-interaction-bullet">
						{userId} : {count}
					</li>
				))}
			</TableRow>
		),
	},
	{
		Header: '# Events by Type',
		accessor: 'actionCounts',
		width: 450,
		Cell: (row) => (
			<TableRow>
				{Object.entries(row.value).map(([action, count]) => (
					<li key={action} className="source-interaction-bullet">
						{action} : {count}
					</li>
				))}
			</TableRow>
		),
	},
	{
		Header: '# Events by Filename',
		accessor: 'fileCounts',
		width: 400,
		Cell: (row) => (
			<TableRow>
				{Object.entries(row.value).map(([filename, count]) => (
					<li key={filename} className="source-interaction-bullet">
						{filename} : {count}
					</li>
				))}
			</TableRow>
		),
	},
];

/**
 * This method renders the documents for react table
 * @method subComponent
 */
const subComponent = (row) => {
	return (
		<div>
			<Grid container spacing={2}>
				<Grid item xs={1}></Grid>
				<Grid item xs={4}>
					<p>Opened:</p>
					<ol>
						{row.original.opened.map((o) => (
							<li key={o}>
								<a
									target={'_blank'}
									rel="noreferrer"
									href={`/#/pdfviewer/gamechanger?filename=${encode(o)}`}
								>
									{' '}
									{o}{' '}
								</a>
							</li>
						))}
					</ol>
				</Grid>
				<Grid item xs={3}>
					<p>Exported:</p>
					<ol>
						{row.original.ExportDocument.map((e) => (
							<li key={e}>
								<a
									target={'_blank'}
									rel="noreferrer"
									href={`/#/pdfviewer/gamechanger?filename=${encode(e)}`}
								>
									{' '}
									{e}{' '}
								</a>
							</li>
						))}
					</ol>
				</Grid>
				<Grid item xs={4}>
					<p>Favorited:</p>
					<ol>
						{row.original.Favorite.map((f) => (
							<li key={f}>
								<a
									target={'_blank'}
									rel="noreferrer"
									href={`/#/pdfviewer/gamechanger?filename=${encode(f)}`}
								>
									{' '}
									{f}{' '}
								</a>
							</li>
						))}
					</ol>
				</Grid>
			</Grid>
		</div>
	);
};

/**
 * Takes in a set time to go back in the query
 * @param {string} back
 * @method timeBack
 */
const timeBack = async (back, setStartDateFunction, setEndDateFunction) => {
	switch (back) {
		case 'day':
			setStartDateFunction(moment().subtract(1, 'days').set({ hour: 0, minute: 0 })._d);
			setEndDateFunction(moment()._d);
			break;
		case 'week':
			setStartDateFunction(moment().subtract(7, 'days').set({ hour: 0, minute: 0 })._d);
			setEndDateFunction(moment()._d);
			break;
		case 'month':
			setStartDateFunction(moment().subtract(1, 'months').set({ hour: 0, minute: 0 })._d);
			setEndDateFunction(moment()._d);
			break;
		default:
			break;
	}
};

/**
 * This class queries a search to pdf mapping from matomo
 * and visualizes it as a tabel as well as provide the option
 * to download as a csv
 * @class SearchPdfMapping
 */
export default () => {
	// Set state variables
	const [mappingData, setMappingData] = useState([]);
	const [feedbackData, setFeedbackData] = useState([]);
	const [documentData, setDocumentData] = useState([]);
	const [userAggData, setUserAggData] = useState([]);
	const [cardData, setCardData] = useState({ unique_users: 0, total_searches: 0, unique_searches: 0, new_users: 0 });
	const [graphData, setGraphData] = useState({ userBar: [], searchBar: [] });
	const [startDate, setStartDate] = useState(moment().subtract(3, 'd').set({ hour: 0, minute: 0 })._d);
	const [endDate, setEndDate] = useState(moment()._d);
	const [tabIndex, setTabIndex] = useState('userAgg');
	const [cloneName, setCloneName] = useState('');
	const [cloneList, setCloneList] = useState([]);
	const [sourceInteractions, setSourceInteractions] = useState([]);
	const [loaded, setLoading] = useState({
		userGraph: false,
		userData: false,
		searchMapping: false,
		sourceInteractions: false,
	});

	const handleDateChange = (date, setFunction) => {
		setFunction(date);
	};

	/**
	 * This method queries postgres for clone data.
	 * The query is handled in gamechanger-api.
	 * @method getCloneData
	 */
	const getCloneData = async () => {
		const data = await gameChangerAPI.getClonesMatomo();
		setCloneList(data.data.clones);
		setCloneName(`${data.data.default.category_id}-${data.data.default.name}`);
	};

	/**
	 * This method takes the a csv name + array in state
	 * and saves it to the users downloads as a csv.
	 * @method exportData
	 */
	const exportData = async (name) => {
		const params = {
			startDate: moment(startDate).utc().format('YYYY-MM-DD HH:mm'),
			endDate: moment(endDate).utc().format('YYYY-MM-DD HH:mm'),
			table: name,
			cloneName: cloneName.split('-')[1],
			cloneID: cloneName.split('-')[0],
		};
		const data = await gameChangerAPI.exportUserData(params);
		const url = window.URL.createObjectURL(
			new Blob([data.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
		);
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', `${name}.csv`); //or any other extension
		document.body.appendChild(link);
		link.click();
	};

	/**
	 * This method queries Matomo for documents based on search.
	 * The query is handled in gamechanger-api.
	 * @method getSearchPdfMapping
	 */
	const getSearchPdfMapping = useCallback(() => {
		setLoading((prevState) => ({
			...prevState,
			searchMapping: false,
		}));
		const params = {
			startDate: moment(startDate).utc().format('YYYY-MM-DD HH:mm'),
			endDate: moment(endDate).utc().format('YYYY-MM-DD HH:mm'),
			cloneName: cloneName.split('-')[1],
			cloneID: cloneName.split('-')[0],
			limit: 100,
		};
		gameChangerAPI.getSearchPdfMapping(params).then((data) => {
			setMappingData(data.data.data);
			setLoading((prevState) => ({
				...prevState,
				searchMapping: true,
			}));
		});
	}, [startDate, endDate, cloneName]);

	const getSourceInteractions = useCallback(() => {
		setLoading((prevState) => ({
			...prevState,
			sourceInteractions: false,
		}));
		const params = {
			startDate: moment(startDate).utc().format('YYYY-MM-DD HH:mm'),
			endDate: moment(endDate).utc().format('YYYY-MM-DD HH:mm'),
			cloneID: cloneName.split('-')[0],
		};
		gameChangerAPI
			.getSourceInteractions(params)
			.then((data) => {
				setSourceInteractions(data.data.data.data);
				setLoading((prevState) => ({
					...prevState,
					sourceInteractions: true,
				}));
			})
			.catch((error) => {
				console.log(error);
				setSourceInteractions([]);
				setLoading((prevState) => ({
					...prevState,
					sourceInteractions: true,
				}));
			});
	}, [startDate, endDate, cloneName]);

	/**
	 * This method queries postgres for feedback data.
	 * The query is handled in gamechanger-api.
	 * @method getFeedbackData
	 */
	const getFeedbackData = useCallback(() => {
		gameChangerAPI.getFeedbackData().then((data) => {
			setFeedbackData(data.data.results);
		});
	}, []);

	/**
	 * This method queries postgres for feedback data.
	 * The query is handled in gamechanger-api.
	 * @method getDocumentData
	 */
	const getDocumentData = useCallback(() => {
		const params = { startDate, endDate };
		gameChangerAPI.getDocumentUsage(params).then((data) => {
			setDocumentData(data.data.data);
		});
	}, [startDate, endDate]);

	/**
	 * This method queries postgres for user aggregations.
	 * The query is handled in gamechanger-api.
	 * @method getUserAggData
	 */
	const getUserAggData = useCallback(() => {
		setLoading((prevState) => ({
			...prevState,
			userData: false,
		}));
		const params = {
			startDate: moment(startDate).utc().format('YYYY-MM-DD HH:mm'),
			endDate: moment(endDate).utc().format('YYYY-MM-DD HH:mm'),
			cloneName: cloneName.split('-')[1],
			cloneID: cloneName.split('-')[0],
		};
		gameChangerAPI
			.getUserAggregations(params)
			.then((data) => {
				setUserAggData(data.data.users);
				setLoading((prevState) => ({
					...prevState,
					userData: true,
				}));
			})
			.catch((err) => {
				console.log(err);
				setUserAggData([]);
				setLoading((prevState) => ({
					...prevState,
					userData: true,
				}));
			});
	}, [startDate, endDate, cloneName]);

	/**
	 * This method queries postgres for graph data.
	 * The query is handled in gamechanger-api.
	 * @method getUserGraphData
	 */
	const getUserGraphData = useCallback(() => {
		setLoading((prevState) => ({
			...prevState,
			userGraph: false,
		}));
		const params = {
			startDate: moment(startDate).utc().format('YYYY-MM-DD HH:mm'),
			endDate: moment(endDate).utc().format('YYYY-MM-DD HH:mm'),
			cloneName: cloneName.split('-')[1],
			cloneID: cloneName.split('-')[0],
		};
		gameChangerAPI
			.getUserDashboard(params)
			.then((data) => {
				setGraphData({
					searchBar: data.data.searchBar,
					userBar: data.data.userBar,
				});
				setCardData(data.data.cards);
				setLoading((prevState) => ({
					...prevState,
					userGraph: true,
				}));
			})
			.catch((err) => {
				console.log(err);
				setGraphData({
					searchBar: [],
					userBar: [],
				});
				setCardData({ unique_users: 0, total_searches: 0, unique_searches: 0 });
				setLoading((prevState) => ({
					...prevState,
					userGraph: true,
				}));
			});
	}, [startDate, endDate, cloneName]);

	useEffect(() => {
		if (cloneName !== '') {
			switch (tabIndex) {
				case 'pdfMapping':
					getSearchPdfMapping();
					break;
				case 'userAgg':
					getUserAggData();
					getUserGraphData();
					break;
				case 'userTracker':
					getDocumentData();
					break;
				case 'feedback':
					getFeedbackData();
					break;
				case 'sourceInteractions':
					getSourceInteractions();
					break;
				default:
					console.log('no tab selected');
					getUserAggData();
					getUserGraphData();
					break;
			}
		}
	}, [
		tabIndex,
		cloneName,
		getUserGraphData,
		getUserAggData,
		getDocumentData,
		getFeedbackData,
		getSearchPdfMapping,
		getSourceInteractions,
	]);

	useEffect(() => {
		getCloneData();
	}, []);

	return (
		<div style={{ ...TabStyles.tabContainer, minHeight: 'calc(100vh-100px)' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					margin: '10px 80px',
				}}
			>
				<Grid container spacing={2}>
					<Grid item lg={2} xs={3}>
						<DatePickerWrapper>
							<label>Start Date</label>
							<DatePicker
								showTimeSelect
								selected={startDate}
								onChange={(date) => handleDateChange(date, setStartDate)}
								dateFormat="MM/dd/yyyy h:mm aa"
							/>
						</DatePickerWrapper>
					</Grid>
					<Grid item lg={2} xs={3}>
						<DatePickerWrapper>
							<label>End Date</label>
							<DatePicker
								showTimeSelect
								selected={endDate}
								onChange={(date) => handleDateChange(date, setEndDate)}
								dateFormat="MM/dd/yyyy h:mm aa"
							/>
						</DatePickerWrapper>
					</Grid>
					<Grid item lg={4} xs={4}>
						<GCPrimaryButton
							onClick={() => {
								timeBack('day', setStartDate, setEndDate);
							}}
							style={{ minWidth: 'unset' }}
						>
							Last Day
						</GCPrimaryButton>
						<GCPrimaryButton
							onClick={() => {
								timeBack('week', setStartDate, setEndDate);
							}}
							style={{ minWidth: 'unset' }}
						>
							Last Week
						</GCPrimaryButton>
						<GCPrimaryButton
							onClick={() => {
								timeBack('month', setStartDate, setEndDate);
							}}
							style={{ minWidth: 'unset' }}
						>
							Last Month
						</GCPrimaryButton>
					</Grid>
					<Grid item lg={2} xs={2}>
						<div style={{ width: '120px', display: 'inline-block' }}>Clones:</div>
						<Select
							value={cloneName}
							onChange={(e) => setCloneName(e.target.value)}
							name="labels"
							style={{
								fontSize: 'small',
								minWidth: '200px',
								margin: '10px',
							}}
						>
							{cloneList.map((clone) => {
								return (
									<MenuItem
										style={{ fontSize: 'small', display: 'flex' }}
										value={`${clone.category_id}-${clone.name}`}
										key={clone}
									>
										{clone.name}
									</MenuItem>
								);
							})}
						</Select>
					</Grid>
				</Grid>
			</div>
			<Tabs>
				<div
					style={{
						...TabStyles.tabButtonContainer,
						background: 'rgb(245 245 245)',
					}}
				>
					<TabList style={TabStyles.tabsList}>
						<Tab
							style={{
								...TabStyles.tabStyle,
								...(tabIndex === 'userAgg' ? TabStyles.tabSelectedStyle : {}),
								borderRadius: `5px 0 0 0`,
							}}
							title="userAgg"
							onClick={() => {
								setTabIndex('userAgg');
							}}
						>
							<Typography variant="h6" display="inline">
								User Aggregation
							</Typography>
						</Tab>
						<Tab
							style={{
								...TabStyles.tabStyle,
								...(tabIndex === 'pdfMapping' ? TabStyles.tabSelectedStyle : {}),
								borderRadius: `5px 0 0 0`,
							}}
							title="pdfMapping"
							onClick={() => {
								setTabIndex('pdfMapping');
							}}
						>
							<Typography variant="h6" display="inline">
								Search PDF Mapping
							</Typography>
						</Tab>
						<Tab
							style={{
								...TabStyles.tabStyle,
								...(tabIndex === 'feedback' ? TabStyles.tabSelectedStyle : {}),
								borderRadius: '0 0 0 0',
							}}
							title="feedback"
							onClick={() => setTabIndex('feedback')}
						>
							<Typography variant="h6" display="inline">
								Feedback
							</Typography>
						</Tab>
						<Tab
							style={{
								...TabStyles.tabStyle,
								...(tabIndex === 'userTracker' ? TabStyles.tabSelectedStyle : {}),
								borderRadius: `0 0 0 0`,
							}}
							title="userTracker"
							onClick={() => {
								setTabIndex('userTracker');
							}}
						>
							<Typography variant="h6" display="inline">
								User Tracker Tools
							</Typography>
						</Tab>
						<Tab
							style={{
								...TabStyles.tabStyle,
								...(tabIndex === 'sourceInteractions' ? TabStyles.tabSelectedStyle : {}),
								borderRadius: `0 0 0 0`,
							}}
							title="sourceInteractions"
							onClick={() => {
								setTabIndex('sourceInteractions');
							}}
						>
							<Typography variant="h6" display="inline">
								Source Interactions
							</Typography>
						</Tab>
					</TabList>

					<div style={TabStyles.spacer} />
				</div>

				<div style={TabStyles.panelContainer}>
					<TabPanel>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								margin: '10px 80px',
							}}
						>
							{loaded.userGraph ? (
								<Grid container spacing={2}>
									<Grid item xs={2}>
										<Card>
											<CardContent>
												<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>
													Total Searches
												</p>
												{cardData.total_searches}
											</CardContent>
										</Card>
									</Grid>
									<Grid item xs={2}>
										<Card>
											<CardContent>
												<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>
													Unique Searches
												</p>
												{cardData.unique_searches}
											</CardContent>
										</Card>
									</Grid>
									<Grid item xs={2}>
										<Card>
											<CardContent>
												<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>
													Unique Users
												</p>
												{cardData.unique_users}
											</CardContent>
										</Card>
									</Grid>
									<Grid item xs={4}></Grid>
									<Grid item xs={2}>
										<GCPrimaryButton
											onClick={() => {
												trackEvent('GAMECHANGER', 'ExportUserData', 'onClick');
												exportData('UserData');
											}}
											style={{ minWidth: 'unset' }}
										>
											Export User Data
										</GCPrimaryButton>
									</Grid>
									<Grid item xs={2}>
										<Card>
											<CardContent>
												<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>
													New Users
												</p>
												{cardData.new_users}
											</CardContent>
										</Card>
									</Grid>
									<Grid item xs={2}>
										<Card>
											<CardContent>
												<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>
													New Inactive Users
												</p>
												{cardData.new_inactive_users}
											</CardContent>
										</Card>
									</Grid>
									<Grid item xs={2}>
										<Card>
											<CardContent>
												<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>
													Total Inactive Users
												</p>
												{cardData.total_inactive_users}
											</CardContent>
										</Card>
									</Grid>
									<Grid item xs={6}></Grid>
									<Grid item xs={12} lg={6}>
										<div
											style={{
												font: 'normal normal 600 14px Noto Sans',
												color: '#666666',
												marginBottom: 10,
											}}
										>
											USERS BY MONTH
										</div>
										<div style={{ height: 250 }}>
											<ResponsiveContainer width="100%" height="100%">
												<BarChart
													data={graphData.userBar}
													margin={{
														top: 15,
														right: 30,
														left: 20,
														bottom: 5,
													}}
												>
													<XAxis dataKey="date" />
													<YAxis allowDataOverflow={true} type="number" width={35} />
													<Tooltip />
													<Bar dataKey="count" fill={gcOrange} />
												</BarChart>
											</ResponsiveContainer>
										</div>
									</Grid>
									<Grid item xs={12} lg={6}>
										<div
											style={{
												font: 'normal normal 600 14px Noto Sans',
												color: '#666666',
												marginBottom: 10,
											}}
										>
											SEARCHES BY MONTH
										</div>
										<div style={{ height: 250 }}>
											<ResponsiveContainer width="100%" height="100%">
												<BarChart
													data={graphData.searchBar}
													margin={{
														top: 15,
														right: 30,
														left: 20,
														bottom: 5,
													}}
												>
													<XAxis dataKey="date" />
													<YAxis allowDataOverflow={true} type="number" width={35} />
													<Tooltip />
													<Bar dataKey="count" fill={gcOrange} />
												</BarChart>
											</ResponsiveContainer>
										</div>
									</Grid>
								</Grid>
							) : (
								<LoadingIndicator customColor={gcOrange} />
							)}
						</div>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								margin: '10px 80px',
							}}
						>
							<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>User Data</p>
						</div>
						{loaded.userData ? (
							<ReactTable
								data={userAggData}
								columns={userAggColumns}
								defaultSorted={[{ id: 'searches_made', desc: true }]}
								style={{ margin: '0 80px 20px 80px', height: 700 }}
								SubComponent={subComponent}
							/>
						) : (
							<LoadingIndicator customColor={gcOrange} />
						)}
					</TabPanel>
					<TabPanel>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								margin: '10px 80px',
							}}
						>
							<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>
								Documents Opened Given Search
							</p>
							<GCPrimaryButton
								onClick={() => {
									trackEvent('GAMECHANGER', 'ExportSearchPDFMapping', 'onClick');
									exportData('SearchPdfMapping');
								}}
								style={{ minWidth: 'unset' }}
							>
								Export Mapping
							</GCPrimaryButton>
						</div>
						{loaded.searchMapping ? (
							<ReactTable
								data={mappingData}
								columns={columns}
								style={{ margin: '0 80px 20px 80px', height: 1000 }}
								defaultSorted={[{ id: 'searchtime', desc: true }]}
							/>
						) : (
							<LoadingIndicator customColor={gcOrange} />
						)}
					</TabPanel>
					<TabPanel>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								margin: '10px 80px',
							}}
						>
							<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>Feedback Data</p>
							<GCPrimaryButton
								onClick={() => {
									trackEvent('GAMECHANGER', 'ExportFeedback', 'onClick');
									exportData('Feedback');
								}}
								style={{ minWidth: 'unset' }}
							>
								Export Feedback
							</GCPrimaryButton>
						</div>
						<ReactTable
							data={feedbackData}
							columns={feedbackColumns}
							style={{ margin: '0 80px 20px 80px', height: 700 }}
							defaultSorted={[{ id: 'createdAt', desc: true }]}
						/>
					</TabPanel>
					<TabPanel>
						<div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 80px' }}>
							<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>Document Usage Data</p>
							<GCPrimaryButton
								onClick={() => {
									trackEvent('GAMECHANGER', 'ExportDocumentUsage', 'onClick');
									exportData('DocumentUsage');
								}}
								style={{ minWidth: 'unset' }}
							>
								Export Document Usage
							</GCPrimaryButton>
						</div>
						<ReactTable
							data={documentData}
							columns={documentUsageColumns}
							filterable={true}
							style={{ margin: '0 80px 20px 80px', height: 700 }}
							defaultSorted={[{ id: 'visit_count', desc: true }]}
						/>
					</TabPanel>
					<TabPanel>
						<div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 80px' }}>
							<p style={{ ...styles.sectionHeader, marginLeft: 0, marginTop: 10 }}>
								Source Interactions
								<br></br>
								{getDateAsStringWithoutSeconds(startDate)} - {getDateAsStringWithoutSeconds(endDate)}
							</p>
							<GCPrimaryButton
								onClick={() => {
									trackEvent('GAMECHANGER', 'ExportSourceInteractionsData', 'onClick');
									exportData('SourceInteractions');
								}}
								style={{ minWidth: 'unset' }}
							>
								Export Mapping
							</GCPrimaryButton>
							<br></br>
						</div>
						{loaded.sourceInteractions ? (
							<ReactTable
								data={sourceInteractions}
								columns={sourceInteractionsColumns}
								defaultSorted={[{ id: 'crawler', desc: true }]}
								style={{ margin: '0 80px 20px 80px', height: 700 }}
							/>
						) : (
							<LoadingIndicator customColor={gcOrange} />
						)}
					</TabPanel>
				</div>
			</Tabs>
		</div>
	);
};
