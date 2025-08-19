const ExcelJS = require('exceljs');

async function parseExcelFile(filePath) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(1); // Get first worksheet
    
    if (!worksheet) {
      throw new Error('No worksheet found in the Excel file');
    }

    const data = [];
    const headers = [];
    
    // Get headers from first row
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value;
    });

    // Validate required columns
    const requiredColumns = ['Name', 'Phone', 'Email'];
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => 
        header && header.toString().toLowerCase().includes(col.toLowerCase())
      )
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Process data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData = {};
      let hasData = false;
      
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = cell.value;
          if (cell.value) hasData = true;
        }
      });
      
      // Only add rows that have some data
      if (hasData) {
        // Validate required fields
        if (rowData.Name && rowData.Email) {
          data.push({
            Name: rowData.Name.toString().trim(),
            Phone: rowData.Phone ? rowData.Phone.toString().trim() : '',
            Email: rowData.Email.toString().trim()
          });
        }
      }
    });

    if (data.length === 0) {
      throw new Error('No valid data rows found in the Excel file');
    }

    console.log(`Parsed ${data.length} records from Excel file`);
    return data;

  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

module.exports = {
  parseExcelFile
};