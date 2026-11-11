/**
 * Simulation Integration Boundary
 *
 * NOTE ON INTEGRATION ARCHITECTURE:
 * The 3D disaster simulation engine is built in Unity (C#) and exported to WebGL.
 * It is developed independently by the Unity Developer teammate (see TEAM_RESPONSIBILITIES.md).
 * Backend endpoints for Module 11 (/api/v1/simulations/*) are marked "Pending" in the
 * development roadmap.
 *
 * This boundary defines the integration interface without fabricating mock API endpoints.
 */

export interface SimulationScenarioDefinition {
  id: string;
  title: string;
  disasterType: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedMinutes: number;
  description: string;
  keySkills: string[];
}

export const KNOWN_SCENARIOS: SimulationScenarioDefinition[] = [
  {
    id: 'sim-eq-01',
    title: 'Earthquake: Multi-Story Office Evacuation',
    disasterType: 'EARTHQUAKE',
    difficulty: 'BEGINNER',
    estimatedMinutes: 10,
    description:
      'Practice realistic Drop, Cover, and Hold On mechanics during sudden tremor shaking, followed by safe structural stairwell evacuation, aftershock avoidance, and hazard identification.',
    keySkills: ['Drop, Cover & Hold', 'Hazard Spotting', 'Stairwell Evacuation', 'First Aid Triage'],
  },
  {
    id: 'sim-fl-02',
    title: 'Flash Flood: Suburban Inundation Escape',
    disasterType: 'FLOOD',
    difficulty: 'INTERMEDIATE',
    estimatedMinutes: 8,
    description:
      'Navigate rising floodwaters in a neighborhood setting. Make critical timing decisions on when to evacuate, choose high-ground escape routes, and avoid electrified waters.',
    keySkills: ['High-Ground Navigation', 'Electrical Hazard Avoidance', 'Emergency Pack Handling'],
  },
  {
    id: 'sim-wf-03',
    title: 'Wildfire: Rural Perimeter Defense & Evacuation',
    disasterType: 'WILDFIRE',
    difficulty: 'ADVANCED',
    estimatedMinutes: 12,
    description:
      'Manage high-wind wildfire encroaching on a residential perimeter. Clear defensible space, prep structures with ember guards, and execute vehicle evacuation before routes close.',
    keySkills: ['Defensible Space Prep', 'Smoke Protection (N95)', 'Conveyance Planning'],
  },
];

export const simulationService = {
  getStaticScenarios(): SimulationScenarioDefinition[] {
    return KNOWN_SCENARIOS;
  },

  isUnityClientConnected(): boolean {
    return false;
  },
};

export default simulationService;
