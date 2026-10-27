import bcrypt from 'bcryptjs';

const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
const hashedUserPassword = bcrypt.hashSync('user123', 10);

export const initialUsers = [
  {
    _id: '640000000000000000000001',
    name: 'Lab Administrator',
    email: 'admin@lab.edu',
    password: hashedAdminPassword,
    role: 'admin',
  },
  {
    _id: '640000000000000000000002',
    name: 'Laya M S',
    email: 'user@lab.edu',
    password: hashedUserPassword,
    role: 'user',
  },
  {
    _id: '640000000000000000000003',
    name: 'Dr. Rahul Sharma',
    email: 'rahul@college.edu',
    password: hashedUserPassword,
    role: 'user',
  },
];

export const initialInstruments = [
  {
    _id: '650000000000000000000001',
    name: 'UV-Visible Spectrophotometer',
    category: 'Spectroscopy',
    location: 'Chemistry Laboratory',
    description:
      'High-precision dual-beam spectrophotometer for quantitative chemical analysis of samples across UV and visible light wavelengths.',
    status: 'Available',
  },
  {
    _id: '650000000000000000000002',
    name: 'Centrifuge',
    category: 'Laboratory Equipment',
    location: 'Biotechnology Laboratory',
    description:
      'High-speed refrigerated centrifuge suitable for molecular biology sample separation, cell pelleting, and density gradient isolation.',
    status: 'Available',
  },
  {
    _id: '650000000000000000000003',
    name: 'PCR Machine',
    category: 'Molecular Biology',
    location: 'Biotechnology Laboratory',
    description:
      'Thermal cycler for targeted DNA and RNA sequence amplification featuring fast ramp rates and heated lid technology.',
    status: 'Available',
  },
  {
    _id: '650000000000000000000004',
    name: 'Digital Microscope',
    category: 'Microscopy',
    location: 'Research Laboratory',
    description:
      'Compound digital optical microscope equipped with high-resolution digital imaging sensor and live sample measurement tools.',
    status: 'Available',
  },
  {
    _id: '650000000000000000000005',
    name: 'HPLC',
    category: 'Chromatography',
    location: 'Central Instrumentation Laboratory',
    description:
      'High-Performance Liquid Chromatography system with binary pump and photodiode array detector for biomolecule purification.',
    status: 'Available',
  },
  {
    _id: '650000000000000000000006',
    name: 'Analytical Balance',
    category: 'Measurement',
    location: 'Chemistry Laboratory',
    description:
      'Precision electronic analytical balance with 0.1 mg sensitivity, internal calibration, and draft glass chamber.',
    status: 'Available',
  },
  {
    _id: '650000000000000000000007',
    name: 'FTIR Spectrometer',
    category: 'Spectroscopy',
    location: 'Central Instrumentation Laboratory',
    description:
      'Fourier-Transform Infrared Spectrometer with ATR diamond module for functional group analysis and chemical fingerprinting.',
    status: 'Maintenance',
  },
];

export const initialBookings = [
  {
    _id: '660000000000000000000001',
    userId: '640000000000000000000002', // Laya M S
    instrumentId: '650000000000000000000003', // PCR Machine
    date: '2026-10-10',
    startTime: '10:00',
    endTime: '12:00',
    purpose: 'DNA sample amplification for gene expression analysis',
    status: 'Confirmed',
    actualStartTime: null,
    actualEndTime: null,
    actualUsageDuration: null,
  },
  {
    _id: '660000000000000000000002',
    userId: '640000000000000000000003', // Dr. Rahul Sharma
    instrumentId: '650000000000000000000005', // HPLC
    date: '2026-10-09',
    startTime: '13:00',
    endTime: '16:00',
    purpose: 'Purification of synthetic organic compound fraction',
    status: 'In Progress',
    actualStartTime: new Date('2026-10-09T13:05:00').toISOString(),
    actualEndTime: null,
    actualUsageDuration: null,
  },
  {
    _id: '660000000000000000000003',
    userId: '640000000000000000000002', // Laya M S
    instrumentId: '650000000000000000000001', // UV-Visible
    date: '2026-10-08',
    startTime: '09:00',
    endTime: '11:00',
    purpose: 'Beer-Lambert law verification and absorbance testing',
    status: 'Completed',
    actualStartTime: new Date('2026-10-08T09:08:00').toISOString(),
    actualEndTime: new Date('2026-10-08T10:48:00').toISOString(),
    actualUsageDuration: 100, // 1 hr 40 min
  },
  {
    _id: '660000000000000000000004',
    userId: '640000000000000000000003', // Dr. Rahul Sharma
    instrumentId: '650000000000000000000002', // Centrifuge
    date: '2026-10-08',
    startTime: '14:00',
    endTime: '16:30',
    purpose: 'Harvesting bacterial pellet at 12,000 RPM',
    status: 'Completed',
    actualStartTime: new Date('2026-10-08T14:10:00').toISOString(),
    actualEndTime: new Date('2026-10-08T16:20:00').toISOString(),
    actualUsageDuration: 130, // 2 hrs 10 min
  },
  {
    _id: '660000000000000000000005',
    userId: '640000000000000000000002', // Laya M S
    instrumentId: '650000000000000000000004', // Digital Microscope
    date: '2026-10-12',
    startTime: '11:00',
    endTime: '13:00',
    purpose: 'Morphological examination of plant cell tissue slides',
    status: 'Confirmed',
    actualStartTime: null,
    actualEndTime: null,
    actualUsageDuration: null,
  },
];
