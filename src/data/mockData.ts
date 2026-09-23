import { Bus, Route, FuelLog, FuelAnomalyAlert, SpecialTrip, FleetAlert, LiveLocation, DistrictConfig, CollegeInfo } from '../types';

export const COLLEGES_BY_DISTRICT: Record<string, CollegeInfo[]> = {
  tirunelveli: [
    {
      id: "gce-nellai",
      name: "Government College of Engineering (GCE), Tirunelveli",
      shortName: "GCE Tirunelveli",
      districtId: "tirunelveli",
      category: "Engineering & Tech",
      address: "Trivandrum Highway (NH-44), Palayamkottai, Tirunelveli - 627007",
      contactPhone: "+91 462 2552450",
      popularBusRoutes: ["Vannarpettai - GCE Campus", "Junction - Samathanapuram - GCE", "Tenkasi Express Transit"]
    },
    {
      id: "fxec-nellai",
      name: "Francis Xavier Engineering College (FXEC), Tirunelveli",
      shortName: "FX Engineering College",
      districtId: "tirunelveli",
      category: "Engineering & Tech",
      address: "103/G2, Bypass Road, Vannarpettai, Tirunelveli - 627003",
      contactPhone: "+91 462 2502283",
      popularBusRoutes: ["Thachanallur - FXEC", "Palayamkottai - FXEC", "Ambasamudram Shuttle"]
    },
    {
      id: "sxc-palai",
      name: "St. Xavier's College (Autonomous), Palayamkottai",
      shortName: "St. Xavier's Palayamkottai",
      districtId: "tirunelveli",
      category: "Arts & Science",
      address: "St. Xavier's Road, Palayamkottai, Tirunelveli - 627002",
      contactPhone: "+91 462 4264300"
    },
    {
      id: "nec-nellai",
      name: "National Engineering College (NEC), Kovilpatti / Tirunelveli Zone",
      shortName: "NEC Kovilpatti",
      districtId: "tirunelveli",
      category: "Engineering & Tech",
      address: "K.R. Nagar, Kovilpatti - 628503 (Tirunelveli North Corridor)",
      contactPhone: "+91 4632 222502"
    },
    {
      id: "msu-nellai",
      name: "Manonmaniam Sundaranar University (MSU Main Campus)",
      shortName: "MS University",
      districtId: "tirunelveli",
      category: "University & Research",
      address: "Abishekapatti, Tirunelveli - 627012",
      contactPhone: "+91 462 2333741"
    },
    {
      id: "scad-cheran",
      name: "SCAD College of Engineering & Technology, Cheranmahadevi",
      shortName: "SCAD Engineering",
      districtId: "tirunelveli",
      category: "Engineering & Tech",
      address: "Cheranmahadevi, Tirunelveli - 627414"
    },
    {
      id: "sarah-tucker",
      name: "Sarah Tucker College (Autonomous), Tirunelveli",
      shortName: "Sarah Tucker College",
      districtId: "tirunelveli",
      category: "Arts & Science",
      address: "Perumalpuram, Palayamkottai, Tirunelveli - 627007"
    },
    {
      id: "sadakathullah",
      name: "Sadakathullah Appa College (Autonomous), Rahmath Nagar",
      shortName: "Sadakathullah Appa College",
      districtId: "tirunelveli",
      category: "Arts & Science",
      address: "Rahmath Nagar, Palayamkottai, Tirunelveli - 627011"
    },
    {
      id: "einstein-nellai",
      name: "Einstein College of Engineering, Sir C.V. Raman Nagar",
      shortName: "Einstein College",
      districtId: "tirunelveli",
      category: "Engineering & Tech",
      address: "Seethaparpanallur, Tirunelveli - 627012"
    },
    {
      id: "psn-cet",
      name: "PSN College of Engineering & Technology, Melathediyoor",
      shortName: "PSN CET",
      districtId: "tirunelveli",
      category: "Engineering & Tech",
      address: "Melathediyoor, Tirunelveli - 627152"
    }
  ],
  madurai: [
    {
      id: "tce-madurai",
      name: "Thiagarajar College of Engineering (TCE), Madurai",
      shortName: "TCE Madurai",
      districtId: "madurai",
      category: "Engineering & Tech",
      address: "Thiruparankundram, Madurai - 625015",
      contactPhone: "+91 452 2482240"
    },
    {
      id: "american-college",
      name: "The American College, Goripalayam",
      shortName: "American College Madurai",
      districtId: "madurai",
      category: "Arts & Science",
      address: "Goripalayam, Madurai - 625002"
    },
    {
      id: "kln-ce",
      name: "KLN College of Engineering, Pottapalayam",
      shortName: "KLN Engineering College",
      districtId: "madurai",
      category: "Engineering & Tech",
      address: "Pottapalayam, Sivagangai / Madurai Border - 630612"
    },
    {
      id: "velammal-madurai",
      name: "Velammal College of Engineering & Technology, Viraganoor",
      shortName: "Velammal College Madurai",
      districtId: "madurai",
      category: "Engineering & Tech",
      address: "Madurai - Tuticorin Ring Road, Viraganoor, Madurai - 625009"
    }
  ],
  coimbatore: [
    {
      id: "psg-tech",
      name: "PSG College of Technology (PSG Tech), Peelamedu",
      shortName: "PSG Tech",
      districtId: "coimbatore",
      category: "Engineering & Tech",
      address: "Avinashi Road, Peelamedu, Coimbatore - 641004"
    },
    {
      id: "cit-cbe",
      name: "Coimbatore Institute of Technology (CIT), Civil Aerodrome",
      shortName: "CIT Coimbatore",
      districtId: "coimbatore",
      category: "Engineering & Tech",
      address: "Avinashi Road, Coimbatore - 641014"
    },
    {
      id: "kct-cbe",
      name: "Kumaraguru College of Technology (KCT), Saravanampatti",
      shortName: "Kumaraguru (KCT)",
      districtId: "coimbatore",
      category: "Engineering & Tech",
      address: "Athipalayam Road, Chinnavedampatti, Coimbatore - 641049"
    },
    {
      id: "skcet-cbe",
      name: "Sri Krishna College of Engineering and Technology (SKCET)",
      shortName: "SKCET Kuniamuthur",
      districtId: "coimbatore",
      category: "Engineering & Tech",
      address: "Sugunapuram, Kuniamuthur, Coimbatore - 641008"
    }
  ],
  chennai: [
    {
      id: "ceg-anna",
      name: "College of Engineering, Guindy (Anna University - CEG)",
      shortName: "Anna University (CEG)",
      districtId: "chennai",
      category: "University & Research",
      address: "12, Sardar Patel Road, Guindy, Chennai - 600025"
    },
    {
      id: "mit-anna",
      name: "Madras Institute of Technology (MIT Campus - Anna University)",
      shortName: "MIT Chromepet",
      districtId: "chennai",
      category: "Engineering & Tech",
      address: "MIT Road, Radha Nagar, Chromepet, Chennai - 600044"
    },
    {
      id: "ssn-chennai",
      name: "SSN College of Engineering, Kalavakkam",
      shortName: "SSN College",
      districtId: "chennai",
      category: "Engineering & Tech",
      address: "Rajiv Gandhi Salai (OMR), Kalavakkam, Chennai - 603110"
    },
    {
      id: "loyola-chennai",
      name: "Loyola College (Autonomous), Nungambakkam",
      shortName: "Loyola College Chennai",
      districtId: "chennai",
      category: "Arts & Science",
      address: "Sterling Road, Nungambakkam, Chennai - 600034"
    }
  ],
  thoothukudi: [
    {
      id: "voc-tuticorin",
      name: "V.O. Chidambaram College (VOC College), Millerpuram",
      shortName: "VOC College Thoothukudi",
      districtId: "thoothukudi",
      category: "Arts & Science",
      address: "Palayamkottai Road, Millerpuram, Thoothukudi - 628008"
    },
    {
      id: "sivanthi-engg",
      name: "Dr. Sivanthi Aditanar College of Engineering, Tiruchendur",
      shortName: "Dr. Sivanthi Aditanar College",
      districtId: "thoothukudi",
      category: "Engineering & Tech",
      address: "Tiruchendur, Thoothukudi District - 628215"
    }
  ],
  kanyakumari: [
    {
      id: "scott-nagercoil",
      name: "Scott Christian College (Autonomous), Nagercoil",
      shortName: "Scott Christian College",
      districtId: "kanyakumari",
      category: "Arts & Science",
      address: "KP Road, Nagercoil, Kanyakumari - 629003"
    },
    {
      id: "niche-kumaracoil",
      name: "Noorul Islam Centre for Higher Education (NICHE)",
      shortName: "Noorul Islam University",
      districtId: "kanyakumari",
      category: "University & Research",
      address: "Kumaracoil, Thuckalay, Kanyakumari - 629180"
    },
    {
      id: "rohini-engg",
      name: "Rohini College of Engineering & Technology, Palkulam",
      shortName: "Rohini College of Engineering",
      districtId: "kanyakumari",
      category: "Engineering & Tech",
      address: "Palkulam, Anjugramam, Kanyakumari - 629401"
    }
  ],
  trichy: [
    {
      id: "nit-trichy",
      name: "National Institute of Technology (NIT Trichy), Thuvakudi",
      shortName: "NIT Trichy",
      districtId: "trichy",
      category: "University & Research",
      address: "Tanjore Main Road, National Highway 67, Tiruchirappalli - 620015"
    },
    {
      id: "st-joseph-trichy",
      name: "St. Joseph's College (Autonomous), Teppakulam",
      shortName: "St. Joseph's Trichy",
      districtId: "trichy",
      category: "Arts & Science",
      address: "College Road, Singarathope, Tiruchirappalli - 620002"
    }
  ],
  bengaluru: [
    {
      id: "rvce-bengaluru",
      name: "RV College of Engineering (RVCE), Mysuru Road",
      shortName: "RVCE Bengaluru",
      districtId: "bengaluru",
      category: "Engineering & Tech",
      address: "Mysuru Road, RV Vidyanikethan Post, Bengaluru - 560059"
    },
    {
      id: "bmsce-bengaluru",
      name: "BMS College of Engineering (BMSCE), Basavanagudi",
      shortName: "BMSCE",
      districtId: "bengaluru",
      category: "Engineering & Tech",
      address: "Bull Temple Road, Basavanagudi, Bengaluru - 560019"
    }
  ]
};

