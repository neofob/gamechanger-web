import React, { useContext, useEffect } from 'react';
import GCTooltip from '../../common/GCToolTip';
import { HoverNavItem, NavItem } from '../../navigation/NavItems';
import { trackEvent } from '../../telemetry/Matomo';
import { getCloneTitleForFactory, getTrackingNameForFactory, PAGE_DISPLAYED } from '../../../utils/gamechangerUtils';
import { ConstrainedIcon, PageLink, StyledBadgeSmall } from '@dod-advana/advana-side-nav/dist/SlideOutMenu';
import BellIcon from '../../../images/icon/NewNotificationsIcon.png';
import { setState } from '../../../utils/sharedFunctions';
import AppTutorialsIcon from '../../../images/icon/AppTutorialsIcon.png';
import UserFeedbackIcon from '../../../images/icon/UserFeedbackIcon.png';
import UserIcon from '../../../images/icon/UserIcon.png';
import CrowdSourcingAppIcon from '../../../images/icon/NewCrowdSourcingIcon.png';
import DataStatusTrackerIcon from '../../../images/icon/NewDataStatusTrackerIcon.png';
import AnalystToolsIcon from '../../../images/icon/analyticswht.png';
import Permissions from '@dod-advana/advana-platform-ui/dist/utilities/permissions';
import AdminIcon from '../../../images/icon/NewAdminIcon.png';
import { Typography } from '@material-ui/core';
import { getNotifications } from '../../notifications/Notifications';
import GamechangerContractSearchIcon from '../../../images/logos/GAMECHANGER-Contract-White.png';
import SlideOutMenuContent from '@dod-advana/advana-side-nav/dist/SlideOutMenuContent';
import { SlideOutToolContext } from '@dod-advana/advana-side-nav/dist/SlideOutMenuContext';
import PropTypes from 'prop-types';

const isDecoupled = window?.__env__?.REACT_APP_GC_DECOUPLED === 'true' || process.env.REACT_APP_GC_DECOUPLED === 'true';

const styles = {
	wording: {
		color: 'white',
		marginRight: 15,
	},
};

const getToolTheme = (cloneData) => {
	return {
		menuBackgroundColor: '#171A23',
		logoBackgroundColor: '#000000',
		openCloseButtonBackgroundColor: '#000000',
		allAppsBackgroundColor: '#171A23',
		openCloseIconColor: '#FFFFFF',
		sectionSeparatorColor: '#323E4A',
		fontColor: '#FFFFFF',
		hoverColor: '#E9691D',
		toolLogo: (
			<div>
				<Typography variant="h1" style={{ ...styles.wording, margin: '5px 0 0 0' }}>
					<img src={GamechangerContractSearchIcon} alt="tool logo" style={{ width: 180, maxHeight: 55 }} />
				</Typography>
				<Typography
					variant="h6"
					style={{
						...styles.wording,
						textAlign: 'center',
						margin: '5px 0 0 0',
					}}
				>
					Powered by GAMECHANGER
				</Typography>
			</div>
		),
		toolIconHref: `#/${cloneData?.clone_data?.url || ''}`,
	};
};

const getToolState = (state) => {
	return {
		knowledgeBaseHref: 'https://wiki.advana.data.mil',
		toolTheme: getToolTheme(state.cloneData),
		toolName: state.cloneData?.clone_name?.toUpperCase() || '',
		hideAllApplicationsSection: isDecoupled,
		hideContentSection: false,
		extraSupportLinks: [],
		associatedApplications: [],
	};
};

const clickNotification = (state, dispatch) => {
	getNotifications(dispatch);
	trackEvent(getTrackingNameForFactory(state.cloneData.clone_name), 'SidebarInteraction', 'ShowNotifications');
};

const clickTutorial = (state, dispatch) => {
	setState(dispatch, {
		showTutorial: true,
		clickedTutorial: true,
	});
	trackEvent(getTrackingNameForFactory(state.cloneData.clone_name), 'SidebarInteraction', 'ShowTutorial');
};

