const REMO_API_KEY = "ory_at_s60yXjGUHBV7VI4ymyvTm_0Fa_P__IRhufrCgxTwgIc.sAOm_OVvZb6Y-BAPEm1UASXWd7AkVuoOaFt6rJSfm_0";
const LINE_ACCESS_TOKEN = "zBlK5kMpMn11oek0AQImDmp+oxV/TAWsawxoAcwJUqdKZ9htPUMiYV9R20Vrn/BwtfbwRVfSk696MTdujoC7q2KknUFnRZPQ5ARY8e5YVfkG3Hl/CRBZ1hE6+1ZQZ5ZANNEUBEd7Uvg8xmGUn12oOQdB04t89/1O/w1cDnyilFU=";
const OPENCAGE_API_KEY = 'a5bafceb45584da8a536bcf25847f841';

const USER_IDS = [
  "U64be24bf9ba695fc9b815fbd2ab54aff"
];

function testNotifyAll() {
  const testMessage = "テスト通知：Push送信テストです。";
  Logger.log("テストメッセージ内容: " + testMessage);
  notifyAllUsers(testMessage);
}

function autoControlFromSheet() {
  const nowSheet = SpreadsheetApp.openById("15F67qgA8o3QQ-UygT-kZLwmwCQsOP3BKBTIoqBvw9Co").getSheetByName("now");
  const currentStatus = nowSheet.getRange(2, 5).getValue().toString().trim();

  const sensorSheet = SpreadsheetApp.openById("15F67qgA8o3QQ-UygT-kZLwmwCQsOP3BKBTIoqBvw9Co").getSheetByName("sensor");
  const lastRow = sensorSheet.getLastRow();
  const temperature = sensorSheet.getRange(lastRow, 2).getValue();
  const humidity = sensorSheet.getRange(lastRow, 3).getValue();

  const props = PropertiesService.getScriptProperties();
  const previousStatus = props.getProperty("PREVIOUS_INOUT");

  Logger.log("前回の状態: " + previousStatus + " / 今回の状態: " + currentStatus);

  if (currentStatus !== previousStatus) {
    if (currentStatus === "IN") {
      const message = `現在地が2km以内に入りました。\nエアコンを操作しますか？\n温度：${temperature}℃　湿度：${humidity}%`;
      notifyAllUsers(message);
    } else if (currentStatus === "OUT") {
      const isOn = checkAirconIsOn();
      if (isOn) {
        const message = `現在地が2km以上離れました。\nエアコンがONのままです。OFFにしますか？\n温度：${temperature}℃　湿度：${humidity}%`;
        notifyAllUsers(message);
      } else {
        Logger.log("OUTですが、エアコンはすでにOFFです。通知しません。");
      }
    } else {
      Logger.log("不明な状態: " + currentStatus);
    }
    props.setProperty("PREVIOUS_INOUT", currentStatus);
  } else {
    Logger.log("状態に変化なし。通知・操作なし。");
  }
}