export const DISTRICTS_CONFIG: DistrictConfig[] = [
  {
    id: "tirunelveli",
    name: "Tirunelveli",
    state: "Tamil Nadu",
    code: "TN-72",
    center: [8.7280, 77.7280],
    zoom: 13,
    campusName: "Tirunelveli Central Campus",
    campusAddress: "Tirunelveli - Trivandrum Highway (NH-44), Palayamkottai, Tirunelveli - 627007, Tamil Nadu",
    campusLocation: { lat: 8.7302, lng: 77.7280 },
    popularLandmarks: [
      "Tirunelveli Junction Railway Station",
      "Vannarpettai Roundana",
      "Palayamkottai St. Xavier's Bus Stop",
      "Samathanapuram Signal",
      "Thachanallur Junction",
      "Nellaiyappar Temple Arch",
      "Gangaikondan SIPCOT IT SEZ",
      "Perumalpuram Post Office"
    ],
    tagline: "Nellai Smart Transit Corridor"
  },
  {
    id: "madurai",
    name: "Madurai",
    state: "Tamil Nadu",
    code: "TN-58",
    center: [9.9252, 78.1198],
    zoom: 13,
    campusName: "Madurai Regional Tech Hub",
    campusAddress: "Ring Road, Mattuthavani Junction, Madurai - 625020, Tamil Nadu",
    campusLocation: { lat: 9.9320, lng: 78.1450 },
    popularLandmarks: ["Mattuthavani Bus Terminus", "Goripalayam", "Periyar Bus Stand", "Thirunagar"],
    tagline: "Temple City Transit Grid"
  },
  {
    id: "coimbatore",
    name: "Coimbatore",
    state: "Tamil Nadu",
    code: "TN-37",
    center: [11.0168, 76.9558],
    zoom: 13,
    campusName: "Coimbatore Tech Campus",
    campusAddress: "Avinashi Road, Peelamedu, Coimbatore - 641004, Tamil Nadu",
    campusLocation: { lat: 11.0280, lng: 77.0020 },
    popularLandmarks: ["Gandhipuram Central Bus Stand", "RS Puram Circle", "Peelamedu", "Saravanampatti IT Corridor"],
    tagline: "Kovai Express Transit"
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    code: "TN-01",
    center: [13.0827, 80.2707],
    zoom: 12,
    campusName: "Chennai Metropolitan Campus",
    campusAddress: "Old Mahabalipuram Road (OMR), Sholinganallur, Chennai - 600119, Tamil Nadu",
    campusLocation: { lat: 12.9010, lng: 80.2280 },
    popularLandmarks: ["Central Railway Station", "Guindy Kathipara Junction", "Tambaram Sanatorium", "OMR IT Expressway"],
    tagline: "Metro Fleet Dispatch"
  },
  {
    id: "thoothukudi",
    name: "Thoothukudi",
    state: "Tamil Nadu",
    code: "TN-69",
    center: [8.7642, 78.1348],
    zoom: 13,
    campusName: "Pearl City Transit Campus",
    campusAddress: "Palayamkottai Road, Thoothukudi - 628008, Tamil Nadu",
    campusLocation: { lat: 8.7750, lng: 78.1250 },
    popularLandmarks: ["Old Bus Stand", "V.O.C. Market", "Thermal Power Station", "Spic Nagar"],
    tagline: "Coastal Harbor Fleet"
  },
  {
    id: "kanyakumari",
    name: "Kanyakumari / Nagercoil",
    state: "Tamil Nadu",
    code: "TN-74",
    center: [8.1833, 77.4119],
    zoom: 13,
    campusName: "Cape Comorin Tech Hub",
    campusAddress: "Cape Road, Nagercoil, Kanyakumari - 629001, Tamil Nadu",
    campusLocation: { lat: 8.1920, lng: 77.4250 },
    popularLandmarks: ["Vadasery Christopher Bus Stand", "Anna Stadium Nagercoil", "Scott College Point"],
    tagline: "Southern Tip Transit Net"
  },
  {
    id: "trichy",
    name: "Tiruchirappalli",
    state: "Tamil Nadu",
    code: "TN-45",
    center: [10.7905, 78.7047],
    zoom: 13,
    campusName: "Rockfort Central Campus",
    campusAddress: "Thanjavur Highway, NIT Corrdior, Trichy - 620015, Tamil Nadu",
    campusLocation: { lat: 10.7610, lng: 78.8140 },
    popularLandmarks: ["Central Bus Stand", "Thillai Nagar Main Rd", "Chatram Bus Stand", "Rockfort Gate"],
    tagline: "Cauvery Delta Fleet"
  },
  {
    id: "bengaluru",
    name: "Bengaluru Urban",
    state: "Karnataka",
    code: "KA-05",
    center: [12.9716, 77.5946],
    zoom: 13,
    campusName: "Silicon City Tech Hub",
    campusAddress: "Knowledge Innovation Park, Outer Ring Road, Tech Corridor, Bengaluru - 560103",
    campusLocation: { lat: 12.9780, lng: 77.6400 },
    popularLandmarks: ["Central Metro Interchange", "Koramangala Sony World", "ITPB Whitefield", "Domlur Flyover"],
    tagline: "Silicon Valley Express Fleet"
  }
];

