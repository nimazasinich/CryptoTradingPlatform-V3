/**
 * Table Export Utilities
 * Export any data table to CSV, JSON, or Excel format
 */

export type ExportFormat = 'csv' | 'json' | 'excel';

export interface ExportOptions {
  filename?: string;
  format?: ExportFormat;
  includeHeaders?: boolean;
  dateFormat?: string;
}

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: any[], filename: string = 'export'): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers
    headers.join(','),
    // Rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

/**
 * Export data to JSON format
 */
export const exportToJSON = (data: any[], filename: string = 'export'): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
};

/**
 * Export data to Excel-compatible format (CSV with UTF-8 BOM)
 */
export const exportToExcel = (data: any[], filename: string = 'export'): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  
  // Create CSV content with proper formatting for Excel
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') {
          // Excel-compatible escaping
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'boolean') {
          return value ? 'TRUE' : 'FALSE';
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        return JSON.stringify(value);
      }).join(',')
    )
  ].join('\r\n');

  // Add UTF-8 BOM for Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

/**
 * Helper function to trigger download
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Main export function with format selection
 */
export const exportTable = (
  data: any[], 
  options: ExportOptions = {}
): void => {
  const {
    filename = `export_${new Date().toISOString().split('T')[0]}`,
    format = 'csv',
    includeHeaders = true
  } = options;

  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Filter out unwanted fields if needed
  const cleanedData = data.map(row => {
    const cleaned: any = {};
    for (const key in row) {
      if (key !== '__typename' && key !== 'id' && !key.startsWith('_')) {
        cleaned[key] = row[key];
      }
    }
    return cleaned;
  });

  switch (format) {
    case 'json':
      exportToJSON(cleanedData, filename);
      break;
    case 'excel':
      exportToExcel(cleanedData, filename);
      break;
    case 'csv':
    default:
      exportToCSV(cleanedData, filename);
      break;
  }
};

/**
 * Format data for export (clean up and format values)
 */
export const formatDataForExport = (data: any[]): any[] => {
  return data.map(row => {
    const formatted: any = {};
    
    for (const key in row) {
      const value = row[key];
      
      // Format dates
      if (value instanceof Date) {
        formatted[key] = value.toISOString();
      }
      // Format numbers
      else if (typeof value === 'number') {
        formatted[key] = parseFloat(value.toFixed(8));
      }
      // Format booleans
      else if (typeof value === 'boolean') {
        formatted[key] = value ? 'Yes' : 'No';
      }
      // Keep strings and others as-is
      else {
        formatted[key] = value;
      }
    }
    
    return formatted;
  });
};

/**
 * Copy table data to clipboard
 */
export const copyToClipboard = async (data: any[] | string): Promise<void> => {
  let textToCopy: string;

  // If data is already a string, use it directly
  if (typeof data === 'string') {
    textToCopy = data;
  } 
  // If data is an array, convert to TSV format
  else if (Array.isArray(data)) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    textToCopy = [
      headers.join('\t'),
      ...data.map(row => 
        headers.map(h => row[h]).join('\t')
      )
    ].join('\n');
  } 
  // Invalid input
  else {
    console.error('Invalid data type for copyToClipboard');
    return;
  }

  try {
    await navigator.clipboard.writeText(textToCopy);
    console.log('Table data copied to clipboard');
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw error;
  }
};
