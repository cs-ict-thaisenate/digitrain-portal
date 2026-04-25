// ============================================================
// DigiTrain Frontend — config.js
// แก้ไข GAS_URL หลัง deploy GAS Web App
// ============================================================

const DigiTrain = {
  // ← วาง Google Apps Script Web App URL ที่นี่
  GAS_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  // ตั้งค่า UI ที่โหลดจาก Config sheet ของ GAS
  config: {
    project_name: 'DigiTrain',
    org_name: '',
    hero_title: '',
    hero_subtitle: '',
    footer_text: ''
  }
};