export const DEFAULT_DISTRICT_ID = "tirunelveli";

export const COLLEGE_CAMPUS_LOCATION = {
  lat: 8.7302,
  lng: 77.7280,
  name: "Live Tracker - Tirunelveli Central Campus",
  address: "Tirunelveli - Trivandrum Highway (NH-44), Palayamkottai, Tirunelveli - 627007, Tamil Nadu"
};

export const INITIAL_BUSES: Bus[] = [
  // --- TIRUNELVELI FLEET (TN-72) ---
  {
    id: "bus-04",
    busNumber: "Bus #04 - Nellai Junction Express",
    plateNumber: "TN-72-AZ-4591",
    model: "Tata Starbus Ultra 48-Seater",
    capacity: 48,
    currentPassengers: 38,
    status: "on-route",
    driverId: "drv-101",
    driverName: "Murugan S",
    driverPhone: "+91 94431 87654",
    assignedRouteId: "route-01",
    districtId: "tirunelveli",
    currentOdometer: 64280,
    fuelTankCapacity: 160,
    currentFuelLevel: 118,
    fuelEfficiencyKmpl: 4.8,
    expectedEfficiencyKmpl: 5.0,
    fuelType: "Diesel",
    year: 2023,
    lastServiceDate: "2026-07-28"
  },
  {
    id: "bus-09",
    busNumber: "Bus #09 - Palayamkottai Shuttle",
    plateNumber: "TN-72-BH-8822",
    model: "Ashok Leyland Sunshine 52-Seater",
    capacity: 52,
    currentPassengers: 44,
    status: "on-route",
    driverId: "drv-102",
    driverName: "Arumugam P",
    driverPhone: "+91 98421 65432",
    assignedRouteId: "route-02",
    districtId: "tirunelveli",
    currentOdometer: 82150,
    fuelTankCapacity: 180,
    currentFuelLevel: 92,
    fuelEfficiencyKmpl: 4.5,
    expectedEfficiencyKmpl: 4.8,
    fuelType: "Diesel",
    year: 2022,
    lastServiceDate: "2026-08-02"
  },
  {
    id: "bus-12",
    busNumber: "Bus #12 - Thachanallur & SEZ Cruiser",
    plateNumber: "TN-72-CT-3310",
    model: "Eicher Starline 40-Seater",
    capacity: 40,
    currentPassengers: 32,
    status: "on-route",
    driverId: "drv-103",
    driverName: "Velusamy K",
    driverPhone: "+91 97890 12345",
    assignedRouteId: "route-03",
    districtId: "tirunelveli",
    currentOdometer: 49300,
    fuelTankCapacity: 140,
    currentFuelLevel: 104,
    fuelEfficiencyKmpl: 4.9,
    expectedEfficiencyKmpl: 5.1,
    fuelType: "Diesel",
    year: 2024,
    lastServiceDate: "2026-08-10"
  },
  {
    id: "bus-06",
    busNumber: "Bus #06 - Nellai Excursion & Special",
    plateNumber: "TN-72-DE-1199",
    model: "BharatBenz AC Coach 45-Seater",
    capacity: 45,
    currentPassengers: 0,
    status: "special-trip",
    driverId: "drv-104",
    driverName: "Muthukumar R",
    driverPhone: "+91 99440 98765",
    districtId: "tirunelveli",
    currentOdometer: 38700,
    fuelTankCapacity: 200,
    currentFuelLevel: 180,
    fuelEfficiencyKmpl: 4.2,
    expectedEfficiencyKmpl: 4.6,
    fuelType: "Diesel",
    year: 2024,
    lastServiceDate: "2026-08-12"
  },
  {
    id: "bus-02",
    busNumber: "Bus #02 - Town Heritage Standby",
    plateNumber: "TN-72-AA-7700",
    model: "Tata Starbus Standard 42-Seater",
    capacity: 42,
    currentPassengers: 0,
    status: "idle",
    driverId: "drv-105",
    driverName: "Esakkimuthu M",
    driverPhone: "+91 94862 33445",
    districtId: "tirunelveli",
    currentOdometer: 91400,
    fuelTankCapacity: 160,
    currentFuelLevel: 135,
    fuelEfficiencyKmpl: 3.3, // Anomaly flag
    expectedEfficiencyKmpl: 4.7,
    fuelType: "Diesel",
    year: 2021,
    lastServiceDate: "2026-06-15"
  },

  // --- MADURAI FLEET ---
  {
    id: "bus-md-01",
    busNumber: "Bus #M1 - Mattuthavani Express",
    plateNumber: "TN-58-AL-1244",
    model: "Tata Starbus Ultra 48-Seater",
    capacity: 48,
    currentPassengers: 35,
    status: "on-route",
    driverId: "drv-m01",
    driverName: "Karthikeyan G",
    driverPhone: "+91 94422 11223",
    assignedRouteId: "route-md-01",
    districtId: "madurai",
    currentOdometer: 54100,
    fuelTankCapacity: 160,
    currentFuelLevel: 120,
    fuelEfficiencyKmpl: 4.6,
    expectedEfficiencyKmpl: 4.8,
    fuelType: "Diesel",
    year: 2023,
    lastServiceDate: "2026-07-20"
  },

  // --- COIMBATORE FLEET ---
  {
    id: "bus-cb-01",
    busNumber: "Bus #C1 - Gandhipuram Cruiser",
    plateNumber: "TN-37-BK-5521",
    model: "Ashok Leyland Sunshine 50-Seater",
    capacity: 50,
    currentPassengers: 40,
    status: "on-route",
    driverId: "drv-c01",
    driverName: "Shanmugasundaram N",
    driverPhone: "+91 98433 44556",
    assignedRouteId: "route-cb-01",
    districtId: "coimbatore",
    currentOdometer: 61200,
    fuelTankCapacity: 170,
    currentFuelLevel: 110,
    fuelEfficiencyKmpl: 4.7,
    expectedEfficiencyKmpl: 4.9,
    fuelType: "Diesel",
    year: 2023,
    lastServiceDate: "2026-08-01"
  },

  // --- CHENNAI FLEET ---
  {
    id: "bus-ch-01",
    busNumber: "Bus #CH1 - OMR IT Express",
    plateNumber: "TN-01-EG-9988",
    model: "Eicher Skyline 44-Seater",
    capacity: 44,
    currentPassengers: 36,
    status: "on-route",
    driverId: "drv-ch01",
    driverName: "Ramesh Babu R",
    driverPhone: "+91 94444 77889",
    assignedRouteId: "route-ch-01",
    districtId: "chennai",
    currentOdometer: 72400,
    fuelTankCapacity: 160,
    currentFuelLevel: 95,
    fuelEfficiencyKmpl: 4.4,
    expectedEfficiencyKmpl: 4.7,
    fuelType: "Diesel",
    year: 2022,
    lastServiceDate: "2026-07-30"
  }
];

