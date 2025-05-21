function checkAndRecordSensorData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('now');
  const currentStatus = sheet.getRange("E2").getValue();

  const scriptProperties = PropertiesService.getScriptProperties();
  const lastStatus = scriptProperties.getProperty("lastStatus");

  if (currentStatus === "IN" && lastStatus !== "IN") {
    // OUT→INの変化を検出
    recordSensorData();
  }

  // 今回の状態を保存（次回比較用）
  scriptProperties.setProperty("lastStatus", currentStatus);
}

function recordSensorData() {
  const deviceData = getNatureRemoData("devices");　　　　//data取得
  const lastSensorData = getLastData("sensor");　　　　　//最終data取得

  var arg = {
    te:deviceData[0].newest_events.te.val,　　//温度
    hu:deviceData[0].newest_events.hu.val,　　//湿度
    il:deviceData[0].newest_events.il.val,　　//照度
  }

  setSensorData(arg);
}

function setSensorData(data) {
  getSheet('sensor').getRange(2,1, 1, 4).setValues([[new Date(), data.te, data.hu, data.il]])
}
