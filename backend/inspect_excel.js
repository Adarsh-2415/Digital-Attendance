import xlsx from 'xlsx';

try {
  const workbook = xlsx.readFile('C:\\Users\\Dell\\Desktop\\Details.xlsx');
  console.log('Sheets found:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(`\n--- Sheet: ${sheetName} ---`);
    if (data.length > 0) {
      console.log('First row keys:', Object.keys(data[0]));
      console.log('First row data:', data[0]);
    } else {
      console.log('Empty sheet');
    }
  });
} catch (error) {
  console.error('Error reading Excel file:', error);
}
