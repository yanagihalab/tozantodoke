import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react'; 

const mountains = [
  "北横岳", "双子山", "大岳", "雨池山", "縞枯山", "茶臼山",
  "丸山", "中山", "稲子岳", "天狗岳", "根石岳", "峰の松目", "硫黄岳",
  "横岳", "八ヶ岳", "阿弥陀岳", "赤岳", "西岳", "権現岳", "編笠山"
];
// "蓼科山",
function roundDateToNearest10MinutesJST(date) {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  jstDate.setMinutes(Math.floor(jstDate.getMinutes() / 10) * 10, 0, 0);
  return jstDate;
}

function QrCodeDisplay() {
  const [mountainIndex, setMountainIndex] = useState(0);
  const [qrCodeData, setQrCodeData] = useState(null);

  useEffect(() => {
    const updateQrData = () => {
      setMountainIndex(prev => (prev + 1) % mountains.length);

      const currentMountain = mountains[mountainIndex];
      const startDate = roundDateToNearest10MinutesJST(new Date()).toISOString().slice(0, 16);

      setQrCodeData({
        mountainLocation: currentMountain,
        startDate: startDate,
        depositAmount: "100",
        depositDenom: "utrn"
      });
    };

    updateQrData();

    const intervalId = setInterval(updateQrData, 300000); // 5分ごと

    return () => clearInterval(intervalId);
    // mountainIndexは依存配列から除外
  }, []);

  return (
    <div>
      <h1>疑似的な登山届QRコード表示ページ</h1>
      {qrCodeData && <QRCode value={JSON.stringify(qrCodeData)} size={256} />}
      <pre>{qrCodeData ? JSON.stringify(qrCodeData, null, 2) : 'Loading...'}</pre>
    </div>
  );
}

export default QrCodeDisplay;
