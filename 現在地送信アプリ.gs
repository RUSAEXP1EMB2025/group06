function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("addresses");
  const data = JSON.parse(e.postData.contents);

  const userId = data.userId;
  const location = data.location;

  const rowMap = {
    "Udc700373ca3950dcfd544ec807f3703a": 2,
    "U7e157826a621320d53b02d4155d6d280": 3,
    "Uae162b10584117d6f1ae39cf6034bf58": 4
  };

  const row = rowMap[userId];

  if (row) {
    sheet.getRange(row, 9).setValue(location);
    return ContentService.createTextOutput("OK");
  } else {
    return ContentService.createTextOutput("Unknown user ID");
  }
}