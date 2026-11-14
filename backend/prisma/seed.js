const { prisma, connectDB, disconnectDB } = require('../src/config/db');
const { hashPassword } = require('../src/utils/password');

async function seed() {
  console.log('🌱 Starting DisasterReady Database Seed...\n');
  await connectDB();

  // 1. Create Default Users (Citizen, Authority, Admin)
  console.log('👤 Seeding default users...');
  const defaultPasswordHash = await hashPassword('Password123!');

  const citizenUser = await prisma.user.upsert({
    where: { email: 'citizen@disasterready.org' },
    update: {},
    create: {
      email: 'citizen@disasterready.org',
      password: defaultPasswordHash,
      firstName: 'Rahul',
      lastName: 'Sharma',
      role: 'CITIZEN',
      phone: '+91-98765-43210',
      isActive: true,
    },
  });

  const authorityUser = await prisma.user.upsert({
    where: { email: 'authority@disasterready.org' },
    update: {},
    create: {
      email: 'authority@disasterready.org',
      password: defaultPasswordHash,
      firstName: 'Commander',
      lastName: 'Verma',
      role: 'AUTHORITY',
      phone: '+91-11-2345-0001',
      isActive: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@disasterready.org' },
    update: {},
    create: {
      email: 'admin@disasterready.org',
      password: defaultPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      phone: '+91-11-2345-9999',
      isActive: true,
    },
  });

  console.log(`  ✅ Users created:
     - Citizen: citizen@disasterready.org (Password: Password123!)
     - Authority: authority@disasterready.org (Password: Password123!)
     - Admin: admin@disasterready.org (Password: Password123!)\n`);

  // 2. Create Disaster Taxonomies & Educational Guidelines
  console.log('🌪️ Seeding disaster types & guidelines...');
  const disastersData = [
    {
      name: 'Earthquake',
      type: 'EARTHQUAKE',
      description: 'Sudden shaking of the ground caused by the passage of seismic waves through Earth rocks.',
      guidelines: 'Drop, Cover, and Hold On! Stay away from glass, windows, outside doors and walls. If outdoors, move away from buildings, streetlights, and utility wires.',
      iconUrl: '/icons/earthquake.svg',
    },
    {
      name: 'Flash Flood',
      type: 'FLOOD',
      description: 'Rapid flooding of low-lying areas caused by intense rainfall associated with severe thunderstorms, tropical storms, or dam breaks.',
      guidelines: 'Move immediately to higher ground. Never drive through flooded roadways: Turn Around, Don\'t Drown! Avoid contact with floodwater.',
      iconUrl: '/icons/flood.svg',
    },
    {
      name: 'Tropical Cyclone',
      type: 'CYCLONE',
      description: 'A rapidly rotating storm system characterized by a low-pressure center, strong winds, and heavy torrential rain.',
      guidelines: 'Board up windows, secure outdoor objects, keep battery-powered radios tuned to emergency broadcasts, and evacuate when ordered.',
      iconUrl: '/icons/cyclone.svg',
    },
    {
      name: 'Coastal Tsunami',
      type: 'TSUNAMI',
      description: 'A series of extremely long waves caused by a large and sudden displacement of the ocean, usually the result of an earthquake below or near the ocean floor.',
      guidelines: 'If you feel a strong earthquake near the coast or notice the ocean receding rapidly, immediately move inland to high ground.',
      iconUrl: '/icons/tsunami.svg',
    },
    {
      name: 'Wildfire',
      type: 'WILDFIRE',
      description: 'An unplanned, unwanted, and uncontrolled fire in an area of combustible vegetation starting in rural areas and expanding.',
      guidelines: 'Create a 30-foot defensible space around your home. Keep emergency "go-bags" packed. Monitor local air quality and evacuate early.',
      iconUrl: '/icons/wildfire.svg',
    },
    {
      name: 'Landslide',
      type: 'LANDSLIDE',
      description: 'The movement of rock, earth, or debris down a sloped section of land, often triggered by intense rainfall, earthquakes, or volcanic activity.',
      guidelines: 'Watch for sudden changes in water clarity, tilting trees, or cracks in ground/pavement. Stay awake during intense rainfall.',
      iconUrl: '/icons/landslide.svg',
    },
    {
      name: 'Industrial Chemical Incident',
      type: 'INDUSTRIAL_ACCIDENT',
      description: 'Accidental release of toxic chemical substances, combustible gases, or industrial hazards threatening surrounding populated communities.',
      guidelines: 'Shelter-in-place immediately: close and lock all doors and windows, turn off air conditioning/ventilation fans, and seal gaps with damp towels.',
      iconUrl: '/icons/industrial.svg',
    },
  ];

  const disasterMap = {};
  for (const item of disastersData) {
    const record = await prisma.disaster.upsert({
      where: { name: item.name },
      update: {
        type: item.type,
        description: item.description,
        guidelines: item.guidelines,
      },
      create: item,
    });
    disasterMap[item.name] = record;
  }
  console.log(`  ✅ ${Object.keys(disasterMap).length} Disaster guidelines seeded.\n`);

  // 3. Create Live Emergency Alerts
  console.log('🚨 Seeding live emergency alerts...');
  const alertsData = [
    {
      title: 'Flash Flood Warning: Rapid River Surge in Sector 4 & Central Basin',
      description: 'Heavy sustained downpours have triggered water levels to rise by 2.4 meters above danger marks. Low-lying residential clusters and underpasses are submerged. Emergency rescue boats deployed.',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      latitude: 28.6139,
      longitude: 77.2090,
      radius: 25.0,
      disasterId: disasterMap['Flash Flood'].id,
      issuedById: authorityUser.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
    },
    {
      title: 'High Seismic Tremor Advisory — Moderate Aftershocks Expected',
      description: 'Magnitude 5.4 seismic activity detected 18km East. High-rise occupants should inspect utility lines for gas leaks. Avoid using elevators. Prepare personal 72-hour survival kits.',
      severity: 'HIGH',
      status: 'ACTIVE',
      latitude: 28.5355,
      longitude: 77.3910,
      radius: 40.0,
      disasterId: disasterMap['Earthquake'].id,
      issuedById: authorityUser.id,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // +48 hours
    },
    {
      title: 'Severe Rainfall & Waterlogging Alert: Northern Arteries',
      description: 'Waterlogging reported along outer ring roads and arterial junctions. Vehicle movement restricted to emergency services. Citizens advised to avoid non-essential travel.',
      severity: 'MODERATE',
      status: 'ACTIVE',
      latitude: 28.7041,
      longitude: 77.1025,
      radius: 15.0,
      disasterId: disasterMap['Flash Flood'].id,
      issuedById: authorityUser.id,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // +12 hours
    },
    {
      title: 'Air Quality & Heatwave Advisory: Hydration Recommended',
      description: 'Summer heat index exceeding 42°C with high particulate matter. Vulnerable populations including seniors and children should avoid prolonged afternoon outdoor exposure.',
      severity: 'LOW',
      status: 'ACTIVE',
      latitude: 28.4595,
      longitude: 77.0266,
      radius: 60.0,
      disasterId: disasterMap['Industrial Chemical Incident'].id,
      issuedById: authorityUser.id,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // +72 hours
    },
  ];

  for (const alertItem of alertsData) {
    const existing = await prisma.alert.findFirst({
      where: { title: alertItem.title },
    });
    if (!existing) {
      await prisma.alert.create({ data: alertItem });
    }
  }
  console.log(`  ✅ ${alertsData.length} Emergency alerts seeded.\n`);

  // 4. Create Community Events / Mock Drills
  console.log('📅 Seeding community mock drills & workshops...');
  const eventsData = [
    {
      title: 'Citywide Community Earthquake Evacuation & Drop-Cover-Hold Drill',
      description: 'Comprehensive simulation drill with civil defense wardens, structural safety checks, triage walkthroughs, and hands-on extinguisher operation.',
      status: 'UPCOMING',
      location: 'Central Stadium & Disaster Preparedness Ground, Sector 12',
      latitude: 28.6289,
      longitude: 77.2065,
      capacity: 200,
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // +4 hours
      organizerId: authorityUser.id,
    },
    {
      title: 'Monsoon Flood Rescue & Emergency Sandbagging Workshop',
      description: 'Learn rapid flood mitigation techniques, home waterproofing, building emergency sandbag barriers, and safe water purification practices during inundation.',
      status: 'UPCOMING',
      location: 'Riverside Community Recreation Hall, Block C',
      latitude: 28.6500,
      longitude: 77.2300,
      capacity: 100,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
      organizerId: authorityUser.id,
    },
    {
      title: 'Hands-on CPR & Tactical Emergency First Aid Certification',
      description: 'Certified life-saving course covering wound dressing, severe bleeding control with tourniquets, CPR technique, and burn treatment in disaster scenarios.',
      status: 'UPCOMING',
      location: 'Metropolitan Trauma Center Training Auditorium',
      latitude: 28.5800,
      longitude: 77.2200,
      capacity: 60,
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 days
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // +5 hours
      organizerId: authorityUser.id,
    },
  ];

  for (const eventItem of eventsData) {
    const existing = await prisma.event.findFirst({
      where: { title: eventItem.title },
    });
    if (!existing) {
      await prisma.event.create({ data: eventItem });
    }
  }
  console.log(`  ✅ ${eventsData.length} Community mock drills seeded.\n`);

  // 5. Create Incident Reports
  console.log('📝 Seeding citizen incident reports...');
  const incidentsData = [
    {
      title: 'Submerged Road & Trapped Vehicles near Metro Pillar 142',
      description: 'Severe stormwater drain overflow has submerged the road under 3 feet of water. 2 cars stalled and water is encroaching into adjacent storefronts.',
      status: 'SUBMITTED',
      latitude: 28.6250,
      longitude: 77.2150,
      address: 'Main Commercial Parkway, Sector 14 Metro Station',
      reportedById: citizenUser.id,
    },
    {
      title: 'Downed High-Voltage Electric Lines Blocking Traffic',
      description: 'Heavy gusts brought down a concrete electrical pole and live cables are sparking on the asphalt. Police have cordoned off the lane; utility repair team requested.',
      status: 'UNDER_REVIEW',
      latitude: 28.6380,
      longitude: 77.2210,
      address: 'North Ring Road Junction at 4th Cross',
      reportedById: citizenUser.id,
    },
    {
      title: 'Structural Wall Cracks Observed on Highway Flyover Pier 12',
      description: 'Visible shear cracking along the support pier following tremors. Authorities have reduced the overpass to single-lane light vehicular traffic for safety assessment.',
      status: 'VERIFIED',
      latitude: 28.5900,
      longitude: 77.2400,
      address: 'Eastern Bypass Flyover Pier 12',
      reportedById: citizenUser.id,
    },
    {
      title: 'Uprooted Ancient Banyan Tree Cleared from Ambulance Corridor',
      description: 'Civil defense quick response unit cut and moved fallen tree branches. Roadway is now completely open for emergency ambulance transit.',
      status: 'RESOLVED',
      latitude: 28.6100,
      longitude: 77.2000,
      address: 'Hospital Access Road, Near Gate 2',
      reportedById: citizenUser.id,
    },
  ];

  for (const incidentItem of incidentsData) {
    const existing = await prisma.incidentReport.findFirst({
      where: { title: incidentItem.title },
    });
    if (!existing) {
      await prisma.incidentReport.create({ data: incidentItem });
    }
  }
  console.log(`  ✅ ${incidentsData.length} Incident reports seeded.\n`);

  // 6. Create Emergency Resources & Shelters
  console.log('🏥 Seeding emergency response facilities & shelters...');
  const resourcesData = [
    {
      name: 'City Central Indoor Relief Shelter',
      type: 'SHELTER',
      description: 'Fully reinforced indoor sports complex equipped with emergency cots, backup diesel generators, hot meals, and medical triage station.',
      address: 'Civic Sports Complex, Sector 8',
      latitude: 28.6200,
      longitude: 77.2100,
      phone: '+91-11-2345-6789',
      capacity: 500,
      isActive: true,
    },
    {
      name: 'Apex Metropolitan Trauma & Emergency Hospital',
      type: 'HOSPITAL',
      description: 'Level 1 Trauma Center with 24/7 disaster emergency wing, ICU beds, oxygen generation plant, and blood bank.',
      address: '22 Healthcare Avenue, Medical Enclave',
      latitude: 28.5800,
      longitude: 77.2200,
      phone: '+91-11-2345-0102',
      capacity: 350,
      isActive: true,
    },
    {
      name: 'Sector 5 Fire & Disaster Rescue Station',
      type: 'FIRE_STATION',
      description: 'Equipped with heavy hydraulic cutters, inflatable flood rescue boats, high-reach ladder tenders, and HAZMAT decontamination team.',
      address: 'Emergency Response Corridor, Station 5',
      latitude: 28.6300,
      longitude: 77.2150,
      phone: '101',
      capacity: 40,
      isActive: true,
    },
    {
      name: 'Civil Defense Evacuation Point Alpha',
      type: 'EVACUATION_POINT',
      description: 'Open-air muster ground with designated helicopter landing zone, mobile telecommunication tower, and emergency water tankers.',
      address: 'National Parade & Exhibition Grounds',
      latitude: 28.6120,
      longitude: 77.2370,
      phone: '+91-11-2338-9000',
      capacity: 2500,
      isActive: true,
    },
    {
      name: 'District Disaster Supply & Ration Depot',
      type: 'SUPPLY_CENTER',
      description: 'Central stockpile facility storing non-perishable rations, water purification kits, tarpaulins, dry medicines, and blankets.',
      address: 'Logistics Warehouse Complex, Gate 3',
      latitude: 28.6500,
      longitude: 77.1800,
      phone: '+91-11-2345-8888',
      capacity: 1200,
      isActive: true,
    },
    {
      name: 'Central Police Command & Dispatch Headquarters',
      type: 'POLICE_STATION',
      description: '24/7 city surveillance and rapid law enforcement dispatch center coordinating road closures and disaster zone security.',
      address: 'Parliament Street Police Headquarters',
      latitude: 28.6270,
      longitude: 77.2160,
      phone: '100',
      capacity: 150,
      isActive: true,
    },
  ];

  for (const resourceItem of resourcesData) {
    const existing = await prisma.emergencyResource.findFirst({
      where: { name: resourceItem.name },
    });
    if (!existing) {
      await prisma.emergencyResource.create({ data: resourceItem });
    }
  }
  console.log(`  ✅ ${resourcesData.length} Emergency facilities seeded.\n`);

  // 7. Create Preparedness Checklist Items for Citizen
  console.log('🎒 Seeding 72-hour survival kit items for citizen...');
  const kitItems = [
    { name: 'Packaged Drinking Water (3 Liters / Person / Day)', description: '3-day emergency water supply in sealed containers', category: 'Food & Water', isReady: true, quantity: 6 },
    { name: 'Non-Perishable Canned Food & High-Calorie Energy Bars', description: 'Ready-to-eat meals requiring no cooking or refrigeration', category: 'Food & Water', isReady: true, quantity: 12 },
    { name: 'Emergency First Aid Kit & Trauma Bandages', description: 'Sterile gauze, antiseptic wipes, burn cream, and medical tape', category: 'First Aid', isReady: true, quantity: 1 },
    { name: 'Prescription Medications & Chronic Illness Buffer', description: '7-day supply of personal insulin/blood pressure medications', category: 'First Aid', isReady: false, quantity: 1 },
    { name: 'Hand-Crank LED Flashlight & AM/FM Emergency Radio', description: 'Rechargeable lighting and emergency broadcast receiver', category: 'Tools & Equipment', isReady: true, quantity: 1 },
    { name: 'Multi-Tool Pocket Knife & Heavy-Duty Duct Tape', description: 'For emergency repairs and opening supplies', category: 'Tools & Equipment', isReady: false, quantity: 1 },
    { name: 'Waterproof Pouch with Identity, Deeds & Insurance Docs', description: 'Laminated copies of passport, Aadhaar, insurance, and medical records', category: 'Documents', isReady: true, quantity: 1 },
    { name: 'Thermal Foil Blankets & Rain Ponchos', description: 'Weather protection and hypothermia prevention', category: 'Clothing & Bedding', isReady: false, quantity: 4 },
  ];

  for (const kit of kitItems) {
    const existing = await prisma.preparednessItem.findFirst({
      where: { userId: citizenUser.id, name: kit.name },
    });
    if (!existing) {
      await prisma.preparednessItem.create({
        data: {
          ...kit,
          userId: citizenUser.id,
        },
      });
    }
  }
  console.log(`  ✅ ${kitItems.length} Survival kit items seeded.\n`);

  // 8. Create In-App Notifications for Citizen
  console.log('🔔 Seeding initial notifications for citizen...');
  const notificationsData = [
    {
      type: 'ALERT',
      title: '🚨 CRITICAL FLASH FLOOD WARNING',
      message: 'Rapid water surge in Sector 4 basin. Evacuate low-lying structures to higher ground immediately.',
      isRead: false,
      userId: citizenUser.id,
    },
    {
      type: 'EVENT_REMINDER',
      title: 'Upcoming Community Mock Drill',
      message: 'Reminder: Citywide Earthquake Evacuation Drill is scheduled for this weekend. Check venue details.',
      isRead: false,
      userId: citizenUser.id,
    },
    {
      type: 'INCIDENT_UPDATE',
      title: 'Incident Report Status: Verified',
      message: 'Your report "Structural Wall Cracks on Highway Flyover Pier 12" has been verified by Civil Defense Engineers.',
      isRead: true,
      userId: citizenUser.id,
    },
    {
      type: 'GENERAL',
      title: 'Welcome to DisasterReady!',
      message: 'Complete your personal 72-Hour Survival Kit checklist to strengthen your family emergency preparedness score.',
      isRead: true,
      userId: citizenUser.id,
    },
  ];

  for (const notif of notificationsData) {
    const existing = await prisma.notification.findFirst({
      where: { userId: citizenUser.id, title: notif.title },
    });
    if (!existing) {
      await prisma.notification.create({ data: notif });
    }
  }
  console.log(`  ✅ ${notificationsData.length} Notifications seeded.\n`);

  console.log('✨ DisasterReady database seeding completed successfully!\n');
}

seed()
  .catch((err) => {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });
