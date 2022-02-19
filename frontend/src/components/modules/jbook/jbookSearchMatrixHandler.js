import React from 'react';
import GCAccordion from '../../common/GCAccordion';
import GCButton from '../../common/GCButton';
import _ from 'lodash';
import {
	FormControl,
	FormGroup,
	FormControlLabel,
	Checkbox,
} from '@material-ui/core';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import { setState } from '../../../utils/sharedFunctions';

import { trackEvent } from '../../telemetry/Matomo';
import { getTrackingNameForFactory } from '../../../utils/gamechangerUtils';

const handleSelectSpecific = (state, dispatch, type) => {
	const newSearchSettings = _.cloneDeep(state.jbookSearchSettings);
	newSearchSettings[`${type}SpecificSelected`] = true;
	newSearchSettings[`${type}AllSelected`] = false;
	setState(dispatch, {
		jbookSearchSettings: newSearchSettings,
		metricsCounted: false,
	});
};

const handleSelectAll = (state, dispatch, type) => {

	const specific = `${type}SpecificSelected`;
	const all = `${type}AllSelected`;
	const filter = `${type}Filter`;
	const update = `${type}Update`;

	if (state.jbookSearchSettings[specific]) {
		const newSearchSettings = _.cloneDeep(state.jbookSearchSettings);
		newSearchSettings[specific] = false;
		newSearchSettings[all] = true;
		let runSearch = false;
		let runGraphSearch = false;
		Object.keys(state.jbookSearchSettings[filter]).forEach((option) => {
			if (newSearchSettings[filter][option]) {
				newSearchSettings.isFilterUpdate = true;
				newSearchSettings[update] = true;
				runSearch = true;
				runGraphSearch = true;
			}
			newSearchSettings[filter][option] = false;
		});
		setState(dispatch, {
			jbookSearchSettings: newSearchSettings,
			metricsCounted: false,
			runSearch,
			runGraphSearch,
		});
	}
};

const handleFilterChange = (event, state, dispatch, type) => {
	const newSearchSettings = _.cloneDeep(state.jbookSearchSettings);
	let optionName = event.target.name;

	console.log(optionName);
	console.log(event.target.value);

	const index = newSearchSettings[type].indexOf(optionName);

	if (index !== -1) {
		newSearchSettings[type].splice(index, 1);
	}
	else {
		newSearchSettings[type].push(optionName);
	}

	newSearchSettings.isFilterUpdate = true;
	newSearchSettings[`${type}Update`] = true;
	setState(dispatch, {
		jbookSearchSettings: newSearchSettings,
		metricsCounted: false,
		runSearch: true,
		runGraphSearch: true,
	});
	trackEvent(
		getTrackingNameForFactory(state.cloneData.clone_name),
		`${type}FilterToggle`,
		event.target.name,
		event.target.value ? 1 : 0
	);
};

const renderFilterCheckboxes = (state, dispatch, classes, type, displayName) => {

	const endsInY = displayName[displayName.length - 1] === 'y';

	const allSelected = `${type}AllSelected`;
	const allText = `All ${endsInY ? displayName.slice(0, displayName.length - 1) : displayName}${endsInY ? 'ies' : 's'}`;
	const specificText = `Specific ${endsInY ? displayName.slice(0, displayName.length - 1) : displayName}${endsInY ? 'ies' : 's'}`;
	const specificSelected = `${type}SpecificSelected`;
	const options = state.defaultOptions[type];

	return (
	<FormControl
			style={{ padding: '10px', paddingTop: '10px', paddingBottom: '10px' }}
		>
			{
				<>
					<FormGroup row style={{ marginBottom: '10px' }}>
						<FormControlLabel
							name={allText}
							value={allText}
							classes={{ label: classes.titleText }}
							control={
								<Checkbox
									classes={{ root: classes.filterBox }}
									onClick={() => handleSelectAll(state, dispatch, type)}
									icon={
										<CheckBoxOutlineBlankIcon
											style={{ visibility: 'hidden' }}
										/>
									}
									checked={state.jbookSearchSettings[allSelected]}
									checkedIcon={
										<i style={{ color: '#E9691D' }} className="fa fa-check" />
									}
									name={allText}
									style={styles.filterBox}
								/>
							}
							label={allText}
							labelPlacement="end"
							style={styles.titleText}
						/>
					</FormGroup>
					<FormGroup row>
						<FormControlLabel
							name={specificText}
							value={specificText}
							classes={{ label: classes.titleText }}
							control={
								<Checkbox
									classes={{ root: classes.filterBox }}
									onClick={() => handleSelectSpecific(state, dispatch, type)}
									icon={
										<CheckBoxOutlineBlankIcon
											style={{ visibility: 'hidden' }}
										/>
									}
									checked={state.jbookSearchSettings[specificSelected]}
									checkedIcon={
										<i style={{ color: '#E9691D' }} className="fa fa-check" />
									}
									name={specificText}
									style={styles.filterBox}
								/>
							}
							label={specificText}
							labelPlacement="end"
							style={styles.titleText}
						/>
					</FormGroup>
					<FormGroup row style={{ marginLeft: '10px', width: '100%' }}>
						{state.jbookSearchSettings[specificSelected] &&
							options.map((option) => {
								return (
									<FormControlLabel
										key={`${option}`}
										value={`${option}`}
										classes={{
											root: classes.rootLabel,
											label: classes.checkboxPill,
										}}
										control={
											<Checkbox
												classes={{
													root: classes.rootButton,
													checked: classes.checkedButton,
												}}
												name={`${option}`}
												checked={state.jbookSearchSettings[type].indexOf(option) !== -1}
												onClick={(event) =>
													handleFilterChange(event, state, dispatch, type)
												}
											/>
										}
										label={`${option}`}
										labelPlacement="end"
									/>
								);
							})}
					</FormGroup>
				</>
			}
		</FormControl>
	);
};

