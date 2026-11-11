import { DisasterType } from '@/types/disaster';

export interface DisasterGuidelineContent {
  title: string;
  type: DisasterType;
  overview: string;
  causes: string[];
  warningSigns: string[];
  before: string[];
  during: string[];
  after: string[];
  checklist: string[];
  attribution: string;
}

export const DISASTER_CURRICULUM: Record<string, DisasterGuidelineContent> = {
  EARTHQUAKE: {
    title: 'Earthquake Safety & Preparedness',
    type: 'EARTHQUAKE',
    overview:
      'Earthquakes are sudden ground vibrations caused by the release of accumulated seismic energy along tectonic fault lines. They occur without warning and can trigger secondary hazards like structural collapse, liquefaction, and fires.',
    causes: [
      'Tectonic plate boundary friction and subduction zone movements.',
      'Volcanic activity and subterranean magma displacement.',
      'Induced seismicity from deep wastewater injection, mining, or large reservoir filling.',
    ],
    warningSigns: [
      'Unusual animal agitation or restlessness (shortly before tremor).',
      'Sudden localized rattling of window panes, hanging light oscillations, and subterranean rumbling.',
      'Initial mild P-waves (compressional ground vibration) seconds before destructive S-waves.',
    ],
    before: [
      'Anchor heavy furniture, water heaters, and tall shelving securely to wall studs.',
      'Identify safe structural spots in each room: beneath sturdy tables or against interior weight-bearing walls.',
      'Prepare a 72-hour emergency preparedness pack with non-perishable rations, water, and first aid.',
      'Establish a family evacuation and reunion plan with an out-of-area emergency contact.',
    ],
    during: [
      'DROP down onto your hands and knees immediately to prevent being knocked over.',
      'COVER your head and neck under a sturdy table or desk. If no shelter is nearby, cover against an interior wall.',
      'HOLD ON to your shelter until shaking completely stops. Protect your vital organs.',
      'If outdoors: move to a clear area away from buildings, powerlines, trees, and overpasses.',
      'DO NOT use elevators or rush toward stairwells during shaking.',
    ],
    after: [
      'Expect aftershocks. Be prepared to Drop, Cover, and Hold On again.',
      'Check for gas leaks: if you smell gas, turn off the main valve immediately and open windows.',
      'Inspect your residence for structural damage before re-entering.',
      'Listen to official battery-powered radio or civil defense broadcasts for emergency instructions.',
    ],
    checklist: [
      '1 gallon of drinking water per person per day (minimum 3-day supply)',
      'Whistle to signal for search and rescue personnel',
      'Heavy-duty work gloves and sturdy closed-toe shoes',
      'Battery-operated or hand-crank AM/FM emergency radio',
      'Multi-tool and adjustable wrench to shut off utilities',
      'Copies of vital identification documents in a waterproof pouch',
    ],
    attribution: 'Educational synthesis based on NDMA, FEMA (Ready.gov), and USGS Standard Guidelines.',
  },

  FLOOD: {
    title: 'Flood Response & Preparedness',
    type: 'FLOOD',
    overview:
      'Floods occur when water inundates land that is normally dry, resulting from heavy torrential rainfall, riverbank overflow, coastal storm surges, or rapid snowmelt.',
    causes: [
      'Prolonged heavy precipitation or cloudburst events exceeding soil absorption.',
      'Urban drainage blockage and impervious concrete cover.',
      'Dam or levee failures releasing sudden massive water volumes.',
      'Tidal surges associated with coastal cyclones.',
    ],
    warningSigns: [
      'Persistent heavy rainfall forecasts and civil weather advisories.',
      'Rapidly rising water levels in local streams, stormwater drains, or rivers.',
      'Muddying or bubbling of local water sources indicating upstream erosion.',
    ],
    before: [
      'Determine if your home or work premises lie within a low-lying designated floodplain.',
      'Elevate electrical panels, water heaters, and furnace systems above potential flood levels.',
      'Install check valves in plumbing lines to prevent stormwater sewer backflow.',
      'Store sandbags and plastic sheeting if residing in an at-risk low area.',
    ],
    during: [
      'Evacuate immediately if ordered by emergency authorities; never delay to protect property.',
      'Never attempt to walk, swim, or drive through moving water ("Turn Around, Don’t Drown"). Just 6 inches of moving water can sweep an adult off their feet; 12 inches can float a vehicle.',
      'Avoid downed power lines and electrically charged floodwaters.',
      'Disconnect electrical breakers if safe to do so before water enters your dwelling.',
    ],
    after: [
      'Return home only after authorities declare the area safe from flash-flood re-entry.',
      'Avoid contact with floodwaters which may contain sewage, petrochemicals, or live electrical wires.',
      'Discard any food, medicines, and drinking supplies that have come in contact with floodwater.',
      'Disinfect all surfaces and ventilate thoroughly to inhibit hazardous mold propagation.',
    ],
    checklist: [
      'Water purification tablets or compact filtration device',
      'Waterproof flashlights and spare lithium batteries',
      'High-calorie, non-perishable ready-to-eat rations',
      'Rubber boots and waterproof rain gear',
      'First-aid antiseptic kit and personal prescription medications',
      'Waterproof phone case and charged high-capacity power bank',
    ],
    attribution: 'Educational synthesis based on NOAA National Weather Service & Red Cross Flood Guidelines.',
  },

  CYCLONE: {
    title: 'Cyclone & Severe Storm Safety',
    type: 'CYCLONE',
    overview:
      'Tropical cyclones (hurricanes/typhoons) are intense atmospheric vortex systems characterized by a low-pressure center, destructive gale-force winds, torrential rain bands, and devastating coastal storm surges.',
    causes: [
      'Warm tropical sea surface temperatures exceeding 26.5°C driving atmospheric convection.',
      'Atmospheric instability and low vertical wind shear.',
      'Coriolis force facilitating circular cyclonic circulation.',
    ],
    warningSigns: [
      'Official meteorological department cyclone alerts and coastal warnings.',
      'Rapid barometric pressure drop and swell conditions along ocean shores.',
      'Increasing dense cloud bands and sudden squalls accompanied by persistent wind velocity escalation.',
    ],
    before: [
      'Trim dead tree branches hanging over rooflines and secure loose outdoor equipment.',
      'Board up glass windows or install impact-rated hurricane storm shutters.',
      'Secure domestic water supplies in clean sanitized containers.',
      'Identify nearest community cyclone shelters and plan your route.',
    ],
    during: [
      'Remain indoors in an interior reinforced room or hallway away from windows and glass doors.',
      'Beware of the "Eye of the Storm": a temporary lull does not mean the hazard has passed; winds will resume violently from the opposite direction.',
      'Keep mobile devices charged and conserve battery for emergency communications.',
      'Turn off major electrical appliances and the main circuit breaker if flooding threatens.',
    ],
    after: [
      'Remain sheltered until all-clear bulletins are officially released by disaster management.',
      'Watch out for weakened structures, dangling power cables, and fallen trees.',
      'Avoid standing water that may conceal venomous reptiles or submerged hazards.',
    ],
    checklist: [
      'Battery-operated emergency radio',
      'Waterproof tarpaulin and heavy-duty rope',
      'Minimum 5-day supply of canned food and manual can opener',
      'Essential toiletries and sanitizing wipes',
      'Emergency cash in small denominations',
      'Flashlights with spare bulbs and batteries',
    ],
    attribution: 'Educational synthesis based on India Meteorological Department (IMD) & WMO Guidelines.',
  },

  TSUNAMI: {
    title: 'Tsunami Evacuation & Response',
    type: 'TSUNAMI',
    overview:
      'A tsunami is a series of catastrophic ocean waves with long wavelengths, typically triggered by underwater earthquakes, submarine volcanic eruptions, or coastal landslides.',
    causes: [
      'Undersea subduction megathrust earthquakes causing vertical ocean floor displacement.',
      'Submarine landslides and volcanic caldera collapses.',
      'Marine meteorite impact events.',
    ],
    warningSigns: [
      'A strong or long-duration earthquake felt near coastal shores.',
      'Rapid, unusual ocean water recession, exposing reefs and seafloor.',
      'A loud roaring sound from the ocean resembling an approaching freight train.',
    ],
    before: [
      'Learn your community’s designated tsunami evacuation zones and evacuation elevation thresholds.',
      'Map multi-route evacuation paths on foot to elevations of at least 30 meters (100 feet) above sea level.',
      'Participate in annual community tsunami evacuation drills.',
    ],
    during: [
      'If you feel a strong coastal quake: DO NOT wait for a formal siren. Evacuate to high ground immediately.',
      'Move inland and uphill as far as possible on foot; vehicular roads frequently gridlock.',
      'Never go to the beach to observe a receding tide or approaching wave.',
      'Remember: A tsunami is a series of waves over several hours; the first wave is rarely the largest.',
    ],
    after: [
      'Stay away from coastal zones until emergency officials issue an explicit all-clear.',
      'Keep communication lines open for emergency traffic only; communicate via text messages.',
      'Be cautious of severely damaged coastal infrastructure and contamination.',
    ],
    checklist: [
      'High-decibel emergency whistle for signaling',
      'Sturdy running footwear',
      'Compact first aid kit with tourniquets and trauma bandages',
      'Emergency thermal space blankets',
      'Identification and insurance papers sealed in waterproof cases',
    ],
    attribution: 'Educational synthesis based on IOC-UNESCO Tsunami Warning System & USGS.',
  },

  LANDSLIDE: {
    title: 'Landslide & Debris Flow Precautions',
    type: 'LANDSLIDE',
    overview:
      'Landslides involve the down-slope gravitational movement of rock, soil, and organic debris. They frequently happen during heavy monsoon rainfall, earthquake ground motion, or hillside excavation.',
    causes: [
      'Saturation of steep slopes by intense continuous precipitation.',
      'Deforestation and slope destabilization from unplanned construction.',
      'Seismic shaking weakening unstable hillside strata.',
    ],
    warningSigns: [
      'New cracks appearing in plaster, foundations, or hillside retaining walls.',
      'Doors or windows sticking for the first time due to structural tilt.',
      'Sudden muddying of mountain streams or springs.',
      'Faint rumbling sounds that increase in volume as the ground slope shifts.',
    ],
    before: [
      'Avoid building structures on or near steep slopes, drainage channels, or stream ravines.',
      'Plant ground-cover vegetation to anchor surface topsoil and install proper slope drainage.',
      'Learn the local landslide hazard history of your geographic sector.',
    ],
    during: [
      'If indoors: evacuate immediately away from the landslide path if safe to do so.',
      'If escape is impossible: curl into a tight ball and protect your head under heavy furniture.',
      'If driving: watch for collapsed pavement, mud, and fallen boulders on mountain roadways.',
    ],
    after: [
      'Stay completely clear of the slide zone; secondary landslides often follow.',
      'Check for injured or trapped persons without entering the direct slide path.',
      'Report broken utility lines to emergency services immediately.',
    ],
    checklist: [
      'Sturdy hiking boots and leather work gloves',
      'High-intensity LED headlamp with spare batteries',
      'Heavy-duty rope and carabiners',
      'Portable multi-band radio',
      'Emergency thermal blankets and water filtration bottles',
    ],
    attribution: 'Educational synthesis based on Geological Survey & Disaster Management Protocols.',
  },

  WILDFIRE: {
    title: 'Wildfire & Bushfire Action Guide',
    type: 'WILDFIRE',
    overview:
      'Wildfires are uncontrolled fires burning through vegetation, fueled by dry winds, high temperatures, and arid brush. They move with extreme speed and create blinding smoke and embers.',
    causes: [
      'Lightning strikes during dry convective storm events.',
      'Human negligence (unattended campfires, burning agricultural debris, discarded cigarettes).',
      'Equipment failure or electrical power line arcing in windy conditions.',
    ],
    warningSigns: [
      'Civil meteorological fire danger ratings (Red Flag Warnings).',
      'Plumes of dense smoke and visible flying burning embers carried on wind currents.',
      'Distinct smell of burning vegetation and sudden wildlife displacement.',
    ],
    before: [
      'Maintain a 30-foot (10-meter) defensible buffer zone free of flammable vegetation around buildings.',
      'Clear gutters and roofs of dried pine needles and leaves.',
      'Install ember-resistant mesh vents on eaves and crawlspaces.',
    ],
    during: [
      'Evacuate as soon as an evacuation warning is broadcasted; do not wait for mandatory orders.',
      'Wear protective 100% cotton or wool clothing, heavy boots, and N95/P100 particulate respirator masks.',
      'Shut off gas at the meter and turn off pilot lights before leaving.',
      'Close all windows and doors to prevent interior drafts, but leave them unlocked.',
    ],
    after: [
      'Check structural roofs and perimeters for hidden smoldering embers.',
      'Do not enter burnt buildings until declared safe by fire crews.',
      'Wear particulate respirators when cleaning up fire ash to protect lung health.',
    ],
    checklist: [
      'N95 or P100 particulate respirator masks (multiple per family member)',
      'Goggles to protect eyes from smoke and flying ash',
      'Heavy cotton clothing and sturdy leather boots',
      'Vehicle fuel tank kept at least half-full during dry wind seasons',
      'Portable air purifier or box fan with MERV-13 filter for sheltering',
    ],
    attribution: 'Educational synthesis based on NFPA Firewise USA & Ready.gov Wildfire Guidelines.',
  },

  INDUSTRIAL_ACCIDENT: {
    title: 'Industrial & Chemical Hazard Safety',
    type: 'INDUSTRIAL_ACCIDENT',
    overview:
      'Industrial incidents include chemical spills, toxic gas plumes, refinery explosions, or radiation leakages originating from manufacturing facilities, transport carriers, or storage depots.',
    causes: [
      'Equipment failure or mechanical breakdown in high-pressure containment vessels.',
      'Transportation collisions involving hazardous material tanker trucks or railcars.',
      'Inadequate safety compliance, storage negligence, or cyber/physical sabotage.',
    ],
    warningSigns: [
      'Industrial siren broadcasts and public address warnings from nearby plants.',
      'Pungent, irritating chemical odors in the ambient atmosphere.',
      'Visible colored smoke or vapor clouds hugging the ground.',
      'Rapid burning sensation in eyes, nose, throat, or unexplained respiratory distress.',
    ],
    before: [
      'Know if your residence or school is situated within an industrial special hazard zone.',
      'Keep plastic sheeting and duct tape accessible for rapid chemical shelter-in-place sealing.',
      'Have full-face or half-mask respirators with appropriate chemical cartridges ready.',
    ],
    during: [
      'If ordered to shelter in place: go inside immediately, close all doors, windows, and fireplace dampers.',
      'Shut off all HVAC air conditioning, ventilation fans, and furnace systems.',
      'Seal cracks around doors, windows, and electrical outlets with duct tape and plastic sheeting.',
      'If caught outside: move crosswind (perpendicular to wind direction) and seek uphill shelter.',
    ],
    after: [
      'Do not exit the sealed room until official all-clear broadcasts are issued.',
      'Ventilate the structure thoroughly once the toxic plume has completely dispersed.',
      'If exposed, remove all contaminated clothing into a sealed plastic bag and shower thoroughly with soap.',
    ],
    checklist: [
      'Duct tape and pre-measured heavy plastic sheeting (6 mil thickness)',
      'Clean towels and washcloths to soak in water for emergency mouth covering',
      'Sealed bottled water and packaged rations for minimum 48 hours',
      'Chemical-resistant nitrile gloves',
      'Battery-powered civil defense radio',
    ],
    attribution: 'Educational synthesis based on OSHA, EPA Chemical Safety Guidelines & Civil Defense Protocols.',
  },
};

export function getDisasterCurriculum(type?: string): DisasterGuidelineContent {
  const normalized = type?.toUpperCase() || 'EARTHQUAKE';
  return DISASTER_CURRICULUM[normalized] || DISASTER_CURRICULUM.EARTHQUAKE;
}