export const INITIAL_ROUTES: Route[] = [
  // --- TIRUNELVELI ROUTES (Flagship) ---
  {
    id: "route-01",
    code: "R-01",
    name: "Route 1: Tirunelveli Junction & Vannarpettai to Campus",
    shift: "Morning Pickup",
    color: "#3b82f6", // Blue
    totalDistanceKm: 14.8,
    estimatedDurationMin: 38,
    assignedBusId: "bus-04",
    districtId: "tirunelveli",
    status: "active",
    stops: [
      {
        id: "stop-01-1",
        routeId: "route-01",
        name: "Tirunelveli Junction Railway Station (Main Gate)",
        sequence: 1,
        lat: 8.7284,
        lng: 77.6974,
        scheduledTime: "07:20 AM",
        dwellTimeMin: 3,
        studentsRegistered: 14,
        isCompleted: true
      },
      {
        id: "stop-01-2",
        routeId: "route-01",
        name: "Kokkirakulam Collectorate Roundabout",
        sequence: 2,
        lat: 8.7210,
        lng: 77.7110,
        scheduledTime: "07:30 AM",
        dwellTimeMin: 2,
        studentsRegistered: 10,
        isCompleted: true
      },
      {
        id: "stop-01-3",
        routeId: "route-01",
        name: "Vannarpettai Chellapandian Roundana",
        sequence: 3,
        lat: 8.7225,
        lng: 77.7190,
        scheduledTime: "07:38 AM",
        dwellTimeMin: 3,
        studentsRegistered: 16,
        isCompleted: false
      },
      {
        id: "stop-01-4",
        routeId: "route-01",
        name: "Palayamkottai St. Xavier's / Market Bus Stop",
        sequence: 4,
        lat: 8.7160,
        lng: 77.7310,
        scheduledTime: "07:48 AM",
        dwellTimeMin: 2,
        studentsRegistered: 9,
        isCompleted: false
      },
      {
        id: "stop-01-5",
        routeId: "route-01",
        name: "Samathanapuram Bus Shelter",
        sequence: 5,
        lat: 8.7185,
        lng: 77.7420,
        scheduledTime: "07:54 AM",
        dwellTimeMin: 2,
        studentsRegistered: 8,
        isCompleted: false
      },
      {
        id: "stop-01-6",
        routeId: "route-01",
        name: "Live Tracker Tirunelveli Campus Terminal",
        sequence: 6,
        lat: 8.7302,
        lng: 77.7280,
        scheduledTime: "08:05 AM",
        dwellTimeMin: 5,
        studentsRegistered: 57,
        isCompleted: false
      }
    ],
    pathCoordinates: [
      [8.7284, 77.6974],
      [8.7250, 77.7040],
      [8.7210, 77.7110],
      [8.7225, 77.7190],
      [8.7190, 77.7250],
      [8.7160, 77.7310],
      [8.7185, 77.7420],
      [8.7240, 77.7360],
      [8.7302, 77.7280]
    ]
  },
  {
    id: "route-02",
    code: "R-02",
    name: "Route 2: Pettai & Nellai Town Heritage Corridor",
    shift: "Morning Pickup",
    color: "#10b981", // Emerald
    totalDistanceKm: 18.2,
    estimatedDurationMin: 45,
    assignedBusId: "bus-09",
    districtId: "tirunelveli",
    status: "active",
    stops: [
      {
        id: "stop-02-1",
        routeId: "route-02",
        name: "Pettai Industrial Estate Bus Stop",
        sequence: 1,
        lat: 8.7350,
        lng: 77.6650,
        scheduledTime: "07:15 AM",
        dwellTimeMin: 3,
        studentsRegistered: 12,
        isCompleted: true
      },
      {
        id: "stop-02-2",
        routeId: "route-02",
        name: "Nellaiyappar Temple Car Street",
        sequence: 2,
        lat: 8.7290,
        lng: 77.6840,
        scheduledTime: "07:28 AM",
        dwellTimeMin: 2,
        studentsRegistered: 15,
        isCompleted: true
      },
      {
        id: "stop-02-3",
        routeId: "route-02",
        name: "Tirunelveli Town Arch Stop",
        sequence: 3,
        lat: 8.7265,
        lng: 77.6910,
        scheduledTime: "07:38 AM",
        dwellTimeMin: 3,
        studentsRegistered: 14,
        isCompleted: false
      },
      {
        id: "stop-02-4",
        routeId: "route-02",
        name: "Kulavanigarpuram Railway Gate Stop",
        sequence: 4,
        lat: 8.7140,
        lng: 77.7210,
        scheduledTime: "07:50 AM",
        dwellTimeMin: 2,
        studentsRegistered: 11,
        isCompleted: false
      },
      {
        id: "stop-02-5",
        routeId: "route-02",
        name: "Live Tracker Tirunelveli Campus Terminal",
        sequence: 5,
        lat: 8.7302,
        lng: 77.7280,
        scheduledTime: "08:05 AM",
        dwellTimeMin: 5,
        studentsRegistered: 52,
        isCompleted: false
      }
    ],
    pathCoordinates: [
      [8.7350, 77.6650],
      [8.7310, 77.6750],
      [8.7290, 77.6840],
      [8.7265, 77.6910],
      [8.7200, 77.7050],
      [8.7140, 77.7210],
      [8.7210, 77.7260],
      [8.7302, 77.7280]
    ]
  },
  {
    id: "route-03",
    code: "R-03",
    name: "Route 3: Gangaikondan IT SEZ & Thachanallur Express",
    shift: "Morning Pickup",
    color: "#8b5cf6", // Purple
    totalDistanceKm: 21.5,
    estimatedDurationMin: 42,
    assignedBusId: "bus-12",
    districtId: "tirunelveli",
    status: "active",
    stops: [
      {
        id: "stop-03-1",
        routeId: "route-03",
        name: "Gangaikondan SIPCOT IT SEZ Gate 2",
        sequence: 1,
        lat: 8.8510,
        lng: 77.7840,
        scheduledTime: "07:15 AM",
        dwellTimeMin: 3,
        studentsRegistered: 11,
        isCompleted: true
      },
      {
        id: "stop-03-2",
        routeId: "route-03",
        name: "Thachanallur Junction Bus Shelter",
        sequence: 2,
        lat: 8.7490,
        lng: 77.7150,
        scheduledTime: "07:35 AM",
        dwellTimeMin: 3,
        studentsRegistered: 14,
        isCompleted: false
      },
      {
        id: "stop-03-3",
        routeId: "route-03",
        name: "Shanthi Nagar Main Road",
        sequence: 3,
        lat: 8.7270,
        lng: 77.7380,
        scheduledTime: "07:46 AM",
        dwellTimeMin: 2,
        studentsRegistered: 9,
        isCompleted: false
      },
      {
        id: "stop-03-4",
        routeId: "route-03",
        name: "Perumalpuram Post Office Stop",
        sequence: 4,
        lat: 8.6980,
        lng: 77.7410,
        scheduledTime: "07:54 AM",
        dwellTimeMin: 2,
        studentsRegistered: 8,
        isCompleted: false
      },
      {
        id: "stop-03-5",
        routeId: "route-03",
        name: "Live Tracker Tirunelveli Campus Terminal",
        sequence: 5,
        lat: 8.7302,
        lng: 77.7280,
        scheduledTime: "08:05 AM",
        dwellTimeMin: 5,
        studentsRegistered: 42,
        isCompleted: false
      }
    ],
    pathCoordinates: [
      [8.8510, 77.7840],
      [8.8020, 77.7550],
      [8.7490, 77.7150],
      [8.7360, 77.7270],
      [8.7270, 77.7380],
      [8.7120, 77.7400],
      [8.6980, 77.7410],
      [8.7150, 77.7330],
      [8.7302, 77.7280]
    ]
  },

  // --- MADURAI ROUTE ---
  {
    id: "route-md-01",
    code: "M-01",
    name: "Route M1: Mattuthavani & Goripalayam to Madurai Campus",
    shift: "Morning Pickup",
    color: "#ec4899",
    totalDistanceKm: 16.2,
    estimatedDurationMin: 40,
    assignedBusId: "bus-md-01",
    districtId: "madurai",
    status: "active",
    stops: [
      {
        id: "stop-md-1",
        routeId: "route-md-01",
        name: "Mattuthavani Integrated Bus Terminus",
        sequence: 1,
        lat: 9.9320,
        lng: 78.1560,
        scheduledTime: "07:20 AM",
        dwellTimeMin: 3,
        studentsRegistered: 18,
        isCompleted: true
      },
      {
        id: "stop-md-2",
        routeId: "route-md-01",
        name: "Goripalayam Junction",
        sequence: 2,
        lat: 9.9290,
        lng: 78.1320,
        scheduledTime: "07:35 AM",
        dwellTimeMin: 3,
        studentsRegistered: 14,
        isCompleted: false
      },
      {
        id: "stop-md-3",
        routeId: "route-md-01",
        name: "Live Tracker Madurai Regional Campus",
        sequence: 3,
        lat: 9.9320,
        lng: 78.1450,
        scheduledTime: "08:00 AM",
        dwellTimeMin: 5,
        studentsRegistered: 32,
        isCompleted: false
      }
    ],
    pathCoordinates: [
      [9.9320, 78.1560],
      [9.9300, 78.1420],
      [9.9290, 78.1320],
      [9.9320, 78.1450]
    ]
  },

  // --- COIMBATORE ROUTE ---
  {
    id: "route-cb-01",
    code: "C-01",
    name: "Route C1: Gandhipuram & RS Puram to Coimbatore Campus",
    shift: "Morning Pickup",
    color: "#f59e0b",
    totalDistanceKm: 18.0,
    estimatedDurationMin: 42,
    assignedBusId: "bus-cb-01",
    districtId: "coimbatore",
    status: "active",
    stops: [
      {
        id: "stop-cb-1",
        routeId: "route-cb-01",
        name: "Gandhipuram Central Bus Stand",
        sequence: 1,
        lat: 11.0180,
        lng: 76.9680,
        scheduledTime: "07:20 AM",
        dwellTimeMin: 3,
        studentsRegistered: 20,
        isCompleted: true
      },
      {
        id: "stop-cb-2",
        routeId: "route-cb-01",
        name: "Peelamedu Signal",
        sequence: 2,
        lat: 11.0260,
        lng: 76.9950,
        scheduledTime: "07:38 AM",
        dwellTimeMin: 3,
        studentsRegistered: 15,
        isCompleted: false
      },
      {
        id: "stop-cb-3",
        routeId: "route-cb-01",
        name: "Live Tracker Coimbatore Tech Campus",
        sequence: 3,
        lat: 11.0280,
        lng: 77.0020,
        scheduledTime: "08:00 AM",
        dwellTimeMin: 5,
        studentsRegistered: 35,
        isCompleted: false
      }
    ],
    pathCoordinates: [
      [11.0180, 76.9680],
      [11.0220, 76.9820],
      [11.0260, 76.9950],
      [11.0280, 77.0020]
    ]
  },

  // --- CHENNAI ROUTE ---
  {
    id: "route-ch-01",
    code: "CH-01",
    name: "Route CH1: Guindy & Tambaram to OMR Sholinganallur",
    shift: "Morning Pickup",
    color: "#06b6d4",
    totalDistanceKm: 24.5,
    estimatedDurationMin: 55,
    assignedBusId: "bus-ch-01",
    districtId: "chennai",
    status: "active",
    stops: [
      {
        id: "stop-ch-1",
        routeId: "route-ch-01",
        name: "Guindy Kathipara Junction",
        sequence: 1,
        lat: 13.0067,
        lng: 80.2010,
        scheduledTime: "07:10 AM",
        dwellTimeMin: 3,
        studentsRegistered: 16,
        isCompleted: true
      },
      {
        id: "stop-ch-2",
        routeId: "route-ch-01",
        name: "Thoraipakkam OMR Toll",
        sequence: 2,
        lat: 12.9420,
        lng: 80.2360,
        scheduledTime: "07:35 AM",
        dwellTimeMin: 3,
        studentsRegistered: 18,
        isCompleted: false
      },
      {
        id: "stop-ch-3",
        routeId: "route-ch-01",
        name: "Live Tracker Chennai Metropolitan Campus",
        sequence: 3,
        lat: 12.9010,
        lng: 80.2280,
        scheduledTime: "08:05 AM",
        dwellTimeMin: 5,
        studentsRegistered: 34,
        isCompleted: false
      }
    ],
    pathCoordinates: [
      [13.0067, 80.2010],
      [12.9750, 80.2180],
      [12.9420, 80.2360],
      [12.9010, 80.2280]
    ]
  }
];

export const INITIAL_LIVE_LOCATIONS: Record<string, LiveLocation> = {
  // Tirunelveli Bus 04
  "bus-04": {
    busId: "bus-04",
    busNumber: "Bus #04 - Nellai Junction Express",
    routeId: "route-01",
    lat: 8.7218,
    lng: 77.7150,
    speedKmph: 36,
    headingDeg: 80,
    timestamp: new Date().toISOString(),
    currentStopIndex: 2, // Approaching stop 3: Vannarpettai Roundana
    nextStopName: "Vannarpettai Chellapandian Roundana",
    etaNextStopMin: 3,
    distanceToNextStopKm: 0.6,
    delayMinutes: 0,
    isOffRoute: false,
    offRouteDistanceMeters: 8,
    ignitionStatus: "ON",
    driverStatusMessage: "Crossing Kokkirakulam bridge towards Vannarpettai. Traffic flowing smoothly."
  },
  // Tirunelveli Bus 09
  "bus-09": {
    busId: "bus-09",
    busNumber: "Bus #09 - Palayamkottai Shuttle",
    routeId: "route-02",
    lat: 8.7265,
    lng: 77.6910,
    speedKmph: 18,
    headingDeg: 120,
    timestamp: new Date().toISOString(),
    currentStopIndex: 2, // At stop 3: Town Arch
    nextStopName: "Kulavanigarpuram Railway Gate Stop",
    etaNextStopMin: 7,
    distanceToNextStopKm: 2.8,
    delayMinutes: 3,
    isOffRoute: false,
    offRouteDistanceMeters: 5,
    ignitionStatus: "ON",
    driverStatusMessage: "Boarding students at Nellai Town Arch. Moving to Kulavanigarpuram."
  },
  // Tirunelveli Bus 12
  "bus-12": {
    busId: "bus-12",
    busNumber: "Bus #12 - Thachanallur & SEZ Cruiser",
    routeId: "route-03",
    lat: 8.7520,
    lng: 77.7190,
    speedKmph: 44,
    headingDeg: 165,
    timestamp: new Date().toISOString(),
    currentStopIndex: 1, // Approaching stop 2: Thachanallur Junction
    nextStopName: "Thachanallur Junction Bus Shelter",
    etaNextStopMin: 2,
    distanceToNextStopKm: 0.4,
    delayMinutes: 0,
    isOffRoute: false,
    offRouteDistanceMeters: 6,
    ignitionStatus: "ON",
    driverStatusMessage: "Passing Thachanallur bypass on NH-44 towards Shanthi Nagar."
  },
  // Tirunelveli Bus 06 (Special Trip)
  "bus-06": {
    busId: "bus-06",
    busNumber: "Bus #06 - Nellai Excursion & Special",
    lat: 8.7302,
    lng: 77.7280,
    speedKmph: 0,
    headingDeg: 0,
    timestamp: new Date().toISOString(),
    currentStopIndex: 0,
    nextStopName: "Bosch & Sun Paper Mills, Gangaikondan SIPCOT (Venue)",
    etaNextStopMin: 40,
    distanceToNextStopKm: 24.0,
    delayMinutes: 0,
    isOffRoute: false,
    offRouteDistanceMeters: 0,
    ignitionStatus: "IDLE",
    driverStatusMessage: "Engine warmed up. Boarding mechanical dept students at Tirunelveli Campus Bay 1."
  },
  // Tirunelveli Bus 02 (Standby)
  "bus-02": {
    busId: "bus-02",
    busNumber: "Bus #02 - Town Heritage Standby",
    lat: 8.7305,
    lng: 77.7285,
    speedKmph: 0,
    headingDeg: 0,
    timestamp: new Date().toISOString(),
    currentStopIndex: 0,
    nextStopName: "Tirunelveli Depot Workshop Bay",
    etaNextStopMin: 0,
    distanceToNextStopKm: 0,
    delayMinutes: 0,
    isOffRoute: false,
    offRouteDistanceMeters: 0,
    ignitionStatus: "OFF",
    driverStatusMessage: "Parked at Tirunelveli Central Workshop. Fuel inspection pending."
  },
  // Madurai Bus
  "bus-md-01": {
    busId: "bus-md-01",
    busNumber: "Bus #M1 - Mattuthavani Express",
    routeId: "route-md-01",
    lat: 9.9300,
    lng: 78.1400,
    speedKmph: 32,
    headingDeg: 260,
    timestamp: new Date().toISOString(),
    currentStopIndex: 1,
    nextStopName: "Goripalayam Junction",
    etaNextStopMin: 4,
    distanceToNextStopKm: 1.1,
    delayMinutes: 1,
    isOffRoute: false,
    offRouteDistanceMeters: 4,
    ignitionStatus: "ON",
    driverStatusMessage: "Crossing Vaigai river bridge towards Goripalayam."
  },
  // Coimbatore Bus
  "bus-cb-01": {
    busId: "bus-cb-01",
    busNumber: "Bus #C1 - Gandhipuram Cruiser",
    routeId: "route-cb-01",
    lat: 11.0230,
    lng: 76.9850,
    speedKmph: 40,
    headingDeg: 75,
    timestamp: new Date().toISOString(),
    currentStopIndex: 1,
    nextStopName: "Peelamedu Signal",
    etaNextStopMin: 3,
    distanceToNextStopKm: 0.9,
    delayMinutes: 0,
    isOffRoute: false,
    offRouteDistanceMeters: 5,
    ignitionStatus: "ON",
    driverStatusMessage: "Avinashi road transit in progress."
  },
  // Chennai Bus
  "bus-ch-01": {
    busId: "bus-ch-01",
    busNumber: "Bus #CH1 - OMR IT Express",
    routeId: "route-ch-01",
    lat: 12.9550,
    lng: 80.2310,
    speedKmph: 30,
    headingDeg: 180,
    timestamp: new Date().toISOString(),
    currentStopIndex: 1,
    nextStopName: "Thoraipakkam OMR Toll",
    etaNextStopMin: 5,
    distanceToNextStopKm: 1.8,
    delayMinutes: 2,
    isOffRoute: false,
    offRouteDistanceMeters: 6,
    ignitionStatus: "ON",
    driverStatusMessage: "OMR corridor moving smoothly towards Sholinganallur."
  }
};

