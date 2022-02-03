import React, {useCallback, useEffect, useState} from 'react';
import propTypes from 'prop-types';
import styled from 'styled-components';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { Grid } from '@material-ui/core';
import GCAnalystToolsSideBar from './GCAnalystToolsSideBar';
import GameChangerAPI from '../api/gameChanger-service-api';
import {setState} from '../../utils/sharedFunctions';
import LoadingIndicator from '@dod-advana/advana-platform-ui/dist/loading/LoadingIndicator';
import {gcOrange} from '../common/gc-colors';
import {
	encode, 
	handlePdfOnLoad,
	getOrgToOrgQuery,
	getTypeQuery
} from '../../utils/gamechangerUtils';
import GCTooltip from '../common/GCToolTip';
import GCButton from '../common/GCButton';

const _ = require('lodash');

const gameChangerAPI = new GameChangerAPI();

const DocumentInputContainer = styled.div`
	border: 5px ${'#FFFFFF'};
	border-radius: 5px;
	background-color: ${'#F6F8FA'};
	padding: 20px;
	margin: 20px 0px 0px 20px;
	
	
	
	.input-container-grid {
		margin-top: 30px;
		margin-left: 80px;
	}
	
	.input-drop-zone {
		border: 2px solid ${'#B6C6D8'} !important;
		border-radius: 6px;
		background-color: ${'#ffffff'};		
	}
	
	.instruction-box {
		font-size: 1.1em;
		font-style: initial;
		font-family: Noto Sans;
		font-color: ${'#2f3f4a'};
		margin-bottom: 10px;
	}
	
	.or-use-text {
	    height: 100%;
	    text-align: center;
	    display: table;
	    width: 100%;
	    
	    > span {
	        display: table-cell;
            vertical-align: middle;
	    }
	}
	
	.input-box {
		font-size: 14px;
		overflow: scroll;
		font-family: Noto Sans;
	}

	fieldset {
		height: auto !important;
	}
	
	.document-imported-block {
		display: flex;
	
		 & .document-text {
			border: 2px solid ${'#B6C6D8'} !important;
			border-radius: 6px;
			background-color: ${'rgb(239, 242, 246)'};
			margin: 30px 0px 30px 30px;
			width: 100%;
			overflow: scroll;
			height: 250px;
			
			& .text {
				padding: 5px
			}
		}
		
		& .remove-document {
			padding-top: 16px
		}
	}
	
`;

const getPresearchData = async (state, dispatch) => {
	const { cloneData } = state;
	if (_.isEmpty(state.presearchSources)) {
		const resp = await gameChangerAPI.callSearchFunction({
			functionName: 'getPresearchData',
			cloneName: cloneData.clone_name,
			options: {},
		});

		const orgFilters = {};
		for (const key in resp.data.orgs) {
			orgFilters[resp.data.orgs[[key]]] = false;
		}
		const typeFilters = {};
		for (const key in resp.data.types) {
			let name = resp.data.types[key];
			if (name.slice(-1) !== 's') {
				name = name + 's';
			}
			typeFilters[name] = false;
		}
		const newSearchSettings = _.cloneDeep(state.analystToolsSearchSettings);
		newSearchSettings.orgFilter = orgFilters;
		newSearchSettings.typeFilter = typeFilters;
		if (_.isEmpty(state.presearchSources)) {
			setState(dispatch, { presearchSources: orgFilters });
		}
		if (_.isEmpty(state.presearchTypes)) {
			setState(dispatch, { presearchTypes: typeFilters });
		}
		setState(dispatch, { analystToolsSearchSettings: newSearchSettings });
	} else {
		const newSearchSettings = _.cloneDeep(state.searchSettings);
		newSearchSettings.orgFilter = state.presearchSources;
		newSearchSettings.typeFilter = state.presearchTypes;
		setState(dispatch, { analystToolsSearchSettings: newSearchSettings });
	}
}

const resetAdvancedSettings = (dispatch) => {
	dispatch({type: 'RESET_ANALYST_TOOLS_SEARCH_SETTINGS'});
}

