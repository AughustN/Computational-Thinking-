import { useState } from 'react';
import {
    Box, Paper, IconButton, Typography, Card, CardContent, Chip, Button, Fab
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import SearchIcon from '@material-ui/icons/Search';
import MenuIcon from '@material-ui/icons/Menu';
import GoongBusMap from '../GoongBusMap';
import GoongMapStyleControl from '../GoongMapStyleControl';
import MyLocationControl from '../MyLocationControl';
import SearchBoxBus from '../SearchBoxBus';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        height: 'calc(100vh - 50px)',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        position: 'relative',
        [theme.breakpoints.down('sm')]: {
            height: 'calc(100vh - 56px)',
        },
    },
    mapContainer: { 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        zIndex: 1 
    },
    sidebarContainer: {
        position: "fixed",
        top: 50,
        left: 0,
        height: "calc(100vh - 56px)",
        width: 400,
        background: "#fff",
        zIndex: 999,
        boxShadow: "2px 0 16px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.35s ease",
        [theme.breakpoints.down('sm')]: {
            width: '100%',
            maxWidth: '320px',
            transform: 'translateX(-100%)',
            '&.open': {
                transform: 'translateX(0)',
            },
        },
    },
    sidebarHeader: {
        padding: "14px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #e0e0e0",
    },
    toggleButton: { 
        background: "#f2f5f7", 
        borderRadius: 8,
    },
    sidebarTitle: { 
        fontSize: 18, 
        fontWeight: "bold", 
        color: "#0277BD" 
    },
    sidebarContent: { 
        padding: "16px", 
        overflowY: "auto", 
        flexGrow: 1,
        maxHeight: 'calc(100vh - 70px)',
        '&::-webkit-scrollbar': {
            width: '8px',
        },
        '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
        },
    },
    openSidebarButton: {
        position: 'fixed',
        top:70,
        left: 20,
        zIndex: 998,
        backgroundColor: '#0277BD',
        color: 'white',
        '&:hover': {
            backgroundColor: '#01579B',
        },
        [theme.breakpoints.up('md')]: {
            display: 'none',
        },
    },
    contentPaper: {
        marginBottom: theme.spacing(2),
        padding: theme.spacing(2),
    },
    busCard: {
        marginBottom: theme.spacing(2),
        backgroundColor: '#f9f9f9',
        borderLeft: `4px solid #0277BD`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backgroundColor: '#f0f7ff',
        },
    },
    busRoute: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing(1),
    },
    busRouteName: {
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#333',
    },
    busRouteTime: {
        fontSize: '14px',
        color: '#666',
    },
    stopsContainer: {
        marginTop: theme.spacing(1),
        paddingTop: theme.spacing(1),
        borderTop: `1px solid #eee`,
    },
    stopItem: {
        fontSize: '12px',
        color: '#666',
        marginBottom: theme.spacing(0.5),
        paddingLeft: theme.spacing(1),
        borderLeft: `2px solid #FFA726`,
    },
    chipGroup: {
        display: 'flex',
        gap: theme.spacing(1),
        marginTop: theme.spacing(1),
        flexWrap: 'wrap',
    },
    "@global": {
        ".open": { 
            transform: "translateX(0)",
            [theme.breakpoints.up('md')]: {
                transform: "translateX(0)",
            },
        },
        ".closed": { 
            transform: "translateX(-85%)",
            [theme.breakpoints.down('sm')]: {
                transform: "translateX(-100%)",
            },
        },
    },
}));

