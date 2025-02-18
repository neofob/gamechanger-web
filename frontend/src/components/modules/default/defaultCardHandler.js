import React, { useEffect } from 'react';
import GCTooltip from '../../common/GCToolTip';
import { KeyboardArrowRight } from '@material-ui/icons';
import styled from 'styled-components';
import {
	capitalizeFirst,
	CARD_FONT_SIZE,
	getDocTypeStyles,
	getTrackingNameForFactory,
	getTypeDisplay,
	getTypeIcon,
	getTypeTextColor,
	orgAlias,
	getMetadataForPropertyTable,
	encode,
} from '../../../utils/gamechangerUtils';
import LoadingIndicator from '@dod-advana/advana-platform-ui/dist/loading/LoadingIndicator';
import SimpleTable from '../../common/SimpleTable';
import { CardButton } from '../../common/CardButton';
import { trackEvent, trackFlipCardEvent } from '../../telemetry/Matomo';
import _ from 'lodash';
import Permissions from '@dod-advana/advana-platform-ui/dist/utilities/permissions';
import sanitizeHtml from 'sanitize-html';
import { setState } from '../../../utils/sharedFunctions';
import { Divider } from '@material-ui/core';
import { CustomDimensions } from '../../telemetry/utils';

export const colWidth = {
	maxWidth: '900px',
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
};

export const styles = {
	container: {
		marginBottom: 15,
	},
	footerButtonBack: {
		margin: '0 10px 0 0 ',
		padding: '8px',
	},
	button: {
		height: 50,
		width: 120,
		margin: 'auto 0px auto auto',
	},
	link: {
		fontSize: 16,
		fontFamily: 'Montserrat',
		color: '#386F94',
		letter: '-0.4px',
		fontWeight: '600',
		margin: 'auto 0px',
	},
	linkIcon: {
		fontSize: 19,
		verticalAlign: 'middle',
	},
	viewMoreChevron: {
		fontSize: 14,
		color: '#1E88E5',
		fontWeight: 'normal',
		marginLeft: 5,
	},
	viewMoreButton: {
		fontSize: 16,
		color: '#1E88E5',
		fontWeight: 'bold',
		cursor: 'pointer',
		minWidth: 60,
	},
	collectionContainer: {
		margin: '1em',
		overflow: 'auto',
	},
	bodyImg: {
		width: 75,
		margin: '10px',
	},
	bodyText: {
		margin: '10px',
		fontSize: '14px',
	},
	row: {
		display: 'flex',
		justifyContent: 'space-between',
		flexWrap: 'wrap',
	},
	bodyContainer: {
		display: 'flex',
		height: '100%',
		flex: 1,
		flexDirection: 'column',
		backgroundColor: 'rgb(238, 241, 242)',
		padding: '10px 0',
	},

	title: (restricted) => ({
		backgroundColor: restricted ? '#F1F5F9' : 'rgba(223,230,238,0.5)',
		border: '1px solid #9BB1C8',
		borderRadius: '5px 5px 0 0',
		borderBottom: 0,
		height: 70,
		padding: 15,
	}),
	body: (restricted) => ({
		border: '1px solid #9BB1C8',
		padding: 15,
		height: 330,
		backgroundColor: restricted ? '#B6C6D8' : 'white',
		textAlign: 'left',
	}),
	footer: (restricted) => ({
		border: '1px solid #9BB1C8',
		borderTop: 0,
		padding: 8,
		borderRadius: '0 0 12px 12px ',
		height: 80,
		display: 'flex',
		backgroundColor: restricted ? '#B6C6D8' : 'white',
		justifyContent: 'flex-end',
	}),
};

export const StyledListViewFrontCardContent = styled.div`
	.list-view-button {
		width: 100%;
		height: fit-content;
		margin-top: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;

		i {
			font-size: ${CARD_FONT_SIZE}px;
			color: rgb(0, 131, 143);
			font-weight: normal;
			margin-left: 5px;
			margin-right: 20px;
		}
	}

	.expanded-hits {
		display: flex;
		height: 100%;

		.page-hits {
			min-width: 100px;
			height: 100%;
			border: 1px solid rgb(189, 189, 189);
			border-top: 0px;

			.page-hit {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding-right: 5px;
				padding-left: 5px;
				border-top: 1px solid rgb(189, 189, 189);
				cursor: pointer;
				color: #386f94;

				span {
					font-size: ${CARD_FONT_SIZE}px;
				}

				i {
					font-size: ${CARD_FONT_SIZE}px;
					margin-left: 10px;
				}
			}
		}

		> .expanded-metadata {
			border: 1px solid rgb(189, 189, 189);
			border-left: 0px;
			min-height: 126px;
			width: 100%;

			> blockquote {
				font-size: ${CARD_FONT_SIZE}px;
				line-height: 20px;

				background: ${({ expandedDataBackground }) =>
					expandedDataBackground ? expandedDataBackground : '#dde1e0'};
				margin-bottom: 0;
				height: 165px;
				border-left: 0;
				overflow: hidden;
				font-family: Noto Sans, Arial, Helvetica, sans-serif;
				padding: 0.5em 10px;
				margin-left: 0;
				quotes: '\\201C''\\201D''\\2018''\\2019';

				> em {
					color: white;
					background-color: #e9691d;
					margin-right: 5px;
					padding: 4px;
					font-style: normal;
				}
			}
		}
	}

	.metadata {
		display: flex;
		height: 100%;
		flex-direction: column;
		border-radius: 5px;
		overflow: auto;

		.inner-scroll-container {
			background-color: rgb(238, 241, 242);
			display: block;
			overflow: auto;
			height: 100%;
		}
	}
`;

