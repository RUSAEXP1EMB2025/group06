function doPost(e) {
  // iPhone（ショートカット）から送られてきた位置情報を取得（住所）
  var params = JSON.parse(e.postData.getDataAsString());
  var locationData = params.location.value; // 住所を取得
  // ショートカットに返すメッセージを格納する為の変数
  var result = {};
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  // 住所が送られてきた場合
  if (locationData){
    // 住所から緯度経度を取得
    var geoData = geocodeWithOpenCage(locationData);
    
    if (geoData.lat && geoData.lng) {
      result = {
        "success" : {
          "message" : "スプレッドシートへの記録が完了しました"
        }
      };
      // 位置情報（住所）と緯度経度をスプレッドシートに記録する
      // iPhoneから来た住所を now に記録
      addLog(locationData, geoData);

      // addresses シートの B2 から緯度経度を更新（別用途）
      updateGeocodeFromSheetAddress();

    } else {
      result = {
        "error": {
          "message": "住所から緯度経度が取得できませんでした"
        }
      };
    }
  } else {
    result = {
      "error": {
        "message": "データがありません"
      }
    };
  }

  // ショートカットにメッセージを返す
  output.setContent(JSON.stringify(result));
  return output;
}

function addLog(address, geoData) {
  var spreadsheetId = "15F67qgA8o3QQ-UygT-kZLwmwCQsOP3BKBTIoqBvw9Co";
  var sheetName = "now";
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);

  // 列幅設定
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 350);

  // 今日の日付
  var today = new Date();

  // A1 に日付、B1 に住所、C1 に緯度、D1 に経度を上書き
  sheet.getRange("A2").setValue(today);
  sheet.getRange("B2").setValue(address); // 住所をB2に記録
  sheet.getRange("C2").setValue(geoData.lat);  // 緯度をC2に
  sheet.getRange("D2").setValue(geoData.lng);  // 経度をD2に

  // 左揃え
  sheet.getRange("A2:B2").setHorizontalAlignment("left");
  sheet.getRange("C2:D2").setHorizontalAlignment("left");
}

function updateGeocodeFromSheetAddress() {
  var spreadsheetId = "1LZ2nYxsLn6dy4btO2ipkWnoQb3tg6giLnFJQ7nfQnPI";
  var sheetName = "addresses";
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);
  var address = sheet.getRange("B2").getValue();
  var geoData = geocodeWithOpenCage(address);

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 350);

  sheet.getRange("C2").setValue(geoData.lat);
  sheet.getRange("D2").setValue(geoData.lng);
  sheet.getRange("C2:D2").setHorizontalAlignment("left");
}


// OpenCage APIで住所から緯度経度を取得
function geocodeWithOpenCage(address) {
  var OPENCAGE_API_KEY = 'a5bafceb45584da8a536bcf25847f841';  // OpenCage APIキー

  try {
    const encoded = encodeURIComponent(address);
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encoded}&key=${OPENCAGE_API_KEY}&language=ja`;

    const res = UrlFetchApp.fetch(url);
    const json = JSON.parse(res.getContentText());

    if (json.results.length > 0) {
      const loc = json.results[0].geometry;
      return { lat: loc.lat, lng: loc.lng };
    } else {
      return { lat: null, lng: null };
    }
  } catch (err) {
    Logger.log('ジオコードエラー: ' + err);
    return { lat: null, lng: null };
  }
}