const generateClosedContentArea = (state, dispatch) => {
	const toolTheme = getToolTheme(state.cloneData);
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
			}}
		>
			{state.notificationIds.length > 0 && (
				<GCTooltip title="Show Notifications" placement="right" arrow>
					<HoverNavItem
						centered
						onClick={() => {
							clickNotification(state, dispatch);
						}}
						toolTheme={toolTheme}
					>
						{/* <NotificationsClosed src={BellIcon} notificationCount={state.notifications.length} /> */}
						<ConstrainedIcon src={UserIcon} />
					</HoverNavItem>
				</GCTooltip>
			)}
			{state.cloneData?.show_tutorial && Object.keys(state.componentStepNumbers).length > 0 && (
				<GCTooltip title="How-to, features, and tips" placement="right" arrow>
					<HoverNavItem
						centered
						onClick={() => {
							clickTutorial(state, dispatch);
						}}
						toolTheme={toolTheme}
					>
						<StyledBadgeSmall
							color="secondary"
							badgeContent=" "
							invisible={!state.newUser || state.clickedTutorial}
						>
							<ConstrainedIcon src={AppTutorialsIcon} />
						</StyledBadgeSmall>
					</HoverNavItem>
				</GCTooltip>
			)}
			<GCTooltip title="User Feedback" placement="right" arrow>
				<HoverNavItem
					centered
					onClick={() => {
						setState(dispatch, { showFeedbackModal: true });
						trackEvent(
							getTrackingNameForFactory(state.cloneData.clone_name),
							'SidebarInteraction',
							'showUserFeedback'
						);
					}}
					toolTheme={toolTheme}
				>
					<ConstrainedIcon src={UserFeedbackIcon} />
				</HoverNavItem>
			</GCTooltip>
			{state.cloneData?.show_crowd_source && (
				<GCTooltip title="Crowd Sourcing" placement="right" arrow>
					<HoverNavItem
						centered
						onClick={() => {
							setState(dispatch, { showAssistModal: true });
							trackEvent(
								getTrackingNameForFactory(state.cloneData.clone_name),
								'SidebarInteraction',
								'CrowdSourcing'
							);
						}}
						toolTheme={toolTheme}
					>
						<ConstrainedIcon src={CrowdSourcingAppIcon} />
					</HoverNavItem>
				</GCTooltip>
			)}
			{state.cloneData?.show_data_tracker && (
				<GCTooltip title="Data Tracker" placement="right" arrow>
					<HoverNavItem
						centered
						onClick={() => {
							setState(dispatch, {
								pageDisplayed: PAGE_DISPLAYED.dataTracker,
							});
							trackEvent(
								getTrackingNameForFactory(state.cloneData.clone_name),
								'SidebarInteraction',
								'showDataTracker'
							);
						}}
						active={state.pageDisplayed === PAGE_DISPLAYED.dataTracker}
						toolTheme={toolTheme}
					>
						<ConstrainedIcon src={DataStatusTrackerIcon} />
					</HoverNavItem>
				</GCTooltip>
			)}
			<GCTooltip title="Analyst Tools" placement="right" arrow>
				<HoverNavItem
					centered
					onClick={() => {
						setState(dispatch, {
							pageDisplayed: PAGE_DISPLAYED.analystTools,
						});
						trackEvent(
							getTrackingNameForFactory(state.cloneData.clone_name),
							'showResponsibilityTracker',
							'onCLick'
						);
					}}
					active={state.pageDisplayed === PAGE_DISPLAYED.analystTools}
					toolTheme={toolTheme}
				>
					<ConstrainedIcon src={AnalystToolsIcon} />
				</HoverNavItem>
			</GCTooltip>
			<GCTooltip title="User Dashboard" placement="right" arrow>
				<HoverNavItem
					centered
					onClick={() => {
						window.history.pushState(
							null,
							document.title,
							`/#/${state.cloneData.url.toLowerCase()}/${PAGE_DISPLAYED.userDashboard}`
						);
						setState(dispatch, { pageDisplayed: PAGE_DISPLAYED.userDashboard });
						trackEvent(
							getTrackingNameForFactory(state.cloneData.clone_name),
							'SidebarInteraction',
							'showUserDashboard'
						);
					}}
					active={state.pageDisplayed === PAGE_DISPLAYED.userDashboard}
					toolTheme={toolTheme}
				>
					<ConstrainedIcon src={UserIcon} />
				</HoverNavItem>
			</GCTooltip>
			{Permissions.isGameChangerAdmin() && (
				<GCTooltip title="Admin Page" placement="right" arrow>
					<PageLink href={`#/${state.cloneData.url}/admin`} centered style={{ width: '100%' }}>
						<HoverNavItem centered toolTheme={toolTheme}>
							<ConstrainedIcon src={AdminIcon} />
						</HoverNavItem>
					</PageLink>
				</GCTooltip>
			)}
		</div>
	);
};