const GCDocumentsComparisonTool = (props) => {
	
	const classes = useStyles();
	
	const { context } = props;
	const {state, dispatch} = context;
	const { analystToolsSearchSettings } = state;
	const { 
		allOrgsSelected,
		orgFilter,
		allTypesSelected,
		typeFilter,
		publicationDateFilter,
		includeRevoked
	} = analystToolsSearchSettings;
	
	const [paragraphText, setParagraphText] = useState('');
	const [paragraphs, setParagraphs] = useState([]);
	const [returnedDocs, setReturnedDocs] = useState([]);
	const [viewableDocs, setViewableDocs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [compareDocument, setCompareDocument] = useState(undefined);
	const [compareParagraphIndex, setCompareParagraphIndex] = useState(0);
	const [filtersLoaded, setFiltersLoaded] = useState(false);
	const [noResults, setNoResults] = useState(false);
	const [filterChange, setFilterChange] = useState(false);
	const [highlightList, setHighlightList] = useState([]);
	const [highlightIndex, setHighlightindex] = useState(0);
	
	useEffect(() => {
		if(!filtersLoaded){
			getPresearchData(state, dispatch);
			setFiltersLoaded(true);
		}
	}, [state, dispatch, filtersLoaded])

	useEffect(() => {
		setFilterChange(true);
	}, [orgFilter, typeFilter, publicationDateFilter, includeRevoked])

	useEffect(() => {
		setNoResults(false)
	}, [paragraphText])

	useEffect(() => {
		if (state.runDocumentComparisonSearch) {
			setLoading(true);
			
			const paragraphs = paragraphText.split('\n').map(paragraph => {
				return paragraph.trim();
			}).filter(paragraph => paragraph.length > 0);
			
			setParagraphs(paragraphs);

			const filters = {
				orgFilters: getOrgToOrgQuery(allOrgsSelected, orgFilter),
				typeFilters: getTypeQuery(allTypesSelected, typeFilter),
				dateFilter: publicationDateFilter,
				canceledDocs: includeRevoked
			}
			
			gameChangerAPI.compareDocumentPOST({cloneName: state.cloneData.cloneName, paragraphs: paragraphs, filters}).then(resp => {
				if(resp.data.docs.length <= 0) setNoResults(true);
				setReturnedDocs(resp.data.docs);
				setState(dispatch, {runDocumentComparisonSearch: false});
				setLoading(false);
			}).catch(() =>{
				setReturnedDocs([]);
				setState(dispatch, {runDocumentComparisonSearch: false});
				setLoading(false);
				console.log('server error')
			});
		}
		
	}, [state.runDocumentComparisonSearch, paragraphText, state.cloneData.cloneName, dispatch, allOrgsSelected, orgFilter, allTypesSelected, typeFilter, publicationDateFilter, includeRevoked]);
	
	useEffect(() => {
		setViewableDocs(returnedDocs)
	}, [returnedDocs]);
	
	useEffect(() => {
		if (state.compareModalOpen) {
			const doc = returnedDocs.filter(document => {
				return document.filename === state.compareFilename;
			})[0];
			
			let tmpCompareIdx;
			doc.paragraphs.forEach(par => {
				if (tmpCompareIdx === undefined) {
					tmpCompareIdx = par.paragraphIdBeingMatched;
				}
			});
			
			setCompareParagraphIndex(tmpCompareIdx);
			const highlights = doc.paragraphs.filter(p => p.paragraphIdBeingMatched === tmpCompareIdx);
			setHighlightList(highlights);
			setCompareDocument(doc);
		}
	}, [returnedDocs, state.compareModalOpen, state.compareFilename]);

	useEffect(() => {
		if(state.ignoredDocs.length){
			const { item, index } = state.ignoredDocs[0];
			const searchedParagraph = paragraphs[item.paragraphs[index].paragraphIdBeingMatched]
			const matchedParagraphId = item.paragraphs[index].id;

			gameChangerAPI.compareFeedbackPOST({
				searchedParagraph,
				matchedParagraphId,
				docId: item.id,
				positiveFeedback: false
			});
			setState( dispatch, {ignoredDocs: []})

			const newViewableDocs = viewableDocs;
			const docIndex = viewableDocs.findIndex((doc) => item.filename === doc.filename);
			newViewableDocs[docIndex].paragraphs.splice(index, 1);
			if(!newViewableDocs[docIndex].paragraphs.length) newViewableDocs.splice(docIndex, 1);
			setViewableDocs(newViewableDocs);
		}
	}, [state.ignoredDocs, viewableDocs, dispatch, paragraphs])
	
	const measuredRef = useCallback(
		(node) => {
			if (node !== null && compareDocument) {
				
				const matchingPars = compareDocument.paragraphs.filter(par => {
					return par.paragraphIdBeingMatched === compareParagraphIndex;
				});

				if (compareDocument && matchingPars.length > 0) {
					gameChangerAPI
						.dataStorageDownloadGET(
							encode(compareDocument.filename || ''),
							`"${highlightList[highlightIndex].par_raw_text_t}"`,
							matchingPars[0].page_num_i + 1,
							true,
							state.cloneData
						)
						.then((url) => {
							node.src = url;
						});
				}
			}
		},
		[compareDocument, state.cloneData, compareParagraphIndex, highlightList, highlightIndex]
	);
	
	const getMatchingParsCount = (compareIdx) => {
		return compareDocument.paragraphs.filter(par => {
			return par.paragraphIdBeingMatched === compareIdx;
		}).length;
	}
	
	const handleSetCompareIndex = (idx) => {
		const parCount = getMatchingParsCount(idx);
		if (parCount > 0){
			setCompareParagraphIndex(idx);
			const highlights = compareDocument.paragraphs.filter(p => p.paragraphIdBeingMatched === idx);
			setHighlightList(highlights);
			setHighlightindex(highlightIndex >= parCount -1 ? 0 : highlightIndex + 1);
		}
	}
	
	const reset = () => {
		setParagraphText('');
		setReturnedDocs([]);
		setViewableDocs([]);
	}
	
	return (
		<>
			<Grid container style={{marginTop: 20}}>
				<Grid item xs={12}>
					<div style={{fontWeight:'bold', alignItems: 'center', fontFamily: 'Noto Sans',}}>
					The Document Comparison Tool enables you to input text and locate policies in the GAMECHANGER policy repository with semantically similar language. Using the Document Comparison Tool below, you can conduct deeper policy analysis and understand how one piece of policy compares to the GAMECHANGER policy repository.
					</div>
				</Grid>
				<Grid item xs={3} style={{marginTop: 20}}>
					<GCAnalystToolsSideBar context={context} />
					<GCButton 
						isSecondaryBtn 
						onClick={() => resetAdvancedSettings(dispatch)}
						style={{margin: 0, width: '100%'}}
					>
						Clear filters
					</GCButton>
					{!loading && returnedDocs.length > 0 && <GCButton 
						onClick={() => { 
							setNoResults(false);
							setState(dispatch, { runDocumentComparisonSearch: true });
						}}
						style={{margin: '10px 0 0 0', width: '100%'}}
						disabled={!filterChange}
					>
						Apply filters
					</GCButton>}
				</Grid>
				<Grid item xs={9}>
					<DocumentInputContainer>
						<Grid container className={'input-container-grid'} style={{margin: 0}}>
							<Grid item xs={12}>
								<Grid container style={{display: 'flex', flexDirection: 'column'}}>
									<Grid item xs={12}>
										<div className={'instruction-box'}>
											To search for similar documents, paste text into the box below.
										</div>
									</Grid>
									
									<Grid container style={{display: 'flex'}}>
										<Grid item xs={12}>
											<div className={'input-box'}>
												<TextField
													id="input-box"
													disabled={returnedDocs.length > 0}
													multiline
													rows={1000}
													variant="outlined"
													className={classes.inputBoxRoot}
													value={paragraphText}
													onChange={(event) => {
														setParagraphText(event.target.value);
													}}
													onClick={() => setState(dispatch, {inputActive: 'compareInput'})}
													InputProps={{
														classes: {
															root: classes.outlinedInput,
															focused: classes.focused,
															notchedOutline: classes.notchedOutline,
														},
													}}
													placeholder={'Text Content Here'}
													fullWidth={true}
												/>
											</div>
										</Grid>
									</Grid>
								</Grid>
							</Grid>
						</Grid>
						<Grid container style={{justifyContent:'flex-end'}}>
							<GCTooltip 
								title={returnedDocs.length > 0 ? 'Click to start over' : 'Compare Documents'} 
								placement="top" arrow
							>
								<GCButton
									style={{ marginTop: 20 }}
									onClick={() => {
										setNoResults(false);
										setFilterChange(false);
										if(!loading && returnedDocs.length > 0) return reset();
										setState(dispatch, { runDocumentComparisonSearch: true });
									}}
								>
									{!loading && returnedDocs.length > 0 ? 'Reset' : 'Submit'}
								</GCButton>
							</GCTooltip>
						</Grid>
					</DocumentInputContainer>
					{loading &&
					<div style={{display:'flex', justifyContent:'center', flexDirection:'column'}}>
						<LoadingIndicator customColor={gcOrange}/>
					</div>
					}
					{noResults && !loading && 
                        <div className={'displaying-results-text'}>
                        	<div className={'text'}>
                                No results found
                        	</div>
                        </div>
					}
					{(!loading && returnedDocs.length > 0) &&
					<>
					</>
					}
				</Grid>
			</Grid>
		</>
		
	)
};

GCDocumentsComparisonTool.propTypes = {
	context: propTypes.objectOf( {})
};

const useStyles = makeStyles((theme) => ({
	inputBoxRoot: {
		backgroundColor: '#FFFFFF'
	},
	outlinedInput: {
		color: '#0000008A',
		fontFamily: 'Montserrat',
		fontSize: 14,
		height: 247,
		padding: '10px 0px 10px 10px',
		'&focused $notchedOutline': {
			border: `2px solid ${'#B6C6D8'} !important`,
			borderRadius: 6
		},
		'& textarea': {
			height: '100%'
		}
	},
	focused: {},
	notchedOutline: {
		border: `2px solid ${'#B6C6D8'} !important`,
		borderRadius: 6,
		height: '100%'
	},
	dialogXl: {
		maxWidth: '1920px',
		minWidth: '1500px',
		backgroundColor: '#EFF1F6',
		height: 850
	},
}));

export default GCDocumentsComparisonTool;