export const INITIAL_FUEL_LOGS: FuelLog[] = [
  {
    id: "fl-101",
    busId: "bus-04",
    busNumber: "Bus #04 - Nellai Junction Express",
    date: "2026-08-15",
    time: "17:45",
    litersFilled: 75.0,
    costPerLiter: 94.50,
    totalCost: 7087.50,
    odometerReading: 64280,
    previousOdometerReading: 63910,
    distanceTravelledKm: 370,
    calculatedMileageKmpl: 4.93,
    expectedMileageKmpl: 5.00,
    deviationPercent: -1.40,
    fuelStationName: "HP Auto Hub - Vannarpettai Roundana, Tirunelveli",
    receiptNumber: "HP-TIN-20260815-9921",
    driverName: "Murugan S",
    isAnomaly: false,
    notes: "Regular evening refill after Palayamkottai drop."
  },
  {
    id: "fl-102",
    busId: "bus-09",
    busNumber: "Bus #09 - Palayamkottai Shuttle",
    date: "2026-08-14",
    time: "18:10",
    litersFilled: 88.0,
    costPerLiter: 94.50,
    totalCost: 8316.00,
    odometerReading: 82150,
    previousOdometerReading: 81755,
    distanceTravelledKm: 395,
    calculatedMileageKmpl: 4.49,
    expectedMileageKmpl: 4.80,
    deviationPercent: -6.45,
    fuelStationName: "IndianOil Station - Kokkirakulam, Tirunelveli",
    receiptNumber: "IOC-TIN-88310",
    driverName: "Arumugam P",
    isAnomaly: false,
    notes: "Traffic on Nellai Town car street route."
  },
  {
    id: "fl-103",
    busId: "bus-12",
    busNumber: "Bus #12 - Thachanallur & SEZ Cruiser",
    date: "2026-08-13",
    time: "16:30",
    litersFilled: 68.0,
    costPerLiter: 94.50,
    totalCost: 6426.00,
    odometerReading: 49300,
    previousOdometerReading: 48960,
    distanceTravelledKm: 340,
    calculatedMileageKmpl: 5.00,
    expectedMileageKmpl: 5.10,
    deviationPercent: -1.96,
    fuelStationName: "BPCL Express Fuel Station - NH-44 Thachanallur",
    receiptNumber: "BP-TIN-55412",
    driverName: "Velusamy K",
    isAnomaly: false,
    notes: "Smooth four-lane highway run to Gangaikondan IT SEZ."
  },
  {
    id: "fl-104",
    busId: "bus-02",
    busNumber: "Bus #02 - Town Heritage Standby",
    date: "2026-08-12",
    time: "19:20",
    litersFilled: 108.0,
    costPerLiter: 94.50,
    totalCost: 10206.00,
    odometerReading: 91400,
    previousOdometerReading: 91044,
    distanceTravelledKm: 356,
    calculatedMileageKmpl: 3.30, // Anomaly (29.8% drop)
    expectedMileageKmpl: 4.70,
    deviationPercent: -29.78,
    fuelStationName: "Nellai Highway Fuels - Samathanapuram Depot",
    receiptNumber: "NHF-90123-X",
    driverName: "Esakkimuthu M",
    isAnomaly: true,
    anomalyReason: "Critical Mileage Drop (3.3 km/l vs 4.7 km/l benchmark, -29.8% drop). Suspected unauthorized fuel extraction or fuel line leakage in depot overnight.",
    notes: "Bus logged long idle hours with high nocturnal fuel drop recorded in telemetry."
  },
  {
    id: "fl-105",
    busId: "bus-06",
    busNumber: "Bus #06 - Nellai Excursion & Special",
    date: "2026-08-10",
    time: "08:00",
    litersFilled: 115.0,
    costPerLiter: 94.50,
    totalCost: 10867.50,
    odometerReading: 38700,
    previousOdometerReading: 38210,
    distanceTravelledKm: 490,
    calculatedMileageKmpl: 4.26,
    expectedMileageKmpl: 4.60,
    deviationPercent: -7.39,
    fuelStationName: "HP Auto Hub - Vannarpettai Roundana, Tirunelveli",
    receiptNumber: "HP-TIN-7744",
    driverName: "Muthukumar R",
    isAnomaly: false,
    notes: "Full tank loaded for sports championship transit to Anna Stadium & Tuticorin."
  }
];

