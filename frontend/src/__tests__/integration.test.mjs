import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..', '..');

describe('DisasterReady Route & Component Integrity Verification', () => {
  const routes = [
    // Tier 1: Public (11 routes)
    'src/app/page.tsx',
    'src/app/about/page.tsx',
    'src/app/awareness/page.tsx',
    'src/app/awareness/[id]/page.tsx',
    'src/app/alerts/page.tsx',
    'src/app/alerts/[id]/page.tsx',
    'src/app/events/page.tsx',
    'src/app/events/[id]/page.tsx',
    'src/app/resources/page.tsx',
    'src/app/login/page.tsx',
    'src/app/register/page.tsx',

    // Tier 2: Citizen Dashboard (11 routes)
    'src/app/citizen/dashboard/page.tsx',
    'src/app/citizen/alerts/page.tsx',
    'src/app/citizen/awareness/page.tsx',
    'src/app/citizen/map/page.tsx',
    'src/app/citizen/reports/page.tsx',
    'src/app/citizen/assistance/page.tsx',
    'src/app/citizen/events/page.tsx',
    'src/app/citizen/preparedness/page.tsx',
    'src/app/citizen/notifications/page.tsx',
    'src/app/citizen/simulations/page.tsx',
    'src/app/citizen/profile/page.tsx',

    // Tier 3: Authority Command Center (9 routes)
    'src/app/authority/dashboard/page.tsx',
    'src/app/authority/alerts/page.tsx',
    'src/app/authority/incidents/page.tsx',
    'src/app/authority/events/page.tsx',
    'src/app/authority/registrations/page.tsx',
    'src/app/authority/resources/page.tsx',
    'src/app/authority/disasters/page.tsx',
    'src/app/authority/notifications/page.tsx',
    'src/app/authority/profile/page.tsx',

    // Tier 4: Administrator Portal (10 routes)
    'src/app/admin/dashboard/page.tsx',
    'src/app/admin/disasters/page.tsx',
    'src/app/admin/alerts/page.tsx',
    'src/app/admin/incidents/page.tsx',
    'src/app/admin/events/page.tsx',
    'src/app/admin/resources/page.tsx',
    'src/app/admin/users/page.tsx',
    'src/app/admin/authorities/page.tsx',
    'src/app/admin/notifications/page.tsx',
    'src/app/admin/settings/page.tsx',
  ];

  test(`verifies all ${routes.length} pages exist in repository`, () => {
    assert.equal(routes.length, 41, 'Expected exactly 41 application routes');
    for (const route of routes) {
      const fullPath = path.join(frontendRoot, route);
      assert.ok(fs.existsSync(fullPath), `Missing required route component: ${route}`);
    }
  });

  test('verifies layout shells exist for citizen, authority, and admin portals', () => {
    const layouts = [
      'src/app/layout.tsx',
      'src/app/citizen/layout.tsx',
      'src/app/authority/layout.tsx',
      'src/app/admin/layout.tsx',
    ];
    for (const layout of layouts) {
      const fullPath = path.join(frontendRoot, layout);
      assert.ok(fs.existsSync(fullPath), `Missing layout shell: ${layout}`);
    }
  });
});

describe('Design System & Severity Badge Mapping', () => {
  // Logic mirror of getSeverityBadgeStyles
  function getSeverityBadgeStyles(severity) {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return { label: 'Critical', badge: 'bg-[#DC3545] text-white' };
      case 'HIGH':
        return { label: 'High', badge: 'bg-[#EA580C] text-white' };
      case 'MODERATE':
        return { label: 'Moderate', badge: 'bg-[#F59E0B] text-white' };
      case 'LOW':
      default:
        return { label: 'Low', badge: 'bg-[#16A34A] text-white' };
    }
  }

  test('maps CRITICAL severity to emergency red', () => {
    const style = getSeverityBadgeStyles('CRITICAL');
    assert.equal(style.label, 'Critical');
    assert.ok(style.badge.includes('#DC3545'));
  });

  test('maps HIGH severity to amber orange', () => {
    const style = getSeverityBadgeStyles('HIGH');
    assert.equal(style.label, 'High');
    assert.ok(style.badge.includes('#EA580C'));
  });

  test('maps MODERATE severity to warning amber', () => {
    const style = getSeverityBadgeStyles('MODERATE');
    assert.equal(style.label, 'Moderate');
    assert.ok(style.badge.includes('#F59E0B'));
  });

  test('maps LOW severity to success green', () => {
    const style = getSeverityBadgeStyles('LOW');
    assert.equal(style.label, 'Low');
    assert.ok(style.badge.includes('#16A34A'));
  });

  test('falls back safely to LOW for unknown severity', () => {
    const style = getSeverityBadgeStyles('UNKNOWN_LEVEL');
    assert.equal(style.label, 'Low');
  });
});