export const StyledFrontCardHeader = styled.div`
	font-size: 1.2em;
	display: inline-block;
	color: black;
	margin-bottom: 0px;
	background-color: ${({ intelligentSearch }) => (intelligentSearch ? '#9BB1C8' : 'white')};
	font-weight: bold;
	font-family: Montserrat;
	height: ${({ listView }) => (listView ? 'fit-content' : '59px')};
	padding: ${({ listView }) => (listView ? '0px' : '5px')};
	margin-left: ${({ listView }) => (listView ? '10px' : '0px')};
	margin-right: ${({ listView }) => (listView ? '10px' : '0px')};

	.title-text-selected-favorite-div {
		max-height: ${({ listView }) => (listView ? '' : '50px')};
		height: ${({ listView }) => (listView ? '35px' : '')};
		overflow: hidden;
		display: flex;
		justify-content: space-between;

		.title-text {
			cursor: pointer;
			display: ${({ docListView }) => (docListView ? 'flex' : '')};
			alignitems: ${({ docListView }) => (docListView ? 'top' : '')};
			height: ${({ docListView }) => (docListView ? 'fit-content' : '')};
			overflow-wrap: ${({ listView }) => (listView ? '' : 'anywhere')};

			.text {
				margin-top: ${({ listView }) => (listView ? '10px' : '0px')};
				-webkit-line-clamp: 2;
				display: -webkit-box;
				-webkit-box-orient: vertical;
			}

			.list-view-arrow {
				display: inline-block;
				margin-top: 7px;
			}
		}

		.selected-favorite {
			display: inline-block;
			font-family: 'Noto Sans';
			font-weight: 400;
			font-size: ${CARD_FONT_SIZE}px;
			margin-top: ${({ listView }) => (listView ? '2px' : '0px')};
		}
	}

	.list-view-sub-header {
		font-size: 0.8em;
		display: flex;
		color: black;
		margin-bottom: 0px;
		margin-top: 0px;
		background-color: ${({ intelligentSearch }) => (intelligentSearch ? '#9BB1C8' : 'white')};
		font-family: Montserrat;
		height: 24px;
		justify-content: space-between;
	}
`;

export const StyledEntityFrontCardContent = styled.div`
	display: flex;
	height: 100%;
	flex-direction: column;
	align-items: center;
	background-color: ${({ listView }) => (listView ? 'transparent' : 'rgb(238, 241, 242)')};

	> img {
		width: 75px;
		margin: 10px;
	}

	> p {
		margin: 10px;
		font-size: 14px;
	}

	> div {
		margin-top: -90px;
	}
`;

export const StyledFrontCardSubHeader = styled.div`
	display: flex;
	position: relative;

	.sub-header-one {
		color: ${({ typeTextColor }) => (typeTextColor ? typeTextColor : '#ffffff')};
		background-color: ${({ docTypeColor }) => (docTypeColor ? docTypeColor : '#000000')};
		width: 50%;
		padding: 8px;
		display: flex;
		align-items: center;

		img {
			width: 25px;
			margin: 0px 10px 0px 0px;
		}
	}

	.sub-header-two {
		width: 50%;
		color: white;
		padding: 10px 8px 8px;
		background-color: ${({ docOrgColor }) => (docOrgColor ? docOrgColor : '#000000')};
	}

	.sub-header-full {
		color: ${({ typeTextColor }) => (typeTextColor ? typeTextColor : '#ffffff')};
		background-color: ${({ docTypeColor }) => (docTypeColor ? docTypeColor : '#000000')};
		padding: 8px;
		display: flex;
		align-items: center;
		width: 100%;
		img {
			width: 25px;
			margin: 0px 10px 0px 0px;
		}
	}
`;

export const StyledFrontCardContent = styled.div`
	font-family: 'Noto Sans';
	overflow: auto;
	font-size: ${CARD_FONT_SIZE}px;

	.current-as-of-div {
		display: flex;
		justify-content: space-between;

		.current-text {
			margin: 10px 0;
		}
	}

	.hits-container {
		display: flex;
		height: 100%;

		.page-hits {
			min-width: 100px;
			height: 100%;
			border: 1px solid rgb(189, 189, 189);
			border-top: 0px;

			.page-hit {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding-right: 5px;
				padding-left: 5px;
				border-top: 1px solid rgb(189, 189, 189);
				cursor: pointer;
				color: #386f94;

				span {
					font-size: ${CARD_FONT_SIZE}px;
				}

				i {
					font-size: ${CARD_FONT_SIZE}px;
					margin-left: 10px;
				}
			}

			> .expanded-metadata {
				border: 1px solid rgb(189, 189, 189);
				border-left: 0px;
				min-height: 126px;
				width: 100%;
				max-width: ${({ isWideCard }) => (isWideCard ? '' : '280px')};

				> blockquote {
					font-size: ${CARD_FONT_SIZE}px;
					line-height: 20px;

					background: #dde1e0;
					margin-bottom: 0;
					height: 165px;
					border-left: 0;
					overflow: hidden;
					font-family: Noto Sans, Arial, Helvetica, sans-serif;
					padding: 0.5em 10px;
					margin-left: 0;
					quotes: '\\201C''\\201D''\\2018''\\2019';

					> em {
						color: white;
						background-color: #e9691d;
						margin-right: 5px;
						padding: 4px;
						font-style: normal;
					}
				}
			}
		}
	}
`;

export const RevokedTag = styled.div`
	font-size: 11px;
	font-weight: 600;
	border: none;
	height: 25px;
	border-radius: 15px;
	background-color: #e50000;
	color: white;
	white-space: nowrap;
	text-align: center;
	display: inline-block;
	padding-left: 15px;
	padding-right: 15px;
	margin-top: 10px;
	margin-bottom: 10px;
`;

const getCardHeaderHandler = ({ item, state, graphView, intelligentSearch }) => {
	const displayTitle = getDisplayTitle(item);
	// const isRevoked = item.is_revoked_b;

	const docListView = state.listView && !graphView;

	const displayOrg = item['display_org_s'] ? item['display_org_s'] : 'Uncategorized';
	const displayType = item['display_doc_type_s'] ? item['display_doc_type_s'] : 'Document';

	return (
		<StyledFrontCardHeader
			listView={state.listView}
			docListView={docListView}
			intelligentSearch={intelligentSearch}
		>
			<div className={'title-text-selected-favorite-div'}>
				<GCTooltip title={displayTitle} placement="top" arrow>
					<div
						className={'title-text'}
						onClick={
							docListView
								? () =>
										clickFn(
											item.filename,
											state.cloneData.clone_name,
											state.searchText,
											null,
											null,
											0
										)
								: () => {}
						}
					>
						<div className={'text'}>{displayTitle}</div>
						{docListView && (
							<div className={'list-view-arrow'}>
								<KeyboardArrowRight style={{ color: 'rgb(56, 111, 148)', fontSize: 32 }} />
							</div>
						)}
					</div>
				</GCTooltip>
				{/* // export and favoriting not currently working for default
					<div className={'selected-favorite'}>
					<div style={{display: "flex"}}>
						{checkboxComponent(item.filename, item.display_title_s ?? item.title, idx)}
						{favoriteComponent()}
					</div>
				</div> */}
			</div>
			{docListView && (
				<div className={'list-view-sub-header'}>
					<p>
						{' '}
						{displayType} | {displayOrg}{' '}
					</p>
				</div>
			)}
		</StyledFrontCardHeader>
	);
};

const getCardSubHeaderHandler = ({ item, state, toggledMore }) => {
	const cardType = item.type;
	const iconSrc = getTypeIcon(cardType);
	const typeTextColor = getTypeTextColor(cardType);

	const displayOrg = item['display_org_s'] ? item['display_org_s'] : 'Uncategorized';
	const displayType = item['display_doc_type_s'] ? item['display_doc_type_s'] : 'Document';

	let { docTypeColor, docOrgColor } = getDocTypeStyles(displayType, displayOrg);

	return (
		<>
			{!state.listView && !toggledMore && (
				<StyledFrontCardSubHeader
					typeTextColor={typeTextColor}
					docTypeColor={docTypeColor}
					docOrgColor={docOrgColor}
				>
					<div className={'sub-header-one'}>
						{iconSrc.length > 0 && <img src={iconSrc} alt="type logo" />}
						{displayType}
					</div>
					<div className={'sub-header-two'}>
						{item.display_org_s ? item.display_org_s : getTypeDisplay(displayOrg)}
					</div>
				</StyledFrontCardSubHeader>
			)}
		</>
	);
};

