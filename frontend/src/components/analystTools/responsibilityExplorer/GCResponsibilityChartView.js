import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import styled from 'styled-components';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import {
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	TextField,
	Typography,
} from '@material-ui/core';
import { backgroundGreyDark, backgroundGreyLight, backgroundWhite, gcOrange } from '../../common/gc-colors';
import GCPrimaryButton from '../../common/GCButton';
import GameChangerAPI from '../../api/gameChanger-service-api';
import { trackEvent } from '../../telemetry/Matomo';
import { CustomDimensions } from '../../telemetry/utils';
import Link from '@material-ui/core/Link';
import Icon from '@material-ui/core/Icon';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import LoadingIndicator from '@dod-advana/advana-platform-ui/dist/loading/LoadingIndicator';
import CheckCircleOutlinedIcon from '@material-ui/icons/CheckCircleOutlined';
import { getTrackingNameForFactory, exportToCsv } from '../../../utils/gamechangerUtils';

const _ = require('lodash');

const FilterInput = ({ value, setValue }) => {
	return (
		<input
			type="text"
			value={value}
			style={{ width: '100%' }}
			onChange={(e) => {
				setValue(e.target.value);
			}}
		/>
	);
};

const useStyles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexWrap: 'wrap',
		margin: '0 20px',
	},
	textField: {
		marginLeft: theme.spacing(1),
		marginRight: theme.spacing(1),
		width: '25ch',
		'& .MuiFormHelperText-root': {
			fontSize: 12,
		},
	},
	textFieldWide: {
		marginLeft: theme.spacing(1),
		marginRight: theme.spacing(1),
		minWidth: '50ch',
		'& .MuiFormHelperText-root': {
			fontSize: 12,
		},
	},
	dialogLg: {
		maxWidth: '800px',
		minWidth: '800px',
	},
	closeButton: {
		position: 'absolute',
		right: '0px',
		top: '0px',
		height: 60,
		width: 60,
		color: 'black',
		backgroundColor: backgroundGreyLight,
		borderRadius: 0,
	},
	checkedLabel: {
		fontSize: 16,
	},
	textFieldFilter: {
		marginLeft: theme.spacing(1),
		marginRight: theme.spacing(1),
		'& .MuiOutlinedInput-root': {
			height: 26,
			fontSize: 16,
		},
	},
}));

const TableRow = styled.div`
	text-align: left;
	max-height: 250px;
	min-height: 20px;
`;

const gameChangerAPI = new GameChangerAPI();
const PAGE_SIZE = 10;

const getData = async ({ limit = PAGE_SIZE, offset = 0, sorted = [], filtered = [] }) => {
	const order = sorted.map(({ id, desc }) => [id, desc ? 'DESC' : 'ASC']);
	const where = filtered;

	try {
		const { data } = await gameChangerAPI.getResponsibilityData({
			limit,
			offset,
			order,
			where,
		});
		return data;
	} catch (err) {
		this.logger.error(err.message, 'GEADAKS');
		return [];
	}
};

const preventDefault = (event) => event.preventDefault();