describe('Simulation Engine Architectural Boundary', () => {
  test('verifies simulation service definition matches spec', async () => {
    const serviceFile = path.join(frontendRoot, 'src/services/simulation.service.ts');
    const content = fs.readFileSync(serviceFile, 'utf-8');

    assert.ok(content.includes('sim-eq-01'), 'Earthquake scenario ID missing');
    assert.ok(content.includes('sim-fl-02'), 'Flood scenario ID missing');
    assert.ok(content.includes('sim-wf-03'), 'Wildfire scenario ID missing');
    assert.ok(content.includes('isUnityClientConnected'), 'isUnityClientConnected probe missing');
  });
});

describe('Disaster Curriculum Educational Framework', () => {
  test('verifies disaster curriculum contains standard guidelines', async () => {
    const curriculumFile = path.join(frontendRoot, 'src/lib/disasterCurriculum.ts');
    const content = fs.readFileSync(curriculumFile, 'utf-8');

    const expectedTypes = ['EARTHQUAKE', 'FLOOD', 'CYCLONE', 'TSUNAMI', 'WILDFIRE', 'LANDSLIDE', 'INDUSTRIAL_ACCIDENT'];
    for (const type of expectedTypes) {
      assert.ok(content.includes(type), `Disaster curriculum missing type: ${type}`);
    }
  });
});

describe('Role-Based Access Control Boundaries', () => {
  test('verifies admin layout enforces ADMIN role', () => {
    const adminLayout = fs.readFileSync(path.join(frontendRoot, 'src/app/admin/layout.tsx'), 'utf-8');
    assert.ok(adminLayout.includes("requiredRole={['ADMIN']}"), 'Admin layout does not enforce strictly ADMIN role');
  });

  test('verifies authority layout allows AUTHORITY and ADMIN', () => {
    const authLayout = fs.readFileSync(path.join(frontendRoot, 'src/app/authority/layout.tsx'), 'utf-8');
    assert.ok(authLayout.includes("requiredRole={['AUTHORITY', 'ADMIN']}"), 'Authority layout missing RBAC guard');
  });

  test('verifies citizen layout allows CITIZEN and ADMIN', () => {
    const citizenLayout = fs.readFileSync(path.join(frontendRoot, 'src/app/citizen/layout.tsx'), 'utf-8');
    assert.ok(citizenLayout.includes("requiredRole={['CITIZEN', 'ADMIN']}"), 'Citizen layout missing RBAC guard');
  });
});