const getDisplayTitle = (item) => {
	return item.title;
};

export const clickFn = (filename, cloneName, searchText, sourceUrl, idx = null, pageNumber = 0) => {
	trackEvent(
		getTrackingNameForFactory(cloneName),
		'CardInteraction',
		'PDFOpen',
		null,
		CustomDimensions.create(true, filename, pageNumber, idx)
	);
	window.open(
		`/#/pdfviewer/gamechanger?filename=${encode(filename)}${
			searchText ? `&prevSearchText=${searchText.replace(/"/gi, '')}` : ''
		}&pageNumber=${pageNumber}&cloneIndex=${cloneName}${sourceUrl ? `&sourceUrl=${sourceUrl}` : ''}`
	);
};

export const Row = ({ label, value, minWidth = 'inherit' }) => {
	return (
		<div style={styles.row}>
			<div style={{ fontWeight: 'bold', minWidth }}>{label}</div>
			<div style={{ marginLeft: '12px', flex: 1 }}>{value}</div>
		</div>
	);
};

export const makeRows = (fieldsArr = [], itemWithValues = {}, displayNameMap, forTable = false) => {
	const rows = [];
	for (const fieldName of fieldsArr) {
		let cleanFieldName = fieldName.replace(/_1|_2/g, '');
		const displayName = displayNameMap?.[fieldName] ?? fieldName;
		let value = itemWithValues[cleanFieldName] ?? 'Unknown';
		if (Array.isArray(value)) {
			value = value.join(', ');
		}

		if (cleanFieldName === 'body') {
			let splitValue = value.split('-----');
			value = splitValue[splitValue.length - 1];
		}

		// shorten text longer than x length
		if (value.length > 230) {
			value = value.substring(0, 230) + '...';
		}

		if (value) {
			if (forTable) {
				const row = {};
				row['Key'] = displayName.replace(/:/g, '');
				row['Value'] = value;
				rows.push(row);
			} else {
				rows.push(<Row key={cleanFieldName} label={displayName} value={value} minWidth={40} />);
			}
		}
	}

	return rows;
};

const cardHandler = {
	document: {
		getDisplayTitle: (item) => {
			return getDisplayTitle(item);
		},
		getCardHeader: (props) => {
			return getCardHeaderHandler(props);
		},

		getCardSubHeader: (props) => {
			return getCardSubHeaderHandler(props);
		},

		getCardFront: (props) => {
			const {
				item,
				state,
				backBody,
				hitsExpanded,
				setHitsExpanded,
				hoveredHit,
				setHoveredHit,
				metadataExpanded,
				setMetadataExpanded,
				intelligentSearch,
				intelligentFeedbackComponent,
				idx,
			} = props;

			let hoveredSnippet = '';
			if (Array.isArray(item.pageHits) && item.pageHits[hoveredHit]) {
				hoveredSnippet = item.pageHits[hoveredHit]?.snippet ?? '';
			}
			const contextHtml = hoveredSnippet;
			const isWideCard = true;

			if (state.listView && !intelligentSearch) {
				return (
					<StyledListViewFrontCardContent>
						<button
							type="button"
							className={'list-view-button'}
							onClick={() => {
								trackEvent(
									getTrackingNameForFactory(state.cloneData.clone_name),
									'ListViewInteraction',
									!hitsExpanded ? 'Expand hit pages' : 'Collapse hit pages',
									null,
									CustomDimensions.create(true, item.filename, null, idx)
								);
								setHitsExpanded(!hitsExpanded);
							}}
						>
							<span className="buttonText">Page Hits</span>
							<i
								className={hitsExpanded ? 'fa fa-chevron-up' : 'fa fa-chevron-down'}
								aria-hidden="true"
							/>
						</button>
						{hitsExpanded && (
							<div className={'expanded-hits'}>
								<div className={'page-hits'}>
									{_.chain(item.pageHits)
										.map((page, key) => {
											return (
												<div
													className={'page-hit'}
													key={key}
													style={{
														...(hoveredHit === key && {
															backgroundColor: '#E9691D',
															color: 'white',
														}),
													}}
													onMouseEnter={() => setHoveredHit(key)}
													onClick={(e) => {
														e.preventDefault();
														clickFn(
															item.filename,
															state.cloneData.clone_name,
															state.searchText,
															null,
															idx,
															page.pageNumber
														);
													}}
												>
													<span>
														{page.pageNumber === 0 ? 'ID' : `Page ${page.pageNumber}`}
													</span>
													<i
														className="fa fa-chevron-right"
														style={{
															color: hoveredHit === key ? 'white' : 'rgb(189, 189, 189)',
														}}
													/>
												</div>
											);
										})
										.value()}
								</div>
								<div className={'expanded-metadata'}>
									<blockquote
										dangerouslySetInnerHTML={{
											__html: sanitizeHtml(contextHtml),
										}}
									/>
								</div>
							</div>
						)}
						<button
							type="button"
							className={'list-view-button'}
							onClick={() => {
								trackEvent(
									getTrackingNameForFactory(state.cloneData.clone_name),
									'ListViewInteraction',
									!metadataExpanded ? 'Expand metadata' : 'Collapse metadata',
									null,
									CustomDimensions.create(true, item.filename, null, idx)
								);
								setMetadataExpanded(!metadataExpanded);
							}}
						>
							<span className="buttonText">Document Metadata</span>
							<i
								className={metadataExpanded ? 'fa fa-chevron-up' : 'fa fa-chevron-down'}
								aria-hidden="true"
							/>
						</button>
						{metadataExpanded && (
							<div className={'metadata'}>
								<div className={'inner-scroll-container'}>{backBody}</div>
							</div>
						)}
					</StyledListViewFrontCardContent>
				);
			} else if (state.listView && intelligentSearch) {
				return (
					<StyledListViewFrontCardContent>
						<div className={'expanded-hits'}>
							<div className={'page-hits'}>
								{_.chain(item.pageHits)
									.map((page, key) => {
										return (
											<div
												className={'page-hit'}
												key={key}
												style={{
													...(hoveredHit === key && {
														backgroundColor: '#E9691D',
														color: 'white',
													}),
												}}
												onMouseEnter={() => setHoveredHit(key)}
												onClick={(e) => {
													e.preventDefault();
													clickFn(
														item.filename,
														state.cloneData.clone_name,
														state.searchText,
														null,
														null,
														page.pageNumber
													);
												}}
											>
												<span>{page.pageNumber === 0 ? 'ID' : `Page ${page.pageNumber}`}</span>
												<i
													className="fa fa-chevron-right"
													style={{
														color: hoveredHit === key ? 'white' : 'rgb(189, 189, 189)',
													}}
												/>
											</div>
										);
									})
									.value()}
							</div>
							<div className={'expanded-metadata'}>
								<blockquote
									dangerouslySetInnerHTML={{
										__html: sanitizeHtml(contextHtml),
									}}
								/>
							</div>
						</div>
						<button
							type="button"
							className={'list-view-button'}
							onClick={() => {
								trackEvent(
									getTrackingNameForFactory(state.cloneData.clone_name),
									'ListViewInteraction',
									!metadataExpanded ? 'Expand metadata' : 'Collapse metadata',
									null,
									CustomDimensions.create(true, item.filename, null, idx)
								);
								setMetadataExpanded(!metadataExpanded);
							}}
						>
							<span className="buttonText">Document Metadata</span>
							<i
								className={metadataExpanded ? 'fa fa-chevron-up' : 'fa fa-chevron-down'}
								aria-hidden="true"
							/>
						</button>

						{metadataExpanded && (
							<div className={'metadata'}>
								<div className={'inner-scroll-container'}>{backBody}</div>
							</div>
						)}

						<div style={{ marginTop: '10px', marginBottom: '10px' }}>
							{' '}
							{intelligentFeedbackComponent()}{' '}
						</div>
					</StyledListViewFrontCardContent>
				);
			} else {
				return (
					<StyledFrontCardContent
						className={`tutorial-step-${state.componentStepNumbers['Highlight Keyword']}`}
						isWideCard={isWideCard}
					>
						<div className={'hits-container'}>
							<div className={'page-hits'}>
								{_.chain(item.pageHits)
									.map((page, key) => {
										return (
											<div
												className={'page-hit'}
												key={key}
												style={{
													...(hoveredHit === key && {
														backgroundColor: '#E9691D',
														color: 'white',
													}),
												}}
												onMouseEnter={() => setHoveredHit(key)}
												onClick={(e) => {
													e.preventDefault();
													clickFn(
														item.filename,
														state.cloneData.clone_name,
														state.searchText,
														null,
														null,
														page.pageNumber
													);
												}}
											>
												<span>{page.pageNumber === 0 ? 'ID' : `Page ${page.pageNumber}`}</span>
												<i
													className="fa fa-chevron-right"
													style={{
														color: hoveredHit === key ? 'white' : 'rgb(189, 189, 189)',
													}}
												/>
											</div>
										);
									})
									.value()}
							</div>
							<div className={'expanded-metadata'}>
								<blockquote
									className="searchdemo-blockquote"
									dangerouslySetInnerHTML={{
										__html: sanitizeHtml(contextHtml),
									}}
								/>
							</div>
						</div>
					</StyledFrontCardContent>
				);
			}
		},

		getCardBack: (props) => {
			const { item } = props;
			const metadata = getMetadataForPropertyTable(item);

			const fields = metadata.map((d) => d.Key);
			const displayItem = Object.fromEntries(metadata.map((d) => [d.Key, d.Value]));

			const backItemsTable = makeRows(fields, displayItem, null, true);

			return (
				<SimpleTable
					tableClass={'magellan-table'}
					zoom={1}
					headerExtraStyle={{ backgroundColor: '#313541', color: 'white' }}
					rows={backItemsTable}
					height={'auto'}
					dontScroll={true}
					colWidth={colWidth}
					disableWrap={true}
					title={'Metadata'}
					hideHeader={false}
				/>
			);
		},

		getFooter: (props) => {
			const {
				filename,
				cloneName,
				graphView,
				toggledMore,
				setToggledMore,
				closeGraphCard,
				showEsDoc,
				searchText,
				idx,
			} = props;

			return (
				<>
					<>
						<CardButton
							target={'_blank'}
							style={{ ...styles.footerButtonBack, CARD_FONT_SIZE }}
							href={'#'}
							onClick={(e) => {
								e.preventDefault();
								clickFn(filename, cloneName, searchText, null, null, 0);
							}}
						>
							Open
						</CardButton>
						{graphView && (
							<CardButton
								style={{ ...styles.footerButtonBack, CARD_FONT_SIZE }}
								href={'#'}
								onClick={(e) => {
									trackEvent(
										getTrackingNameForFactory(cloneName),
										'CardInteraction',
										'Close Graph Card',
										null,
										CustomDimensions.create(true, filename, null, idx)
									);
									e.preventDefault();
									closeGraphCard();
								}}
							>
								Close
							</CardButton>
						)}
						{toggledMore && Permissions.permissionValidator('Gamechanger Super Admin', true) && (
							<CardButton
								style={{ ...styles.footerButtonBack, CARD_FONT_SIZE }}
								href={'#'}
								onClick={(e) => {
									e.preventDefault();
									showEsDoc();
								}}
							>
								<i className="fa fa-code" />
							</CardButton>
						)}
					</>
					<div
						style={{ ...styles.viewMoreButton }}
						onClick={() => {
							trackFlipCardEvent(
								getTrackingNameForFactory(cloneName),
								toggledMore,
								CustomDimensions.create(true, filename, null, idx)
							);
							setToggledMore(!toggledMore);
						}}
					>
						{toggledMore ? 'Overview' : 'More'}
						<i style={styles.viewMoreChevron} className="fa fa-chevron-right" aria-hidden="true" />
					</div>
				</>
			);
		},

		getCardExtras: (props) => {
			return <></>;
		},

		getFilename: (item) => {
			return item.filename;
		},
	},

	publication: {
		getCardHeader: (props) => {
			return <></>;
		},

		getCardSubHeader: (props) => {
			return <></>;
		},

		getCardFront: (props) => {
			return <></>;
		},

		getCardBack: (props) => {
			return <></>;
		},

		getFooter: (props) => {
			return <></>;
		},

		getCardExtras: (props) => {
			return <></>;
		},

		getFilename: (item) => {
			return '';
		},
	},

	entity: {
		getCardHeader: (props) => {
			const { item, state } = props;

			const displayTitle = item.name;

			return (
				<StyledFrontCardHeader listView={state.listView} docListView={state.listView} intelligentSearch={false}>
					<div className={'title-text-selected-favorite-div'}>
						<GCTooltip title={displayTitle} placement="top" arrow>
							<div
								className={'title-text'}
								onClick={
									state.listView
										? () =>
												window.open(
													`#/gamechanger-details?type=entity&entityName=${item.name}&cloneName=${state.cloneData.clone_name}`
												)
										: () => {}
								}
							>
								<div className={'text'}>{displayTitle}</div>
								{state.listView && (
									<div className={'list-view-arrow'}>
										<KeyboardArrowRight style={{ color: 'rgb(56, 111, 148)', fontSize: 32 }} />
									</div>
								)}
							</div>
						</GCTooltip>
						{/*<div className={'selected-favorite'}>*/}
						{/*	<div style={{display: "flex"}}>*/}
						{/*		{docListView && isRevoked && <RevokedTag>Canceled</RevokedTag>}*/}
						{/*		{checkboxComponent(item.filename, `${type} ${num}`, idx)}*/}
						{/*		{favoriteComponent()}*/}
						{/*	</div>*/}
						{/*</div>*/}
					</div>
					{state.listView && (
						<div className={'list-view-sub-header'}>
							<p> {displayTitle} </p>
						</div>
					)}
				</StyledFrontCardHeader>
			);
		},

		getCardSubHeader: (props) => {
			return <></>;
		},

		getCardFront: (props) => {
			const { item, state } = props;

			if (state.listView) {
				if (item.description?.length > 300) {
					item.description = item?.description?.slice(0, 280) + '...';
				}
			} else if (item.description?.length > 180) {
				item.description = item?.description?.slice(0, 160) + '...';
			}

			return (
				<StyledEntityFrontCardContent listView={state.listView}>
					{!state.listView && <img alt="Office Img" src={item.image} />}
					{!item.done ? (
						<div>
							<LoadingIndicator customColor={'#E9691D'} />
						</div>
					) : (
						<p>{item.description}</p>
					)}
				</StyledEntityFrontCardContent>
			);
		},

		getCardBack: (props) => {
			const { item } = props;

			const metadata = [];

			metadata.push({
				Key: 'Name',
				Value: item.name,
			});
			metadata.push({
				Key: 'Alias',
				Value: item.alias,
			});
			metadata.push({
				Key: 'Type',
				Value: capitalizeFirst(item.type),
			});
			metadata.push({
				Key: 'Category',
				Value: orgAlias[item.category] ?? item.category,
			});
			metadata.push({
				Key: 'Key People',
				Value: item.key_people,
			});
			metadata.push({
				Key: 'Website',
				Value: (
					<a href={item.resource_url} target="_blank" rel="noopener noreferrer">
						{item.resource_url}
					</a>
				),
			});

			return (
				<SimpleTable
					tableClass={'magellan-table'}
					zoom={1}
					headerExtraStyle={{ backgroundColor: '#313541', color: 'white' }}
					rows={metadata}
					height={'auto'}
					dontScroll={true}
					colWidth={colWidth}
					disableWrap={true}
					title={'Organization Info'}
					hideHeader={false}
				/>
			);
		},

		getFooter: (props) => {
			const { name, cloneName, graphView, toggledMore, setToggledMore, closeGraphCard, idx } = props;

			return (
				<>
					<>
						<CardButton
							target={'_blank'}
							style={{ ...styles.footerButtonBack, CARD_FONT_SIZE }}
							href={'#'}
							onClick={(e) => {
								trackEvent(
									getTrackingNameForFactory(cloneName),
									'GraphCardInteraction',
									`Open${name}DetailsPage`
								);
								e.preventDefault();
								window.open(
									`#/gamechanger-details?type=entity&entityName=${name}&cloneName=${cloneName}`
								);
							}}
						>
							Open
						</CardButton>
						{graphView && (
							<CardButton
								style={{ ...styles.footerButtonBack, CARD_FONT_SIZE }}
								href={'#'}
								onClick={(e) => {
									trackEvent(
										getTrackingNameForFactory(cloneName),
										'CardInteraction',
										'Close Graph Card',
										null,
										CustomDimensions.create(true, name, null, idx)
									);
									e.preventDefault();
									closeGraphCard();
								}}
							>
								Close
							</CardButton>
						)}
					</>
					<div
						style={{ ...styles.viewMoreButton }}
						onClick={() => {
							trackFlipCardEvent(
								getTrackingNameForFactory(cloneName),
								toggledMore,
								CustomDimensions.create(true, name)
							);
							setToggledMore(!toggledMore);
						}}
					>
						{toggledMore ? 'Overview' : 'More'}
						<i style={styles.viewMoreChevron} className="fa fa-chevron-right" aria-hidden="true" />
					</div>
				</>
			);
		},

		getCardExtras: (props) => {
			return <></>;
		},

		getFilename: (item) => {
			return '';
		},
	},

	topic: {
		getCardHeader: (props) => {
			return <></>;
		},

		getCardSubHeader: (props) => {
			return <></>;
		},

		getCardFront: (props) => {
			return <></>;
		},

		getCardBack: (props) => {
			return <></>;
		},

		getFooter: (props) => {
			return <></>;
		},

		getCardExtras: (props) => {
			return <></>;
		},

		getFilename: (item) => {
			return '';
		},
	},
};