const generateOpenedContentArea = (state, dispatch) => {
	const toolTheme = getToolTheme(state.cloneData);
	return (
		<div style={{ display: 'flex', flexDirection: 'column' }}>
			{state.notificationIds.length > 0 && (
				<GCTooltip title="Show Notifications" placement="right" arrow>
					<HoverNavItem
						onClick={() => {
							clickNotification(state, dispatch);
						}}
						toolTheme={toolTheme}
					>
						{/* <Notifications src={BellIcon} notificationCount={state.notifications.length} /> */}
						<ConstrainedIcon src={BellIcon} />
						<span style={{ marginLeft: '10px' }}>Notifications</span>
					</HoverNavItem>
				</GCTooltip>
			)}
			<NavItem style={{ justifyContent: 'space-between' }}>
				<span>{getCloneTitleForFactory(state.cloneData, true)} MENU</span>
			</NavItem>
			{state.cloneData?.show_tutorial && Object.keys(state.componentStepNumbers).length > 0 && (
				<GCTooltip title="How-to, features, and tips" placement="right" arrow>
					<HoverNavItem
						onClick={() => {
							clickTutorial(state, dispatch);
						}}
						toolTheme={toolTheme}
					>
						<StyledBadgeSmall
							color="secondary"
							badgeContent=" "
							invisible={!state.newUser || state.clickedTutorial}
						>
							<ConstrainedIcon src={AppTutorialsIcon} />
						</StyledBadgeSmall>
						<span style={{ marginLeft: '10px' }}>Guided Tutorial</span>
					</HoverNavItem>
				</GCTooltip>
			)}
			<GCTooltip title="Tell us what you think!" placement="right" arrow>
				<HoverNavItem
					onClick={() => {
						setState(dispatch, { showFeedbackModal: true });
						trackEvent(
							getTrackingNameForFactory(state.cloneData.clone_name),
							'SidebarInteraction',
							'showUserFeedbackSelected'
						);
					}}
					toolTheme={toolTheme}
				>
					<ConstrainedIcon src={UserFeedbackIcon} />
					<span style={{ marginLeft: '10px' }}>User Feedback</span>
				</HoverNavItem>
			</GCTooltip>
			{state.cloneData?.show_crowd_source && (
				<GCTooltip title="Help us verify data" placement="right" arrow>
					<HoverNavItem
						onClick={() => {
							setState(dispatch, { showAssistModal: true });
							trackEvent(
								getTrackingNameForFactory(state.cloneData.clone_name),
								'SidebarInteraction',
								'CrowdSourcingSelected'
							);
						}}
						toolTheme={toolTheme}
					>
						<ConstrainedIcon src={CrowdSourcingAppIcon} />
						<span style={{ marginLeft: '10px' }}>Crowd Sourcing</span>
					</HoverNavItem>
				</GCTooltip>
			)}
			{state.cloneData?.show_data_tracker && (
				<GCTooltip title="Data Tracker" placement="right" arrow>
					<HoverNavItem
						onClick={() => {
							setState(dispatch, {
								pageDisplayed: PAGE_DISPLAYED.dataTracker,
							});
							trackEvent(
								getTrackingNameForFactory(state.cloneData.clone_name),
								'SidebarInteraction',
								'DataTrackerSelected'
							);
						}}
						active={state.pageDisplayed === PAGE_DISPLAYED.dataTracker}
						toolTheme={toolTheme}
					>
						<ConstrainedIcon src={DataStatusTrackerIcon} />
						<span style={{ marginLeft: '10px' }}>Data Tracker</span>
					</HoverNavItem>
				</GCTooltip>
			)}
			<GCTooltip title="Analyst Tools" placement="right" arrow>
				<HoverNavItem
					onClick={() => {
						setState(dispatch, {
							pageDisplayed: PAGE_DISPLAYED.analystTools,
						});
						trackEvent('DataTracker', 'onCLick');
					}}
					active={state.pageDisplayed === PAGE_DISPLAYED.analystTools}
					toolTheme={toolTheme}
				>
					<ConstrainedIcon src={AnalystToolsIcon} />
					<span style={{ marginLeft: '10px' }}>Analyst Tools</span>
				</HoverNavItem>
			</GCTooltip>
			<GCTooltip title="User Dashboard" placement="right" arrow>
				<HoverNavItem
					onClick={() => {
						window.history.pushState(
							null,
							document.title,
							`/#/${state.cloneData.url.toLowerCase()}/${PAGE_DISPLAYED.userDashboard}`
						);
						setState(dispatch, { pageDisplayed: PAGE_DISPLAYED.userDashboard });
						trackEvent(
							getTrackingNameForFactory(state.cloneData.clone_name),
							'SidebarInteraction',
							'shoeUserDashboard'
						);
					}}
					active={state.pageDisplayed === PAGE_DISPLAYED.userDashboard}
					toolTheme={toolTheme}
				>
					<ConstrainedIcon src={UserIcon} />
					<span style={{ marginLeft: '10px' }}>User Dashboard</span>
				</HoverNavItem>
			</GCTooltip>
			{Permissions.isGameChangerAdmin() && (
				<GCTooltip title="Admin Page" placement="right" arrow>
					<PageLink href={`#/${state.cloneData.url}/admin`}>
						<HoverNavItem toolTheme={toolTheme}>
							<ConstrainedIcon src={AdminIcon} />
							<span style={{ marginLeft: '10px' }}>Admin Page</span>
						</HoverNavItem>
					</PageLink>
				</GCTooltip>
			)}
		</div>
	);
};

const EdaNavigationHandler = (props) => {
	const { state, dispatch } = props;

	const { setToolState, unsetTool } = useContext(SlideOutToolContext);

	useEffect(() => {
		setToolState(getToolState(state));

		return () => {
			unsetTool();
		};
	}, [unsetTool, setToolState, state]);

	return (
		<>
			<SlideOutMenuContent type="closed">{generateClosedContentArea(state, dispatch)}</SlideOutMenuContent>
			<SlideOutMenuContent type="open">{generateOpenedContentArea(state, dispatch)}</SlideOutMenuContent>
		</>
	);
};

EdaNavigationHandler.propTypes = {
	state: PropTypes.shape({
		cloneData: PropTypes.object,
		componentStepNumbers: PropTypes.array,
	}),
	dispatch: PropTypes.func,
};

export default EdaNavigationHandler;