describe('Admin Layout Core API Health Indicator Verification', () => {
  // Mirror of health resolution logic implemented in AdminLayout
  async function resolveHealthStatus(mockApiCall) {
    try {
      const res = await mockApiCall();
      const rawData = res?.data?.data ?? res?.data;
      const status = rawData?.status;
      if (typeof status === 'string' && status.trim().length > 0) {
        return {
          ...(typeof rawData === 'object' && rawData !== null ? rawData : {}),
          status: status.trim().toUpperCase(),
        };
      }
      return { status: 'UNKNOWN' };
    } catch {
      return { status: 'DOWN' };
    }
  }

  function getHealthIndicator(status) {
    switch (status) {
      case 'UP':
        return {
          color: 'green',
          dotClass: 'bg-emerald-500',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
        };
      case 'DOWN':
        return {
          color: 'red',
          dotClass: 'bg-red-500',
          badgeClass: 'bg-red-500/20 text-red-300 border-red-400/30',
        };
      case 'UNKNOWN':
      default:
        return {
          color: 'grey',
          dotClass: 'bg-slate-400',
          badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
        };
    }
  }

  test('returns actual backend health status when response is valid', async () => {
    const validResponse = {
      data: {
        success: true,
        data: {
          status: 'UP',
          uptime: 3600,
          version: '1.0.0',
        },
      },
    };
    const result = await resolveHealthStatus(async () => validResponse);
    assert.equal(result.status, 'UP');
    assert.equal(result.uptime, 3600);
  });

  test('returns actual status for non-UP valid statuses (e.g. DEGRADED)', async () => {
    const degradedResponse = {
      data: {
        status: 'DEGRADED',
      },
    };
    const result = await resolveHealthStatus(async () => degradedResponse);
    assert.equal(result.status, 'DEGRADED');
  });

  test('returns status DOWN when API request fails or throws error', async () => {
    const result = await resolveHealthStatus(async () => {
      throw new Error('Connection refused: ECONNREFUSED 127.0.0.1:5001');
    });
    assert.deepEqual(result, { status: 'DOWN' });
  });

  test('returns status UNKNOWN when response is missing, null, or has no valid status', async () => {
    assert.deepEqual(await resolveHealthStatus(async () => null), { status: 'UNKNOWN' });
    assert.deepEqual(await resolveHealthStatus(async () => ({ data: null })), { status: 'UNKNOWN' });
    assert.deepEqual(await resolveHealthStatus(async () => ({ data: {} })), { status: 'UNKNOWN' });
    assert.deepEqual(await resolveHealthStatus(async () => ({ data: { data: {} } })), { status: 'UNKNOWN' });
    assert.deepEqual(await resolveHealthStatus(async () => ({ data: { status: 12345 } })), { status: 'UNKNOWN' });
  });

  test('maps visual indicators correctly: UP -> green, DOWN -> red, UNKNOWN -> grey', () => {
    const upIndicator = getHealthIndicator('UP');
    assert.equal(upIndicator.color, 'green');
    assert.ok(upIndicator.dotClass.includes('emerald'));
    assert.ok(upIndicator.badgeClass.includes('emerald'));

    const downIndicator = getHealthIndicator('DOWN');
    assert.equal(downIndicator.color, 'red');
    assert.ok(downIndicator.dotClass.includes('red'));
    assert.ok(downIndicator.badgeClass.includes('red'));

    const unknownIndicator = getHealthIndicator('UNKNOWN');
    assert.equal(unknownIndicator.color, 'grey');
    assert.ok(unknownIndicator.dotClass.includes('slate'));
    assert.ok(unknownIndicator.badgeClass.includes('slate'));
  });

  test('verifies admin layout source does not default to UP on error or in UI', () => {
    const layoutContent = fs.readFileSync(path.join(frontendRoot, 'src/app/admin/layout.tsx'), 'utf-8');

    // Should NOT have catch block returning { status: 'UP' }
    assert.ok(!layoutContent.includes("catch {\n        return { status: 'UP' };\n      }"), 'Catch block still returns UP');

    // Should have catch block returning { status: 'DOWN' }
    assert.ok(layoutContent.includes("return { status: 'DOWN' }"), 'Catch block does not return DOWN');

    // Should return UNKNOWN on invalid response
    assert.ok(layoutContent.includes("return { status: 'UNKNOWN' }"), 'Invalid response does not return UNKNOWN');

    // Should not default UI status to 'UP'
    assert.ok(!layoutContent.includes("Core API: {healthData?.status || 'UP'}"), 'UI still has hardcoded UP fallback');
    assert.ok(layoutContent.includes("Core API: {healthStatus}"), 'UI does not display healthStatus');
  });
});