function controlAircon(action, mode = null, temp = null) {
  const url = "https://api.nature.global/1/appliances";
  const headers = { Authorization: `Bearer ${REMO_API_KEY}` };

  const response = UrlFetchApp.fetch(url, { method: "get", headers: headers });
  const appliances = JSON.parse(response.getContentText());
  const aircon = appliances.find(appliance => appliance.type === "AC");
  if (!aircon) throw new Error("エアコンが見つかりません");

  const controlUrl = `https://api.nature.global/1/appliances/${aircon.id}/aircon_settings`;
  const payload = {};

  if (action === "on") {
    payload.button = "on";
  } else if (action === "off") {
    payload.button = "power_off";
    payload.operation_mode = "stop";
  }

  if (mode) payload.operation_mode = mode;
  if (temp) payload.temp = temp.toString();

  UrlFetchApp.fetch(controlUrl, {
    method: "post",
    headers: headers,
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}

function sendLineMessage(replyToken, message) {
  const url = "https://api.line.me/v2/bot/message/reply";
  const headers = {
    Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
    "Content-Type": "application/json"
  };

  const payload = {
    replyToken: replyToken,
    messages: [{ type: "text", text: message }]
  };

  UrlFetchApp.fetch(url, {
    method: "post",
    headers: headers,
    payload: JSON.stringify(payload)
  });
}

function notifyAllUsers(message) {
  if (!message || message.trim() === "") {
    Logger.log("通知メッセージが空のため送信しません");
    return;
  }

  const url = "https://api.line.me/v2/bot/message/push";
  const headers = {
    Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
    "Content-Type": "application/json"
  };

  USER_IDS.forEach(userId => {
    const payload = {
      to: userId,
      messages: [{ type: "text", text: message }]
    };

    try {
      const res = UrlFetchApp.fetch(url, {
        method: "post",
        headers: headers,
        payload: JSON.stringify(payload)
      });
      Logger.log("送信先: " + userId + " / レスポンス: " + res.getContentText());
    } catch (err) {
      Logger.log("通知エラー（" + userId + "）: " + err.message);
    }
  });
}

function notifyAllUsersExcept(excludeUserId, message) {
  const url = "https://api.line.me/v2/bot/message/push";
  const headers = {
    Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
    "Content-Type": "application/json"
  };

  USER_IDS.forEach(userId => {
    if (userId === excludeUserId) return;

    const payload = {
      to: userId,
      messages: [{ type: "text", text: message }]
    };

    UrlFetchApp.fetch(url, {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload)
    });
  });
}

function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];
  const replyToken = event.replyToken;
  const userMessage = event.message.text.toLowerCase();
  const userId = event.source.userId;

  const addressMatch = userMessage.match(/^住所[:：](.+)$/);
  if (addressMatch) {
    const address = addressMatch[1].trim();
    registerAddress(userId, address);
    sendLineMessage(replyToken, "住所を登録しました！");
    return ContentService.createTextOutput("OK");
  }

  const tempMatch = userMessage.match(/温度(\d+)℃/);
  let temp = tempMatch ? parseInt(tempMatch[1], 10) : null;

  let mode = null;
  if (userMessage.includes("冷房")) mode = "cool";
  else if (userMessage.includes("暖房")) mode = "warm";
  else if (userMessage.includes("除湿")) mode = "dry";

  if (userMessage === "エアコンオン") {
    controlAircon("on", mode, temp);
    const msg = `エアコンがONになりました（モード: ${mode || "デフォルト"}, 温度: ${temp || "デフォルト"}℃）`;
    sendLineMessage(replyToken, msg);
    notifyAllUsersExcept(userId, msg);

  } else if (userMessage === "エアコンオフ") {
    controlAircon("off");
    const msg = "エアコンがOFFになりました";
    sendLineMessage(replyToken, msg);
    notifyAllUsersExcept(userId, msg);

  } else if (mode || temp) {
    controlAircon("on", mode, temp);
    const msg = `エアコンの設定を変更しました（モード: ${mode || "変更なし"}, 温度: ${temp || "変更なし"}℃）`;
    sendLineMessage(replyToken, msg);
    notifyAllUsersExcept(userId, msg);

  } else {
    const helpMsg = "以下のいずれかを送信してください：\n・エアコンオン / エアコンオフ\n・冷房 / 暖房 / 除湿\n・温度XX℃\n・住所:〇〇県〇〇市〜";
    sendLineMessage(replyToken, helpMsg);
  }

  return ContentService.createTextOutput("OK");
}

function registerAddress(userId, address) {
  const sheet = SpreadsheetApp.openById("1LZ2nYxsLn6dy4btO2ipkWnoQb3tg6giLnFJQ7nfQnPI").getSheetByName("addresses");
  const cleanedUserId = userId.trim();
  const userIdList = sheet.getRange("A2:A" + sheet.getLastRow()).getValues();
  let found = false;

  const geoData = geocodeWithOpenCage(address); // OpenCageで緯度経度取得

  for (let i = 0; i < userIdList.length; i++) {
    const id = (userIdList[i][0] || "").toString().trim();
    if (id === cleanedUserId) {
      sheet.getRange(i + 2, 2).setValue(address);       // 住所
      sheet.getRange(i + 2, 3).setValue(geoData.lat);   // 緯度
      sheet.getRange(i + 2, 4).setValue(geoData.lng);   // 経度
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([cleanedUserId, address, geoData.lat, geoData.lng]);
  }
}

function checkAirconIsOn() {
  const url = "https://api.nature.global/1/appliances";
  const headers = { Authorization: `Bearer ${REMO_API_KEY}` };

  try {
    const response = UrlFetchApp.fetch(url, { method: "get", headers: headers });
    const appliances = JSON.parse(response.getContentText());

    const aircon = appliances.find(appliance => appliance.type === "AC");
    if (!aircon) throw new Error("エアコンが見つかりません");

    const mode = aircon.settings.operation_mode;
    const button = aircon.settings.button;

    Logger.log("現在のエアコン設定: モード=" + mode + " / ボタン=" + button);

    return mode !== "stop";
  } catch (err) {
    Logger.log("エアコン状態確認エラー: " + err.message);
    return false;
  }
}

function geocodeWithOpenCage(address) {
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encoded}&key=${OPENCAGE_API_KEY}&language=ja`;
    const res = UrlFetchApp.fetch(url);
    const json = JSON.parse(res.getContentText());

    if (json.results.length > 0) {
      const loc = json.results[0].geometry;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch (err) {
    Logger.log('ジオコードエラー: ' + err);
  }
  return { lat: null, lng: null };
}
