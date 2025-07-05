import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';

const mountains = [
  "北横岳", "双子山", "大岳", "雨池山", "縞枯山", "茶臼山",
  "丸山", "中山", "稲子岳", "天狗岳", "根石岳", "峰の松目", "硫黄岳",
  "横岳", "八ヶ岳", "阿弥陀岳", "赤岳", "西岳", "権現岳", "編笠山"
];

function roundDateToNearest10MinutesJST(date) {
  const jstTime = new Date(date.getTime() + (9 * 60 + date.getTimezoneOffset()) * 60000);
  jstTime.setMinutes(Math.floor(jstTime.getMinutes() / 10) * 10, 0, 0);
  return jstTime.toISOString().slice(0, 16);
}

function QrCodeDisplay() {
  const [mountainIndex, setMountainIndex] = useState(0);
  const [qrCodeData, setQrCodeData] = useState(null);

  useEffect(() => {
    const updateQrData = () => {
      setMountainIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % mountains.length;
        
        const currentMountain = mountains[newIndex];
        const startDate = roundDateToNearest10MinutesJST(new Date());

        setQrCodeData({
          mountainLocation: currentMountain,
          startDate: startDate,
          depositAmount: "100",
          depositDenom: "utrn"
        });

        return newIndex;
      });
    };

    updateQrData();

    const intervalId = setInterval(updateQrData, 60000); // ← ここを1分（60000ms）に変更

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <h1>疑似的な登山届QRコード表示ページ（1分間隔）</h1>
      {qrCodeData ? (
        <>
          <QRCode value={JSON.stringify(qrCodeData)} size={256} />
          <pre>{JSON.stringify(qrCodeData, null, 2)}</pre>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default QrCodeDisplay;
