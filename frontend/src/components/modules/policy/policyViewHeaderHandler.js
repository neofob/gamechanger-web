import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createCopyTinyUrl, setState } from '../../../utils/sharedFunctions';
import { getCurrentView, getTrackingNameForFactory } from '../../../utils/gamechangerUtils';
import _ from 'lodash';

import GCButton from '../../common/GCButton';
import GCTooltip from '../../common/GCToolTip';
import { SelectedDocsDrawer } from '../../searchBar/GCSelectedDocsDrawer';
import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core';
import { useStyles } from '../default/defaultViewHeaderHandler.js';
import { trackEvent } from '../../telemetry/Matomo';

// Internet Explorer 6-11
const IS_IE = /*@cc_on!@*/ !!document.documentMode;

// Edge 20+
const IS_EDGE = !IS_IE && !!window.StyleMedia;

const PolicyViewHeaderHandler = (props) => {
	const classes = useStyles();
	const { context = {}, extraStyle = {} } = props;

	const { state, dispatch } = context;
	const {
		activeCategoryTab,
		cloneData,
		componentStepNumbers,
		currentViewName,
		listView,
		viewNames,
		categorySorting,
		currentSort,
		currentOrder,
	} = state;

	const [dropdownValue, setDropdownValue] = useState(getCurrentView(currentViewName, listView));

	const trackingCategory = getTrackingNameForFactory(state.cloneData.clone_name);

	useEffect(() => {
		if (IS_EDGE) {
			setDropdownValue('List');
			setState(dispatch, { currentViewName: 'Card', listView: true });
		}
	}, [dispatch]);

	const setDrawer = (open) => {
		setState(dispatch, { docsDrawerOpen: open });
	};

	const setDrawerReady = (ready) => {
		setState(dispatch, { isDrawerReady: ready });
	};

	const setStepIndex = (stepIndex) => {
		setState(dispatch, { stepIndex: stepIndex });
	};

	const removeSelectedDocument = (key) => {
		const { selectedDocuments } = state;

		if (selectedDocuments.has(key)) {
			selectedDocuments.delete(key);
		}

		setState(dispatch, { selectedDocuments: new Map(selectedDocuments) });
	};

	const handleChangeSort = (event) => {
		trackEvent(trackingCategory, 'ChangeSortSelection', event.target.value);
		const newSearchSettings = _.cloneDeep(state.searchSettings);
		newSearchSettings.isFilterUpdate = true;
		const {
			target: { value },
		} = event;
		setState(dispatch, {
			currentSort: value,
			currentOrder: value === 'Alphabetical' ? 'asc' : 'desc',
			resultsPage: 1,
			docSearchResults: [],
			replaceResults: true,
			runSearch: true,
			infiniteScrollPage: 1,
			searchSettings: newSearchSettings,
		});
	};

	const handleChangeOrder = (value) => {
		const newSearchSettings = _.cloneDeep(state.searchSettings);
		newSearchSettings.isFilterUpdate = true;
		setState(dispatch, {
			currentOrder: value,
			resultsPage: 1,
			docSearchResults: [],
			replaceResults: true,
			runSearch: true,
			searchSettings: newSearchSettings,
		});
	};

	const handleChangeView = (event) => {
		trackEvent(trackingCategory, 'ChangeResultsView', event.target.value);
		const {
			target: { value },
		} = event;
		const params = new URLSearchParams(window.location.hash.replace(`#/${state.cloneData.url.toLowerCase()}`, ''));
		switch (value) {
			case 'List':
				setState(dispatch, { currentViewName: 'Card', listView: true });
				params.delete('view');
				break;
			case 'Grid':
				setState(dispatch, { currentViewName: 'Card', listView: false });
				params.delete('view');
				break;
			case 'Graph':
				setState(dispatch, { currentViewName: value, runGraphSearch: true });
				params.set('view', 'graph');
				break;
			case 'Explorer':
				setState(dispatch, { currentViewName: value });
				params.set('view', value);
				break;
			default:
				setState(dispatch, { currentViewName: value });
				params.delete('view');
		}
		setDropdownValue(value);
		const linkString = `/#/${state.cloneData.url.toLowerCase()}?${params}`;
		window.history.pushState(null, document.title, linkString);
	};

	const renderAscDescButtons = (sortType) => {
		switch (sortType) {
			case 'Alphabetical':
				return (
					<div style={{ width: '40px', marginRight: '6px', display: 'flex' }}>
						<i
							className="fa fa-sort-alpha-asc"
							style={{
								marginTop: '80%',
								marginRight: '5px',
								cursor: 'pointer',
								color: currentOrder === 'asc' ? 'rgb(233, 105, 29)' : 'grey',
							}}
							aria-hidden="true"
							onClick={() => {
								handleChangeOrder('asc');
							}}
						/>
						<i
							className="fa fa-sort-alpha-desc"
							style={{
								marginTop: '80%',
								cursor: 'pointer',
								color: currentOrder === 'desc' ? 'rgb(233, 105, 29)' : 'grey',
							}}
							aria-hidden="true"
							onClick={() => {
								handleChangeOrder('desc');
							}}
						/>
					</div>
				);
			case 'Relevance':
				return (
					<div style={{ width: '40px', marginRight: '6px', display: 'flex' }}>
						<i
							className="fa fa-sort-amount-desc"
							style={{
								marginTop: '80%',
								marginRight: '5px',
								cursor: 'pointer',
								color: currentOrder === 'desc' ? 'rgb(233, 105, 29)' : 'grey',
							}}
							aria-hidden="true"
						/>
						<i
							className="fa fa-sort-amount-asc"
							style={{
								marginTop: '80%',
								cursor: 'pointer',
								color: currentOrder === 'asc' ? 'rgb(233, 105, 29)' : 'grey',
							}}
							aria-hidden="true"
							disabled
						/>
					</div>
				);
			default:
				return (
					<div style={{ width: '40px', marginRight: '6px', display: 'flex' }}>
						<i
							className="fa fa-sort-amount-desc"
							style={{
								marginTop: '80%',
								marginRight: '5px',
								cursor: 'pointer',
								color: currentOrder === 'desc' ? 'rgb(233, 105, 29)' : 'grey',
							}}
							aria-hidden="true"
							onClick={() => {
								handleChangeOrder('desc');
							}}
						/>
						<i
							className="fa fa-sort-amount-asc"
							style={{
								marginTop: '80%',
								cursor: 'pointer',
								color: currentOrder === 'asc' ? 'rgb(233, 105, 29)' : 'grey',
							}}
							aria-hidden="true"
							onClick={() => {
								handleChangeOrder('asc');
							}}
						/>
					</div>
				);
		}
	};

	return (
		<div className={'results-count-view-buttons-container'} style={{ ...extraStyle, justifyContent: 'right' }}>
			<div
				className={'view-buttons-container'}
				style={
					cloneData.clone_name !== 'gamechanger'
						? { marginRight: 35, zIndex: 99 }
						: { marginRight: 20, zIndex: 99 }
				}
			>
				{categorySorting !== undefined && categorySorting[activeCategoryTab] !== undefined && (
					<>
						<FormControl variant="outlined" classes={{ root: classes.root }}>
							<InputLabel classes={{ root: classes.formlabel }} id="view-name-select">
								Sort
							</InputLabel>
							<Select
								labelId="view-name"
								label="Sort"
								id="view-name-select"
								value={currentSort}
								onChange={handleChangeSort}
								classes={{ root: classes.selectRoot, icon: classes.selectIcon }}
								className="MuiInputBase-root"
								autoWidth
							>
								{categorySorting[activeCategoryTab].map((sort) => {
									return (
										<MenuItem
											key={`${sort}-key`}
											value={sort}
											style={{ display: 'flex', padding: '3px 6px' }}
										>
											{sort}
										</MenuItem>
									);
								})}
							</Select>
						</FormControl>
						{renderAscDescButtons(currentSort)}
					</>
				)}
				<FormControl variant="outlined" classes={{ root: classes.root }}>
					<InputLabel classes={{ root: classes.formlabel }} id="view-name-select">
						View
					</InputLabel>
					<Select
						className={`MuiInputBase-root tutorial-step-${componentStepNumbers['Change View']}`}
						labelId="view-name"
						label="View"
						id="view-name-select"
						value={dropdownValue}
						onChange={handleChangeView}
						classes={{ root: classes.selectRoot, icon: classes.selectIcon }}
						autoWidth
					>
						{viewNames.map((view) => {
							if (view.name === 'Card') {
								return [
									<MenuItem
										key={`Card-List`}
										value={'List'}
										style={{ display: 'flex', padding: '3px 6px' }}
									>
										List View
									</MenuItem>,
									<MenuItem
										key={`Card-Grid`}
										value={'Grid'}
										style={{ display: 'flex', padding: '3px 6px' }}
									>
										Grid View
									</MenuItem>,
								];
							} else {
								return (
									<MenuItem
										key={`${view.name}-key`}
										value={view.name}
										style={{ display: 'flex', padding: '3px 6px' }}
									>
										{view.title}
									</MenuItem>
								);
							}
						})}
					</Select>
				</FormControl>
				<GCButton
					className={`tutorial-step-${state.componentStepNumbers['Share Search']}`}
					id={'gcShareSearch'}
					onClick={() => createCopyTinyUrl(cloneData.url, dispatch, cloneData.clone_name)}
					style={{ height: 50, padding: '0px 7px', margin: '16px 0px 0px 10px', minWidth: 50 }}
					disabled={!state.rawSearchResults || state.rawSearchResults.length <= 0}
				>
					<GCTooltip title="Share" placement="bottom" arrow>
						<i className="fa fa-share" style={{ margin: '0 0 0 5px' }} />
					</GCTooltip>
				</GCButton>

				<SelectedDocsDrawer
					selectedDocuments={state.selectedDocuments}
					docsDrawerOpen={state.docsDrawerOpen}
					setDrawer={setDrawer}
					clearSelections={() => setState(dispatch, { selectedDocuments: new Map() })}
					openExport={() => setState(dispatch, { exportDialogVisible: true })}
					removeSelection={(doc) => removeSelectedDocument(doc)}
					componentStepNumbers={state.componentStepNumbers}
					isDrawerReady={state.isDrawerReady}
					setDrawerReady={setDrawerReady}
					setShowTutorial={(showTutorial) => setState(dispatch, { showTutorial: showTutorial })}
					setStepIndex={setStepIndex}
					showTutorial={state.showTutorial}
					rawSearchResults={state.rawSearchResults}
				/>
			</div>
		</div>
	);
};

PolicyViewHeaderHandler.propTypes = {
	activeCategoryTab: PropTypes.string,
	cloneData: PropTypes.shape({
		url: PropTypes.string,
	}),
	componentStepNumbers: PropTypes.objectOf(PropTypes.number),
	count: PropTypes.number,
	currentViewName: PropTypes.string,
	entityCount: PropTypes.number,
	listView: PropTypes.bool,
	selectedCategories: PropTypes.objectOf(PropTypes.bool),
	topicCount: PropTypes.number,
	timeFound: PropTypes.number,
	viewNames: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string,
			title: PropTypes.string,
		})
	),
	categorySorting: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
	currentSort: PropTypes.string,
	currentOrder: PropTypes.string,
};

export default PolicyViewHeaderHandler;