export const INITIAL_ANOMALIES: FuelAnomalyAlert[] = [
  {
    id: "anom-01",
    busId: "bus-02",
    busNumber: "Bus #02 - Town Heritage Standby",
    date: "2026-08-12",
    severity: "high",
    title: "Suspected Fuel Theft / Siphoning Detected",
    description: "Mileage plummeted to 3.30 km/l on August 12 (expected: 4.70 km/l). An estimated ~32.2 Liters of diesel unaccounted for over 356 km.",
    calculatedMileage: 3.30,
    expectedMileage: 4.70,
    dropPercent: 29.78,
    estimatedFuelLossLiters: 32.2,
    status: "open"
  }
];

export const INITIAL_SPECIAL_TRIPS: SpecialTrip[] = [
  {
    id: "trip-01",
    tripName: "Mechanical & Mechatronics Industrial Visit",
    purpose: "Industrial Visit",
    department: "Department of Mechanical Engineering",
    venueName: "Bosch & Sun Paper Mills, Gangaikondan SIPCOT",
    venueAddress: "Plot 12-18, SIPCOT Industrial Park, Gangaikondan, Tirunelveli - 627352",
    venueLat: 8.8520,
    venueLng: 77.7850,
    districtId: "tirunelveli",
    startDateTime: "2026-08-18T08:30:00",
    endDateTime: "2026-08-18T17:00:00",
    passengerCount: 42,
    assignedBusId: "bus-06",
    assignedBusNumber: "Bus #06 - Nellai Excursion & Special",
    driverId: "drv-104",
    driverName: "Muthukumar R",
    driverPhone: "+91 99440 98765",
    contactPerson: "Dr. S. Subramanian (HOD Mech)",
    contactPhone: "+91 94433 11223",
    status: "scheduled",
    notes: "SIPCOT gate security clearance approved. Students must wear safety helmets and ID badges.",
    estimatedDistanceKm: 48.0,
    budgetAllocated: 6500
  },
  {
    id: "trip-02",
    tripName: "Anna Stadium Inter-Collegiate Athletics Championship",
    purpose: "Sports Meet",
    department: "Department of Physical Education & Sports",
    venueName: "Anna Stadium Sports Complex",
    venueAddress: "Stadium Road, Palayamkottai, Tirunelveli - 627002",
    venueLat: 8.7145,
    venueLng: 77.7390,
    districtId: "tirunelveli",
    startDateTime: "2026-08-20T07:00:00",
    endDateTime: "2026-08-20T19:30:00",
    passengerCount: 28,
    assignedBusId: "bus-02",
    assignedBusNumber: "Bus #02 - Town Heritage Standby",
    driverId: "drv-105",
    driverName: "Esakkimuthu M",
    driverPhone: "+91 94862 33445",
    contactPerson: "Prof. P. Ganesan (Sports Officer)",
    contactPhone: "+91 98425 77889",
    status: "scheduled",
    notes: "Athletic equipment and hydration crates loaded. Scheduled return to campus by 7:30 PM.",
    estimatedDistanceKm: 22.0,
    budgetAllocated: 4200
  },
  {
    id: "trip-03",
    tripName: "Courtallam Eco-Hydrology & Energy Research Symposium",
    purpose: "Academic Conference",
    department: "Department of Civil & Environmental Engineering",
    venueName: "Courtallam Hydro-Tech Research Centre",
    venueAddress: "Falls Road, Tenkasi - Courtallam Highway, Courtallam",
    venueLat: 8.9320,
    venueLng: 77.2740,
    districtId: "tirunelveli",
    startDateTime: "2026-08-22T06:30:00",
    endDateTime: "2026-08-22T20:00:00",
    passengerCount: 36,
    assignedBusId: "bus-06",
    assignedBusNumber: "Bus #06 - Nellai Excursion & Special",
    driverId: "drv-104",
    driverName: "Muthukumar R",
    driverPhone: "+91 99440 98765",
    contactPerson: "Dr. K. Jayanthi (Research Lead)",
    contactPhone: "+91 99431 55667",
    status: "scheduled",
    notes: "Field monitoring kits loaded. Mountain route clearance verified.",
    estimatedDistanceKm: 110.0,
    budgetAllocated: 12500
  },
  {
    id: "trip-04",
    tripName: "Port Logistics & Supply Chain Workshop at VOC Port",
    purpose: "Industrial Visit",
    department: "Department of Management & Logistics",
    venueName: "V.O. Chidambaranar Port Terminal",
    venueAddress: "Harbor Estate, Thoothukudi - 628004",
    venueLat: 8.7540,
    venueLng: 78.1820,
    districtId: "tirunelveli",
    startDateTime: "2026-08-26T07:30:00",
    endDateTime: "2026-08-26T18:00:00",
    passengerCount: 40,
    assignedBusId: "bus-06",
    assignedBusNumber: "Bus #06 - Nellai Excursion & Special",
    driverId: "drv-104",
    driverName: "Muthukumar R",
    driverPhone: "+91 99440 98765",
    contactPerson: "Prof. R. Vijayakumar",
    contactPhone: "+91 98432 11990",
    status: "scheduled",
    notes: "Customs gate passes issued for all 40 registered students and faculty coordinators.",
    estimatedDistanceKm: 95.0,
    budgetAllocated: 10800
  }
];