const GCResponsibilityChartView = ({
	state,
	filters,
	setFilters,
	docTitle,
	setDocTitle,
	organization,
	setOrganization,
	responsibilityText,
	setResponsibilityText,
}) => {
	const classes = useStyles();
	const [responsibilityTableData, setResponsibilityTableData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [numPages, setNumPages] = useState(0);

	const [sorts, setSorts] = useState([]);
	const [pageIndex, setPageIndex] = useState(0);
	const [hoveredRow, setHoveredRow] = useState(null);
	const [selectRows, setSelectRows] = useState(false);
	const [selectedIds, setSelectedIds] = useState([]);
	const [showReportModal, setShowReportModal] = useState(false);
	const [issueDescription, setIssueDescription] = useState('');
	const [sendingReports, setSendingReports] = useState(false);
	const [reportsSent, setReportsSent] = useState(false);
	const [reloadResponsibilityTable, setReloadResponsibilityTable] = useState(true);

	useEffect(() => {
		if (reloadResponsibilityTable) {
			handleFetchData({ page: pageIndex, sorted: sorts, filtered: filters });
			setReloadResponsibilityTable(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageIndex, sorts, filters]);

	useEffect(() => {
		const newFilters = [];
		if (Object.keys(responsibilityText).length) newFilters.push(responsibilityText);
		if (organization.length) {
			organization.forEach((org) => {
				newFilters.push({ id: 'organizationPersonnelText', value: org });
			});
		}
		if (docTitle.length) {
			docTitle.forEach((doc) => {
				newFilters.push({ id: 'documentTitle', value: doc.documentTitle });
			});
		}
		setFilters(newFilters);
		setReloadResponsibilityTable(true);
	}, [docTitle, organization, responsibilityText, setFilters]);

	const handleFetchData = async ({ page, sorted, filtered }) => {
		try {
			setLoading(true);
			const tmpFiltered = _.cloneDeep(filtered);
			const { totalCount, results = [] } = await getData({
				offset: page * PAGE_SIZE,
				sorted,
				filtered: tmpFiltered,
			});
			const pageCount = Math.ceil(totalCount / PAGE_SIZE);
			setNumPages(pageCount);
			results.forEach((result) => {
				result.selected = selectedIds.includes(result.id);
			});
			setResponsibilityTableData(results);
		} catch (e) {
			setResponsibilityTableData([]);
			setNumPages(0);
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const exportCSV = async () => {
		try {
			const { results = [] } = await getData({
				limit: null,
				offset: 0,
				sorted: sorts,
				filtered: filters,
			});
			const rtnResults = results.filter((result) => {
				return selectedIds.includes(result.id);
			});
			trackEvent(
				getTrackingNameForFactory(state.cloneData.clone_name),
				'ResponsibilityTracker',
				'ExportCSV',
				selectedIds.length > 0 ? rtnResults.length : results.length
			);
			exportToCsv('ResponsibilityData.csv', selectedIds.length > 0 ? rtnResults : results, true);
			deselectRows();
		} catch (e) {
			console.error(e);
		}
	};

	const deselectRows = async () => {
		responsibilityTableData.forEach((result) => {
			result.selected = false;
		});
		setSelectRows(false);
		setSelectedIds([]);
	};

	const renderDataTable = () => {
		const dataColumns = [
			{
				Header: 'Document Title',
				accessor: 'documentTitle',
				style: { whiteSpace: 'unset' },
				width: 300,
				Filter: (
					<FilterInput
						value={docTitle.map((doc) => doc.documentTitle).join(' AND ')}
						setValue={(filter) => {
							const splitFilter = filter.split(' AND ');
							const parsedFilter = splitFilter.map((docFilter) => {
								return { documentTitle: docFilter };
							});
							setDocTitle(parsedFilter);
						}}
					/>
				),
				Cell: (row) => (
					<TableRow>
						<Link
							href={'#'}
							onClick={(event) => {
								preventDefault(event);
								fileClicked(row.row._original.filename, row.row.responsibilityText, 1);
							}}
							style={{ color: '#386F94' }}
						>
							<div>
								<p>{row.value}</p>
							</div>
						</Link>
					</TableRow>
				),
			},
			{
				Header: 'Entity',
				accessor: 'organizationPersonnelText',
				style: { whiteSpace: 'unset' },
				Filter: (
					<FilterInput
						value={organization.join(' AND ')}
						setValue={(filter) => {
							const parsedFilter = filter.split(' AND ');
							setOrganization(parsedFilter);
						}}
					/>
				),
				Cell: (row) => <TableRow>{row.value}</TableRow>,
			},
			{
				Header: 'Responsibility Text',
				accessor: 'responsibilityText',
				style: { whiteSpace: 'unset' },
				Filter: (
					<FilterInput
						value={responsibilityText?.value || ''}
						setValue={(filter) => setResponsibilityText({ id: 'responsibilityText', value: filter })}
					/>
				),
				Cell: (row) => <TableRow>{row.value}</TableRow>,
			},
			{
				Header: 'Select',
				accessor: 'id',
				style: { whiteSpace: 'unset' },
				show: selectRows,
				filterable: false,
				width: 120,
				sortable: false,
				Cell: (row) => (
					<TableRow>
						<Checkbox
							style={styles.checkbox}
							onChange={() => handleSelected(row.value)}
							color="primary"
							icon={
								<CheckBoxOutlineBlankIcon
									style={{ width: 25, height: 25, fill: 'rgb(224, 224, 224)' }}
									fontSize="large"
								/>
							}
							checkedIcon={<CheckBoxIcon style={{ width: 25, height: 25, fill: gcOrange }} />}
							checked={selectedIds.includes(row.original.id)}
						/>
					</TableRow>
				),
			},
		];

		return (
			<ReactTable
				className="re-tutorial-step-7"
				data={responsibilityTableData}
				columns={dataColumns}
				style={{ height: 700, marginTop: 10 }}
				pageSize={PAGE_SIZE}
				showPageSizeOptions={false}
				filterable={true}
				manualSortBy={true}
				onSortedChange={(newSorts) => {
					setSorts(newSorts);
					setReloadResponsibilityTable(true);
				}}
				onPageChange={(page) => {
					setPageIndex(page);
					setReloadResponsibilityTable(true);
				}}
				defaultSorted={[
					{
						id: 'id',
						desc: false,
					},
				]}
				loading={loading}
				manual={true}
				pages={numPages}
				getTheadTrProps={() => {
					return {
						style: {
							height: 'fit-content',
							textAlign: 'left',
							fontWeight: 'bold',
							maxHeight: '400px',
						},
					};
				}}
				getTheadThProps={() => {
					return { style: { fontSize: 15, fontWeight: 'bold' } };
				}}
				getTrProps={(_stateProp, rowInfo, _column) => {
					if (rowInfo && rowInfo.row) {
						return {
							onMouseEnter: () => {
								setHoveredRow(rowInfo.index);
							},
							onMouseLeave: () => {
								setHoveredRow(null);
							},
							style: {
								background: rowInfo.index === hoveredRow ? '#efefef' : 'white',
								cursor: 'pointer',
							},
						};
					} else {
						return {};
					}
				}}
			/>
		);
	};

	const fileClicked = (filename, searchText, pageNumber) => {
		trackEvent(
			getTrackingNameForFactory(state.cloneData.clone_name),
			'ResponsibilityTracker',
			'PDFOpen',
			null,
			CustomDimensions.create(true, filename, pageNumber)
		);
		let tempSearchText;
		if (searchText) {
			const searchTextArray = searchText.split(' ');
			if (searchTextArray[0].match(/(\(\w{1,2}\)|\w{1,2}\.)/)) searchTextArray[0] += ' ';
			tempSearchText = searchTextArray.join(' ');
		}
		window.open(
			`/#/pdfviewer/gamechanger?filename=${filename.replace('.json', '.pdf')}&${
				searchText ? 'prevSearchText="' + tempSearchText + '"&' : ''
			}pageNumber=${pageNumber}&cloneIndex=${state.cloneData?.clone_name}`
		);
	};

	const handleSelected = (id) => {
		responsibilityTableData.forEach((row) => {
			if (row['id'] === id) {
				row.selected = !row.selected;
				trackEvent(
					getTrackingNameForFactory(state.cloneData.clone_name),
					'ResponsibilityTracker',
					`ID ${row.selected ? 'Selected' : 'Des-Selected'}`,
					id
				);
				if (row.selected) {
					const newSelectedIds = [...selectedIds];
					newSelectedIds.push(id);
					setSelectedIds(newSelectedIds);
				} else {
					const newSelectedIds = [...selectedIds];
					newSelectedIds.splice(selectedIds.indexOf(id), 1);
					setSelectedIds(newSelectedIds);
				}
			}
		});
	};

	const handleCancelSelect = () => {
		deselectRows();
		trackEvent(
			getTrackingNameForFactory(state.cloneData.clone_name),
			'ResponsibilityTracker',
			'Cancel Select Rows'
		);
	};

	const hideShowReportModal = (show) => {
		trackEvent(
			getTrackingNameForFactory(state.cloneData.clone_name),
			'ResponsibilityTracker',
			`${show ? 'Opening' : 'Closing'} Reports Modal`
		);
		if (show) {
			setReportsSent(false);
		}
		setShowReportModal(show);
	};

	const renderReportModal = () => {
		return (
			<div>
				<FormControl style={{ width: '95%', margin: '20px 20px 10px 20px' }}>
					<TextField
						variant="outlined"
						placeholder="Enter issue information here..."
						multiline
						rows={9}
						width="75%"
						value={issueDescription}
						onBlur={(e) => setIssueDescription(e.target.value)}
					/>
				</FormControl>
			</div>
		);
	};

	const submitReport = async () => {
		setSendingReports(true);
		for (const reportId in selectedIds) {
			await gameChangerAPI.storeResponsibilityReportData({
				id: reportId,
				issue_description: issueDescription,
			});
		}
		trackEvent(
			getTrackingNameForFactory(state.cloneData.clone_name),
			'ResponsibilityTracker',
			'Reports Sent',
			selectedIds.length
		);
		setSelectedIds([]);
		setSelectRows(false);
		setIssueDescription('');
		setSendingReports(false);
		setReportsSent(true);
		setShowReportModal(false);
	};

	const renderLoading = () => {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					flexDirection: 'column',
				}}
			>
				<LoadingIndicator />
			</div>
		);
	};

	const renderSuccess = () => {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					flexDirection: 'column',
				}}
			>
				<CheckCircleOutlinedIcon
					style={{
						alignSelf: 'center',
						marginTop: '150px',
						height: '75px',
						width: '75px',
						filter: 'invert(26%) sepia(49%) saturate(1486%) hue-rotate(146deg) brightness(72%) contrast(103%)',
					}}
				/>

				<h1 style={{ marginTop: '50px', alignSelf: 'center' }}>Thank You! We appreciate the feedback.</h1>
			</div>
		);
	};

	return (
		<>
			<div style={styles.disclaimerContainer}>
				Data in the table below does not currently reflect all documents in GAMECHANGER. As we continue to
				process data for this capability, please check back later or reach us by email if your document/s of
				interest are not yet included: osd.pentagon.ousd-c.mbx.advana-gamechanger@mail.mil
			</div>

			<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
				{selectRows ? (
					<div>
						<GCPrimaryButton buttonColor={'#131E43'} onClick={handleCancelSelect}>
							Cancel <Icon className="fa fa-times" style={styles.buttons} />
						</GCPrimaryButton>
						<GCPrimaryButton onClick={exportCSV}>
							Export <Icon className="fa fa-external-link" style={styles.buttons} />
						</GCPrimaryButton>
						{/* <GCPrimaryButton buttonColor={'red'} onClick={reportButtonAction}>
							Update <Icon className="fa fa-bug" style={styles.buttons}/>
						</GCPrimaryButton> */}
						<div style={styles.spacer} />
					</div>
				) : (
					<div>
						<GCPrimaryButton onClick={() => setSelectRows(true)}>Select Rows</GCPrimaryButton>
						<div style={styles.spacer} />
					</div>
				)}
			</div>

			{renderDataTable()}

			<Dialog
				open={showReportModal}
				scroll={'paper'}
				maxWidth="lg"
				disableEscapeKeyDown
				disableBackdropClick
				classes={{
					paperWidthLg: classes.dialogLg,
				}}
			>
				<DialogTitle>
					<div style={{ display: 'flex', width: '100%' }}>
						<Typography variant="h3" display="inline" style={{ fontWeight: 700 }}>
							Report Issues with Data
						</Typography>
					</div>
					<IconButton
						aria-label="close"
						style={{
							position: 'absolute',
							right: '0px',
							top: '0px',
							height: 60,
							width: 60,
							color: 'black',
							backgroundColor: backgroundGreyLight,
							borderRadius: 0,
						}}
						onClick={() => hideShowReportModal(false)}
					>
						<CloseIcon style={{ fontSize: 30 }} />
					</IconButton>
				</DialogTitle>

				<DialogContent style={{ height: 300 }}>
					{sendingReports && renderLoading()}
					{reportsSent && renderSuccess()}
					{!sendingReports && renderReportModal()}
				</DialogContent>

				<DialogActions>
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							width: '100%',
							margin: '0px 18px',
						}}
					>
						<GCPrimaryButton
							id={'editCloneSubmit'}
							onClick={() => submitReport()}
							style={{ margin: '10px' }}
						>
							Submit
						</GCPrimaryButton>
					</div>
				</DialogActions>
			</Dialog>
		</>
	);
};

