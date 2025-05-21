function getSheet(name) {
  const SPREADSHEET_ID = '15F67qgA8o3QQ-UygT-kZLwmwCQsOP3BKBTIoqBvw9Co'
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    throw new Error('シートが見つかりません');
  }

  return sheet;
}

function getLastData(name) {
  return getSheet(name).getDataRange().getValues().length;
}
