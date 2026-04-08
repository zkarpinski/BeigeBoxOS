/** Mock lookup data replacing the Access DB tables from the original VB.NET app. */

export const VENDORS = ['National Grid', 'IQOR', 'NCI', 'LI Call Center'];
export const REGIONS = ['Northeast', 'Southeast', 'Northwest', 'Southwest', 'Central'];

export interface Category {
  id: number;
  name: string;
}

export interface ErrorFunction {
  id: number;
  categoryId: number;
  name: string;
}

export interface ErrorDetail {
  id: number;
  functionId: number;
  code: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Billing' },
  { id: 2, name: 'Technical' },
  { id: 3, name: 'Account Management' },
  { id: 4, name: 'System' },
];

export const FUNCTIONS: ErrorFunction[] = [
  { id: 1,  categoryId: 1, name: 'Payment Processing' },
  { id: 2,  categoryId: 1, name: 'Invoice Generation' },
  { id: 3,  categoryId: 1, name: 'Credit Adjustment' },
  { id: 4,  categoryId: 2, name: 'Connectivity' },
  { id: 5,  categoryId: 2, name: 'Hardware Failure' },
  { id: 6,  categoryId: 2, name: 'Software Error' },
  { id: 7,  categoryId: 3, name: 'Account Update' },
  { id: 8,  categoryId: 3, name: 'Password Reset' },
  { id: 9,  categoryId: 3, name: 'Profile Management' },
  { id: 10, categoryId: 4, name: 'Database Error' },
  { id: 11, categoryId: 4, name: 'Network Timeout' },
  { id: 12, categoryId: 4, name: 'Authentication Failure' },
];

export const ERROR_DETAILS: ErrorDetail[] = [
  // Payment Processing
  { id: 1,  functionId: 1,  code: 'PAY-001', description: 'Payment declined' },
  { id: 2,  functionId: 1,  code: 'PAY-002', description: 'Duplicate transaction' },
  { id: 3,  functionId: 1,  code: 'PAY-003', description: 'Invalid card number' },
  // Invoice Generation
  { id: 4,  functionId: 2,  code: 'INV-001', description: 'Invoice not generated' },
  { id: 5,  functionId: 2,  code: 'INV-002', description: 'Incorrect amount' },
  // Credit Adjustment
  { id: 6,  functionId: 3,  code: 'CRD-001', description: 'Credit not applied' },
  { id: 7,  functionId: 3,  code: 'CRD-002', description: 'Adjustment out of range' },
  // Connectivity
  { id: 8,  functionId: 4,  code: 'CON-001', description: 'No internet access' },
  { id: 9,  functionId: 4,  code: 'CON-002', description: 'VPN failure' },
  { id: 10, functionId: 4,  code: 'CON-003', description: 'DNS resolution error' },
  // Hardware Failure
  { id: 11, functionId: 5,  code: 'HW-001',  description: 'Printer offline' },
  { id: 12, functionId: 5,  code: 'HW-002',  description: 'Scanner not detected' },
  // Software Error
  { id: 13, functionId: 6,  code: 'SW-001',  description: 'Application crash' },
  { id: 14, functionId: 6,  code: 'SW-002',  description: 'Unhandled exception' },
  { id: 15, functionId: 6,  code: 'SW-003',  description: 'Missing dependency' },
  // Account Update
  { id: 16, functionId: 7,  code: 'ACC-001', description: 'Address not saved' },
  { id: 17, functionId: 7,  code: 'ACC-002', description: 'Phone number invalid' },
  // Password Reset
  { id: 18, functionId: 8,  code: 'PWD-001', description: 'Reset email not sent' },
  { id: 19, functionId: 8,  code: 'PWD-002', description: 'Token expired' },
  // Profile Management
  { id: 20, functionId: 9,  code: 'PRF-001', description: 'Photo upload failed' },
  { id: 21, functionId: 9,  code: 'PRF-002', description: 'Preferences not saved' },
  // Database Error
  { id: 22, functionId: 10, code: 'DB-001',  description: 'Connection timeout' },
  { id: 23, functionId: 10, code: 'DB-002',  description: 'Query failed' },
  { id: 24, functionId: 10, code: 'DB-003',  description: 'Deadlock detected' },
  // Network Timeout
  { id: 25, functionId: 11, code: 'NET-001', description: 'Request timed out' },
  { id: 26, functionId: 11, code: 'NET-002', description: 'Connection refused' },
  // Authentication Failure
  { id: 27, functionId: 12, code: 'AUTH-001', description: 'Invalid credentials' },
  { id: 28, functionId: 12, code: 'AUTH-002', description: 'Session expired' },
  { id: 29, functionId: 12, code: 'AUTH-003', description: 'Account locked' },
];