const styles = {
	buttons: {
		paddingTop: 2,
	},
	tabsList: {
		borderBottom: `2px solid ${gcOrange}`,
		padding: 0,
		display: 'flex',
		alignItems: 'center',
		flex: 9,
		margin: '10px 0 10px 50px',
	},
	tabStyle: {
		width: '140px',
		border: '1px solid',
		borderColor: backgroundGreyDark,
		borderBottom: 'none !important',
		borderRadius: `6px 6px 0px 0px`,
		position: ' relative',
		listStyle: 'none',
		padding: '2px 12px',
		cursor: 'pointer',
		textAlign: 'center',
		backgroundColor: backgroundWhite,
		marginRight: '2px',
		marginLeft: '2px',
		height: 45,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	tabSelectedStyle: {
		border: '1px solid transparent',
		backgroundColor: gcOrange,
		borderColor: 'none',
		color: 'white',
	},
	tabContainer: {
		alignItems: 'center',
		minHeight: '613px',
	},
	tabButtonContainer: {
		backgroundColor: '#ffffff',
		width: '100%',
		display: 'flex',
		paddingLeft: '2em',
		paddingRight: '5em',
		paddingBottom: '5px',
		alignItems: 'center',
	},
	panelContainer: {
		alignItems: 'center',
		marginTop: 10,
		minHeight: 'calc(100vh - 600px)',
		paddingBottom: 20,
	},
	disclaimerContainer: {
		alignItems: 'center',
		fontWeight: 'bold',
	},
};

GCResponsibilityChartView.propTypes = {
	state: propTypes.objectOf({
		cloneData: propTypes.objectOf({
			clone_name: propTypes.string,
		}),
	}),
};

export default GCResponsibilityChartView;