export const getDefaultComponent = (props, cardHandler) => {
	const {
		id,
		IS_EDGE,
		state,
		cardType,
		item,
		idx,
		checkboxComponent,
		favoriteComponent,
		graphView,
		intelligentSearch,
		toggledMore,
		detailPage,
		hitsExpanded,
		setHitsExpanded,
		hoveredHit,
		setHoveredHit,
		metadataExpanded,
		setMetadataExpanded,
		intelligentFeedbackComponent,
		collection,
		filename,
		searchText,
		setToggledMore,
		closeGraphCard,
		setModalOpen,
		dispatch,
		setFavorite,
		favorite,
		favoriteSummary,
		setFavoriteSummary,
		classes,
		modalOpen,
	} = props;

	return (
		<div className={'styled-card-container'} id={id}>
			<div
				className={'styled-card-inner'}
				ref={(node) => {
					if (node && IS_EDGE) {
						node.style.setProperty('transform-style', 'flat', 'important');
					}
				}}
			>
				{/* START CARD FRONT */}
				<div
					className={`styled-card-inner-front tutorial-step-${state.componentStepNumbers['Search Result Card']}`}
				>
					<div className={'styled-card-inner-wrapper'}>
						{/* START CARD HEADER */}
						{cardHandler[cardType].getCardHeader({
							item,
							state,
							idx,
							checkboxComponent,
							favoriteComponent,
							graphView,
							intelligentSearch,
						})}
						{/* END CARD HEADER */}

						{/* START CARD SUBHEADER */}
						{cardHandler[cardType].getCardSubHeader({ item, state, toggledMore })}
						{/* END CARD SUBHEADER */}

						{/* START CARD CONTENT */}
						<div className={`styled-card-front-content`}>
							{cardHandler[cardType].getCardFront({
								item,
								state,
								backBody: cardHandler[cardType].getCardBack({
									item,
									state,
									detailPage,
									dispatch,
								}),
								hitsExpanded,
								setHitsExpanded,
								hoveredHit,
								setHoveredHit,
								metadataExpanded,
								setMetadataExpanded,
								intelligentSearch,
								intelligentFeedbackComponent,
								collection,
								idx,
							})}
						</div>
						{/* END CARD CONTENT */}

						{/* START CARD FRONT FOOTER */}
						{!state.listView && (
							<div className={'styled-card-front-buttons'}>
								<div className={'styled-action-buttons-group'}>
									{intelligentSearch && intelligentFeedbackComponent()}
									{cardHandler[cardType].getFooter({
										toggledMore,
										graphView,
										cloneName: state.cloneData.clone_name,
										filename,
										searchText,
										setToggledMore,
										closeGraphCard,
										name: item.title,
										item,
										setModalOpen,
										showEsDoc: () => {
											console.log(item);
											setState(dispatch, { selectedDoc: item, showEsDocDialog: true });
										},
										state,
										idx,
									})}
								</div>
							</div>
						)}
						{/* END CARD FRONT FOOTER */}
					</div>
				</div>
				{/* END CARD FRONT */}

				{/* START CARD BACK */}
				<div className={'styled-card-inner-back'}>
					<div className={'styled-card-inner-wrapper'}>
						{/* CARD BACK CONTENT */}
						<div className={'styled-card-back-content'}>
							{cardHandler[cardType].getCardBack({
								item,
								state,
								dispatch,
								setFavorite,
								detailPage,
							})}
						</div>

						{/* CARD BACK FOOTER */}
						<div className={'styled-card-back-buttons'}>
							<div className={'styled-action-buttons-group'}>
								{cardHandler[cardType].getFooter({
									toggledMore,
									graphView,
									cloneName: state.cloneData.clone_name,
									filename,
									searchText,
									setToggledMore,
									closeGraphCard,
									name: item.title,
									item,
									setModalOpen,
									showEsDoc: () => {
										console.log(item);
										setState(dispatch, {
											selectedDoc: item,
											showEsDocDialog: true,
										});
									},
									state,
								})}
							</div>
						</div>
					</div>
				</div>
				{/* END CARD BACK */}

				{/* START CARD EXTRAS */}
				{cardHandler[cardType].getCardExtras({
					isFavorite: favorite,
					favoriteSummary,
					setFavoriteSummary,
					classes,
					modalOpen,
					setModalOpen,
					item,
				})}
				{/* END CARD EXTRAS */}
			</div>

			{state.listView && <Divider flexItem />}
		</div>
	);
};

const DefaultCardHandler = (props) => {
	const { setFilename, setDisplayTitle, item, cardType } = props;

	useEffect(() => {
		setFilename(cardHandler[cardType].getFilename(item));
		setDisplayTitle(cardHandler[cardType].getDisplayTitle(item));
	}, [cardType, item, setDisplayTitle, setFilename]);

	return <>{getDefaultComponent(props, cardHandler)}</>;
};

export default DefaultCardHandler;