const renderFilterInput = (state, dispatch, type) => {

	return (
		// <TextField
		// 	placeholder=""
		// 	variant="outlined"
		// 	value={state.jbookSearchSettings[type]}
		// 	style={{ backgroundColor: 'white', width: '100%' }}
		// 	// onBlur={(event) => setReviewData('domainTaskOther', event.target.value)}
		// 	onChange={(event, value) => setDomainTaskOther(value)}
		// 	disabled={finished} //|| roleDisabled}
		// />
		''
	);
}

const resetAdvancedSettings = (dispatch) => {
	dispatch({ type: 'RESET_SEARCH_SETTINGS' });
};

const PolicySearchMatrixHandler = {
	getSearchMatrixItems(props) {
		
		const {
			state,
			dispatch,
			classes,
		} = props;


		return (
			<>
				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.budgetTypeSpecificSelected}
						header={'BUDGET TYPE'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterCheckboxes(state, dispatch, classes, 'budgetType', 'budget type')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.budgetYearSpecificSelected}
						header={'BUDGET YEAR (FY)'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterCheckboxes(state, dispatch, classes, 'budgetYear', 'budget year')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.programElement && state.jbookSearchSettings.programElement !== ''}
						header={'PROGRAM ELEMENT / BLI'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterInput(state, dispatch, 'programElement')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.projectNum && state.jbookSearchSettings.projectNum !== ''}
						header={'PROJECT #'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterInput(state, dispatch, 'projectNum')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.projectTitle && state.jbookSearchSettings.projectTitle !== ''}
						header={'PROJECT TITLE'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterInput(state, dispatch, 'projectTitle')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.serviceAgencySpecificSelected}
						header={'SERVICE / AGENCY'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterCheckboxes(state, dispatch, classes, 'serviceAgency', 'service agency')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.primaryReviewerSpecificSelected}
						header={'PRIMARY REVIEWER'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterCheckboxes(state, dispatch, classes, 'primaryReviewer', 'primary reviewer')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.serviceReviewerSpecificSelected}
						header={'SERVICE REVIEWER'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterCheckboxes(state, dispatch, classes, 'serviceReviewer', 'service reviewer')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.pocReviewer && state.jbookSearchSettings.pocReviewer !== ''}
						header={'POC REVIEWER'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterInput(state, dispatch, 'pocReviewer')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.reviewStatusSpecificSelected }
						header={'REVIEW STATUS'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterCheckboxes(state, dispatch, classes, 'reviewStatus', 'review status')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.hasKeywordsSpecificSelected}
						header={'HAS KEYWORDS'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterCheckboxes(state, dispatch, classes, 'hasKeywords', 'has keyword')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.primaryClassLabelSpecificSelected}
						header={'LABELS'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterCheckboxes(state, dispatch, classes, 'primaryClassLabel', 'primary class label')}
					</GCAccordion>
				</div>

				<div style={{ width: '100%', marginBottom: 10 }}>
					<GCAccordion
						expanded={state.jbookSearchSettings.sourceSpecificSelected}
						header={'SOURCE'}
						headerBackground={'rgb(238,241,242)'}
						headerTextColor={'black'}
						headerTextWeight={'normal'}
					>
						{renderFilterCheckboxes(state, dispatch, classes, 'sourceTag', 'source tag')}
					</GCAccordion>
				</div>

				<button
					type="button"
					style={{
						border: 'none',
						backgroundColor: '#B0BAC5',
						padding: '0 15px',
						display: 'flex',
						height: 50,
						alignItems: 'center',
						borderRadius: 5,
					}}
					onClick={() => {
						resetAdvancedSettings(dispatch);
						setState(dispatch, { runSearch: true, runGraphSearch: true });
					}}
				>
					<span
						style={{
							fontFamily: 'Montserrat',
							fontWeight: 600,
							width: '100%',
							marginTop: '5px',
							marginBottom: '10px',
							marginLeft: '-1px',
						}}
					>
						Clear Filters
					</span>
				</button>
			</>
		);
	},

	getAdvancedOptions(props) {
		const {

		} = props;

		return (
			<>
			
			</>
		);
	},
};

const styles = {
	innerContainer: {
		display: 'flex',
		height: '100%',
		flexDirection: 'column',
	},
	cardBody: {
		padding: '10px 0px',
		fontSize: '1.1em',
		fontFamily: 'Noto Sans',
	},
	subHead: {
		fontSize: '1.0em',
		display: 'flex',
		position: 'relative',
	},
	headerColumn: {
		fontSize: '1.0em',
		width: '100%',
		padding: '8px 8px',
		backgroundColor: 'rgb(50,53,64)',
		display: 'flex',
		alignItems: 'center',
	},
	filterDiv: {
		display: 'block',
		margin: '10px',
	},
	boldText: {
		fontSize: '0.8em',
	},
};

export default PolicySearchMatrixHandler;