describe('Citizen Simulations UnityPlayer Integration Verification', () => {
  const simPageFile = path.join(frontendRoot, 'src/app/citizen/simulations/page.tsx');
  const unityPlayerFile = path.join(frontendRoot, 'src/components/UnityPlayer.tsx');

  test('verifies UnityPlayer component is reusable with default props and keyboard/fullscreen permissions', () => {
    assert.ok(fs.existsSync(unityPlayerFile), 'UnityPlayer.tsx does not exist');
    const playerContent = fs.readFileSync(unityPlayerFile, 'utf-8');
    assert.ok(playerContent.includes("src = '/unity/index.html'") || playerContent.includes('src = "/unity/index.html"'), 'Missing default iframe src /unity/index.html');
    assert.ok(playerContent.includes("title = 'DisasterReady Earthquake Simulation'") || playerContent.includes('title = "DisasterReady Earthquake Simulation"'), 'Missing default iframe title');
    assert.ok(playerContent.includes('src={src}'), 'UnityPlayer iframe does not bind dynamic src prop');
    assert.ok(playerContent.includes('title={title}'), 'UnityPlayer iframe does not bind dynamic title prop');
    assert.ok(playerContent.includes('fullscreen'), 'Missing allow fullscreen attribute');
    assert.ok(playerContent.includes('pointer-lock'), 'Missing allow pointer-lock attribute');
    assert.ok(playerContent.includes('allowFullScreen'), 'Missing allowFullScreen attribute');
    assert.ok(playerContent.includes('h-[650px]'), 'Missing 650px height for complete canvas and footer visibility');
    assert.ok(playerContent.includes('iframeRef'), 'Missing iframe focus ref management');
  });

  test('verifies simulations page tracks scenarios by exact IDs and filters out Wildfire', () => {
    assert.ok(fs.existsSync(simPageFile), 'simulations/page.tsx does not exist');
    const pageContent = fs.readFileSync(simPageFile, 'utf-8');

    assert.ok(pageContent.includes('UnityPlayer'), 'simulations/page.tsx does not import UnityPlayer');
    assert.ok(pageContent.includes("activeSandboxScenario?.id === 'sim-eq-01'"), 'Missing sim-eq-01 Earthquake ID check');
    assert.ok(pageContent.includes("activeSandboxScenario?.id === 'sim-fl-02'"), 'Missing sim-fl-02 Flash Flood ID check');
    assert.ok(pageContent.includes("sc.id !== 'sim-wf-03'"), 'Wildfire scenario sim-wf-03 is not filtered out');
    assert.ok(
      pageContent.includes("sc.disasterType !== 'WILDFIRE'"),
      'Wildfire disaster type is not filtered out'
    );
    assert.ok(!pageContent.includes('isWildfire'), 'Obsolete isWildfire logic should be removed');
    assert.ok(pageContent.includes('isPlayable'), 'Missing isPlayable conditional helper');
  });

  test('verifies Earthquake and Flash Flood launch UnityPlayer and Wildfire is completely excluded', () => {
    const pageContent = fs.readFileSync(simPageFile, 'utf-8');

    // Earthquake mounts UnityPlayer with /unity/index.html
    assert.ok(pageContent.includes('src="/unity/index.html"'), 'Earthquake does not mount UnityPlayer with /unity/index.html');
    assert.ok(pageContent.includes('title="DisasterReady Earthquake Simulation"'), 'Earthquake does not pass Earthquake Simulation title');

    // Flash Flood mounts UnityPlayer with /unity-flood/index.html
    assert.ok(pageContent.includes('src="/unity-flood/index.html"'), 'Flash Flood does not mount UnityPlayer with /unity-flood/index.html');
    assert.ok(pageContent.includes('title="DisasterReady Flash Flood Simulation"'), 'Flash Flood does not pass Flash Flood Simulation title');

    // Modal descriptions
    assert.ok(pageContent.includes("'Interactive Earthquake Simulation'"), 'Missing Interactive Earthquake Simulation description');
    assert.ok(pageContent.includes("'Interactive Flash Flood Simulation'"), 'Missing Interactive Flash Flood Simulation description');

    // Wildfire placeholder & status removed
    assert.ok(!pageContent.includes('Status: Coming Soon'), 'Wildfire Coming Soon status indicator should be removed');
    assert.ok(!pageContent.includes('Wildfire: Rural Perimeter Defense & Evacuation'), 'Wildfire scenario details should be excluded');
    assert.ok(pageContent.includes('max-w-5xl'), 'Missing max-w-5xl sizing for playable simulations');
  });
});
