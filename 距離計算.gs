function calculate2kmRange() {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('addresses');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('シート「addresses」が見つかりません。');
    return;
  }

  const lastRow = sheet.getLastRow();

  // C列（緯度）とD列（経度）からデータ取得（2行目以降）
  const longitudes = sheet.getRange(`D2:D${lastRow}`).getValues();
  const latitudes = sheet.getRange(`C2:C${lastRow}`).getValues();

  const result = [];

  for (let i = 0; i < latitudes.length; i++) {
    const lat = parseFloat(latitudes[i][0]);
    const lon = parseFloat(longitudes[i][0]);

    if (isNaN(lat) || isNaN(lon)) {
      result.push(["Invalid", "Invalid", "Invalid", "Invalid"]);
      continue;
    }

    // 緯度差：約2km ≒ 0.01796度
    const deltaLat = 2.0 / 111.32;

    // 経度差：2km ÷ (111.32 × cos(緯度))
    const deltaLon = 2.0 / (111.32 * Math.cos(lat * Math.PI / 180));

    const minLat = lat - deltaLat;
    const maxLat = lat + deltaLat;
    const minLon = lon - deltaLon;
    const maxLon = lon + deltaLon;

    result.push([minLat, maxLat, minLon, maxLon]);
  }


  sheet.getRange(2, 5, result.length, 4).setValues(result);
}