function BusMapPage() {
    const classes = useStyles();
    const [selectPosition, setSelectPosition] = useState(null);
    const [selectedBusRoute, setSelectedBusRoute] = useState(null);
    const [openModal, setOpenModal] = useState(window.innerWidth >= 960);
    const [mapStyle, setMapStyle] = useState('goong_map_web');
    const [userLocation, setUserLocation] = useState(null);

    // Mock bus routes data
    const busRoutes = [
        {
            id: 1,
            routeName: 'Bus 101 - Downtown Express',
            stops: 8,
            departTime: '10:00 AM',
            arriveTime: '10:35 AM',
            fare: '$2.50',
            congestion: 'Low',
            stops_list: [
                'Main St Station',
                'Market Ave',
                'Oak Park',
                'Central Plaza',
                'Downtown Terminal',
            ],
        },
        {
            id: 2,
            routeName: 'Bus 215 - Airport Connector',
            stops: 5,
            departTime: '10:05 AM',
            arriveTime: '10:45 AM',
            fare: '$3.50',
            congestion: 'Medium',
            stops_list: [
                'Start Point',
                'Highway Junction',
                'Airport Road',
                'Terminal 1',
                'Terminal 2',
            ],
        },
        {
            id: 3,
            routeName: 'Bus 42 - Residential Loop',
            stops: 12,
            departTime: '10:10 AM',
            arriveTime: '11:00 AM',
            fare: '$1.50',
            congestion: 'Heavy',
            stops_list: [
                'Residential Ave',
                'Maple St',
                'Pine St',
                'Community Center',
                'Shopping Mall',
                'Park Entrance',
            ],
        },
    ];

    const getCongestionColor = (level) => {
        switch (level) {
            case 'Low':
                return '#4CAF50';
            case 'Medium':
                return '#FFA726';
            case 'Heavy':
                return '#F44336';
            default:
                return '#666';
        }
    };

    return (
        <Box className={classes.root}>
            {/* Open Sidebar Button (Mobile only) */}
            {!openModal && (
                <Fab
                    className={classes.openSidebarButton}
                    onClick={() => setOpenModal(true)}
                    aria-label="open menu"
                >
                    <MenuIcon />
                </Fab>
            )}

            {/* Full Screen Map */}
            <Box className={classes.mapContainer}>
                <GoongBusMap 
                    selectPosition={selectPosition} 
                    style={mapStyle}
                    userLocation={userLocation}
                />
                <MyLocationControl
                    onLocationFound={(location) => {
                        setUserLocation(location);
                    }}
                />
                <GoongMapStyleControl
                    currentStyle={mapStyle}
                    onStyleChange={setMapStyle}
                />
            </Box>

            {/* Sidebar */}
            <Box className={`${classes.sidebarContainer} ${openModal ? "open" : "closed"}`}>
                <Box className={classes.sidebarHeader}>
                    <Typography className={classes.sidebarTitle}>
                        🚌 Bus Routes
                    </Typography>
                    <IconButton
                        onClick={() => setOpenModal(!openModal)}
                        className={classes.toggleButton}
                    >
                        {openModal ? <CloseIcon /> : <SearchIcon />}
                    </IconButton>
                </Box>

                {openModal && (
                    <Box className={classes.sidebarContent}>
                        {/* Search Box */}
                        <Paper className={classes.contentPaper} elevation={2}>
                            <SearchBoxBus
                                selectPosition={selectPosition}
                                setSelectPosition={setSelectPosition}
                            />
                        </Paper>

                        {/* Bus Routes List */}
                        <Paper className={classes.contentPaper} elevation={2}>
                            <Typography variant="h6" style={{ marginBottom: 16, fontWeight: 'bold' }}>
                                Available Routes
                            </Typography>

                            {busRoutes.map(route => (
                                <Card
                                    key={route.id}
                                    className={classes.busCard}
                                    onClick={() => setSelectedBusRoute(selectedBusRoute?.id === route.id ? null : route)}
                                >
                                    <CardContent style={{ paddingBottom: 12 }}>
                                        {/* Route Header */}
                                        <Box className={classes.busRoute}>
                                            <Box>
                                                <Typography className={classes.busRouteName}>
                                                    {route.routeName}
                                                </Typography>
                                                <Typography className={classes.busRouteTime}>
                                                    {route.departTime} → {route.arriveTime}
                                                </Typography>
                                            </Box>
                                            <Box textAlign="right">
                                                <Typography style={{ fontWeight: 'bold', color: '#0277BD' }}>
                                                    {route.fare}
                                                </Typography>
                                                <Chip
                                                    label={`${route.stops} stops`}
                                                    size="small"
                                                    style={{ marginTop: 8 }}
                                                />
                                            </Box>
                                        </Box>

                                        {/* Chips */}
                                        <Box className={classes.chipGroup}>
                                            <Chip
                                                label={`Traffic: ${route.congestion}`}
                                                style={{
                                                    backgroundColor: getCongestionColor(route.congestion),
                                                    color: '#fff',
                                                }}
                                                size="small"
                                            />
                                            <Chip
                                                label="Real-time tracking"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Box>

                                        {/* Expandable Stops */}
                                        {selectedBusRoute?.id === route.id && (
                                            <Box className={classes.stopsContainer}>
                                                <Typography
                                                    variant="subtitle2"
                                                    style={{ fontWeight: 'bold', marginBottom: 8 }}
                                                >
                                                    📍 Route Stops
                                                </Typography>
                                                {route.stops_list.map((stop, idx) => (
                                                    <Box key={idx} className={classes.stopItem}>
                                                        {idx + 1}. {stop}
                                                    </Box>
                                                ))}
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    fullWidth
                                                    style={{ marginTop: 12 }}
                                                >
                                                    Select This Route
                                                </Button>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Paper>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default BusMapPage;
