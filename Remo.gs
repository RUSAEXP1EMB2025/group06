function getNatureRemoData(endpoint) {
  const REMO_ACCESS_TOKEN = "ory_at_s60yXjGUHBV7VI4ymyvTm_0Fa_P__IRhufrCgxTwgIc.sAOm_OVvZb6Y-BAPEm1UASXWd7AkVuoOaFt6rJSfm_0"
  const headers = {
    "Content-Type" : "application/json;",
    'Authorization': 'Bearer ' + REMO_ACCESS_TOKEN,
  };

  const options = {
    "method" : "get",
    "headers" : headers,
  };

  return JSON.parse(UrlFetchApp.fetch("https://api.nature.global/1/" + endpoint, options));
}