export const INITIAL_ALERTS: FleetAlert[] = [
  {
    id: "alt-01",
    type: "fuel-anomaly",
    busId: "bus-02",
    busNumber: "Bus #02",
    title: "Fuel Anomaly Flagged on TN-72-AA-7700",
    message: "Bus #02 recorded 3.3 km/l (-29.8% from expected 4.7 km/l) on Aug 12 at Samathanapuram Depot. Review suggested.",
    timestamp: "2026-08-12T19:25:00",
    severity: "critical",
    isRead: false
  },
  {
    id: "alt-02",
    type: "delay",
    busId: "bus-09",
    busNumber: "Bus #09",
    title: "Route 2 Running 3 Mins Behind in Nellai Town",
    message: "Congestion near Nellaiyappar Temple Arch. Estimated arrival to Kulavanigarpuram revised to 07:50 AM.",
    timestamp: "2026-08-16T07:36:00",
    severity: "warning",
    isRead: false
  },
  {
    id: "alt-03",
    type: "stop-arrival",
    busId: "bus-04",
    busNumber: "Bus #04",
    title: "Proximity Alert: 600m to Vannarpettai",
    message: "Bus #04 is 3 minutes away from Vannarpettai Chellapandian Roundana. 16 registered students alerted.",
    timestamp: "2026-08-16T07:35:00",
    severity: "info",
    isRead: true
  }
];

export const INITIAL_STUDENTS: import('../types').StudentPassenger[] = [
  {
    id: "stu-01",
    name: "Ananya Sundaram",
    rollNumber: "21CS104",
    department: "B.E. Computer Science & Engg",
    year: "III Year",
    districtId: "tirunelveli",
    busId: "bus-04",
    busNumber: "Bus #04 - Nellai Junction Express",
    routeId: "route-01",
    stopId: "stop-02",
    stopName: "Vannarpettai Chellapandian Roundana",
    parentName: "Sundaram V. (Father)",
    parentPhone: "+91 94431 88210",
    parentEmail: "sundaram.v@gmail.com",
    status: "boarded",
    boardedAtTime: "07:38 AM",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "stu-02",
    name: "Karthik Raja S",
    rollNumber: "22EC045",
    department: "B.E. Electronics & Communication",
    year: "II Year",
    districtId: "tirunelveli",
    busId: "bus-04",
    busNumber: "Bus #04 - Nellai Junction Express",
    routeId: "route-01",
    stopId: "stop-01",
    stopName: "Tirunelveli Junction Railway Station",
    parentName: "Senthil Kumar (Father)",
    parentPhone: "+91 98421 77340",
    parentEmail: "senthil.k@gmail.com",
    status: "boarded",
    boardedAtTime: "07:22 AM",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "stu-03",
    name: "Priya Meenakshi M",
    rollNumber: "20IT088",
    department: "B.Tech Information Technology",
    year: "IV Year",
    districtId: "tirunelveli",
    busId: "bus-04",
    busNumber: "Bus #04 - Nellai Junction Express",
    routeId: "route-01",
    stopId: "stop-03",
    stopName: "Samathanapuram Signal & St. Xavier's",
    parentName: "Meenakshi Nathan (Father)",
    parentPhone: "+91 97890 12345",
    parentEmail: "meenakshi.n@gmail.com",
    status: "waiting-at-stop",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "stu-04",
    name: "Vigneshwaran K",
    rollNumber: "23ME019",
    department: "B.E. Mechanical Engineering",
    year: "I Year",
    districtId: "tirunelveli",
    busId: "bus-04",
    busNumber: "Bus #04 - Nellai Junction Express",
    routeId: "route-01",
    stopId: "stop-04",
    stopName: "Palayamkottai Bus Stand",
    parentName: "Kalimuthu P (Father)",
    parentPhone: "+91 94861 55210",
    parentEmail: "kalimuthu.p@gmail.com",
    status: "waiting-at-stop",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "stu-05",
    name: "Divya Bharathi R",
    rollNumber: "21CS034",
    department: "B.E. Computer Science & Engg",
    year: "III Year",
    districtId: "tirunelveli",
    busId: "bus-04",
    busNumber: "Bus #04 - Nellai Junction Express",
    routeId: "route-01",
    stopId: "stop-05",
    stopName: "Perumalpuram Market Arch",
    parentName: "Rajendran S (Father)",
    parentPhone: "+91 99440 98765",
    parentEmail: "rajendran.s@gmail.com",
    status: "waiting-at-stop",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "stu-06",
    name: "Rahul Ramachandran",
    rollNumber: "22EE062",
    department: "B.E. Electrical & Electronics",
    year: "II Year",
    districtId: "tirunelveli",
    busId: "bus-09",
    busNumber: "Bus #09 - Palayamkottai Shuttle",
    routeId: "route-02",
    stopId: "stop-08",
    stopName: "Nellaiyappar Temple North Car Street",
    parentName: "Ramachandran K (Father)",
    parentPhone: "+91 98433 11223",
    parentEmail: "ramachandran.k@gmail.com",
    status: "boarded",
    boardedAtTime: "07:32 AM",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  }
];
