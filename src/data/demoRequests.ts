import type { RepairEstimate, RepairRequest } from '../types/repair';

export type DemoPrefillData = {
  seekerRequests: RepairRequest[];
  openRequests: RepairRequest[];
  myAssignments: RepairRequest[];
};

export const demoPrefilledData: DemoPrefillData = {
  seekerRequests: [
    {
      id: 'demo-seeker-1',
      ownerId: 'demo-user',
      ownerName: 'Demo Neighbor',
      ownerContact: 'demo@repair.local',
      itemName: 'Kitchen faucet',
      issueDescription: 'Handle feels loose and drips overnight unless we jiggle it just right.',
      additionalDetails: 'Moen 6400 model, last cartridge swap 2022.',
      location: 'Inner Sunset · 8th & Judah',
      urgency: 'medium',
      status: 'claimed',
      fixerName: 'Riley from Fixer Collective',
      estimateSummary: 'Likely a worn cartridge and loose set screw—tighten hardware and replace cartridge.',
      estimatedCost: '$18-$35 in parts + 30 min labor',
      estimatedHours: '30-45 minutes',
      recommendedSteps: [
        'Shut off water and remove handle cap/set screw',
        'Inspect and replace cartridge + O-ring',
        'Re-seat handle, apply thread locker, and test for leaks',
      ],
      materialsList: ['2.5mm hex key', 'Moen 1225 cartridge', 'Plumber tape'],
      estimateStatus: 'complete',
    },
    {
      id: 'demo-seeker-2',
      ownerId: 'demo-user',
      ownerName: 'Demo Neighbor',
      ownerContact: 'demo@repair.local',
      itemName: 'Cargo bike headlight',
      issueDescription: 'Supernova light flickers when we hit bumps on Valencia.',
      additionalDetails: 'Bosch e-assist harness replaced last fall.',
      location: 'Mission Dolores · 18th & Church',
      urgency: 'high',
      status: 'open',
      estimateSummary: 'Likely ground wire fatigue or corrosion inside DC connector.',
      estimatedCost: '$10-$20 for connectors + heat shrink',
      estimatedHours: '45 minutes',
      recommendedSteps: [
        'Test continuity from battery to light under vibration',
        'Open connector, clean contacts, and re-crimp ground wire',
        'Add dielectric grease and heat-shrink to secure',
      ],
      materialsList: ['Multimeter', '18 AWG wire', 'Heat shrink', 'Dielectric grease'],
      estimateStatus: 'complete',
    },
  ],
  openRequests: [
    {
      id: 'demo-open-1',
      ownerId: 'neighbor-lila',
      ownerName: 'Lila N.',
      ownerContact: 'lila@example.com',
      itemName: 'Record player tonearm',
      issueDescription: 'Tonearm drifts inward and skips at the start of every record.',
      location: 'SoMa · 5th & Brannan',
      urgency: 'low',
      status: 'open',
      estimateSummary: 'Balance counterweight, adjust anti-skate, and lubricate pivot.',
      estimatedCost: '$0-$15 for lube + stylus brush',
      estimatedHours: '40 minutes',
      recommendedSteps: [
        'Level the turntable and rebalance counterweight',
        'Dial in anti-skate using test record',
        'Clean bearings and apply a drop of light oil',
      ],
      materialsList: ['Stylus scale', 'Light machine oil', 'Microfiber cloth'],
      estimateStatus: 'complete',
    },
    {
      id: 'demo-open-2',
      ownerId: 'neighbor-miles',
      ownerName: 'Miles O.',
      ownerContact: 'miles@example.com',
      itemName: 'Window sash cord',
      issueDescription: 'Historic window no longer stays open—cord snapped on one side.',
      additionalDetails: 'South-facing bedroom window, easy ladder access.',
      location: 'Alamo Square · Grove & Pierce',
      urgency: 'medium',
      status: 'open',
      estimateSummary: 'Replace sash cords and inspect pulleys for wear.',
      estimatedCost: '$25-$40 for cord + 60 min labor',
      estimatedHours: '1-1.5 hours',
      recommendedSteps: [
        'Remove stops and carefully free the sash',
        'Thread new cotton cord through pulley and tie sash knot',
        'Balance weights, reinstall, and test travel',
      ],
      materialsList: ['#8 cotton sash cord', 'Putty knife', 'Finish nails'],
      estimateStatus: 'complete',
    },
  ],
  myAssignments: [
    {
      id: 'demo-mine-1',
      ownerId: 'neighbor-jay',
      ownerName: 'Jay P.',
      ownerContact: 'jay@example.com',
      itemName: 'Awning crank',
      issueDescription: 'Crank skips teeth halfway out so awning won’t retract fully.',
      location: 'Bernal Heights · Cortland Ave.',
      urgency: 'medium',
      status: 'claimed',
      fixerId: 'demo-user',
      fixerName: 'Demo Neighbor',
      estimateSummary: 'Likely stripped gearbox—clean gears and add missing set screw.',
      estimatedCost: '$12 for hardware + 45 min labor',
      estimatedHours: '45-60 minutes',
      recommendedSteps: [
        'Remove crank cover and inspect gear teeth',
        'Add stainless set screw with thread locker',
        'Grease gears and cycle awning twice',
      ],
      materialsList: ['3mm hex key', 'Lithium grease', 'Stainless set screw'],
      estimateStatus: 'complete',
    },
  ],
};

export const demoEstimate: RepairEstimate = {
  estimateSummary: 'Likely loose fastener and light corrosion—snug hardware and refresh wiring.',
  estimatedCost: '$20-$35 for parts',
  estimatedHours: '45 minutes',
  recommendedSteps: [
    'Inspect connectors and trim damaged wire',
    'Re-crimp using waterproof butt splice',
    'Secure harness, add dielectric grease, and test under vibration',
  ],
  materialsList: ['Butt splice connectors', 'Heat gun', 'Dielectric grease', 'Zip ties'],
};
