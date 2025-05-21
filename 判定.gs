function checkLocationInRange() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rangeSheet = ss.getSheetByName('addresses');

  const otherSpreadsheetId = '15F67qgA8o3QQ-UygT-kZLwmwCQsOP3BKBTIoqBvw9Co';
  const otherSpreadsheet = SpreadsheetApp.openById(otherSpreadsheetId);
  const nowSheet = otherSpreadsheet.getSheetByName('now');

  // 緯度列の実データ数から行数取得
  const latColumn = nowSheet.getRange("C2:C").getValues();
  const numRows = latColumn.filter(row => row[0] !== "").length;

  const nowData = nowSheet.getRange(2, 3, numRows, 2).getValues(); // C:D列（緯度・経度）
  const rangeData = rangeSheet.getRange(2, 5, rangeSheet.getLastRow() - 1, 4).getValues(); // F〜I列

  const results = [];

  for (let i = 0; i < nowData.length; i++) {
    const lon = parseFloat(nowData[i][0]); // 緯度（C）
    const lat = parseFloat(nowData[i][1]); // 経度（D）

    let isInRange = false;

    for (let j = 0; j < rangeData.length; j++) {
      const lon1 = parseFloat(rangeData[j][0]); // F列
      const lon2 = parseFloat(rangeData[j][1]); // G列
      const lat1 = parseFloat(rangeData[j][2]); // H列
      const lat2 = parseFloat(rangeData[j][3]); // I列

      const lonMin = Math.min(lon1, lon2);
      const lonMax = Math.max(lon1, lon2);
      const latMin = Math.min(lat1, lat2);
      const latMax = Math.max(lat1, lat2);

      if (
        !isNaN(lat) && !isNaN(lon) &&
        lat >= latMin && lat <= latMax &&
        lon >= lonMin && lon <= lonMax
      ) {
        isInRange = true;
        break;
      }
    }

    results.push([isInRange ? "IN" : "OUT"]);
  }

  nowSheet.getRange(2, 5, results.length, 1).setValues(results);
}
