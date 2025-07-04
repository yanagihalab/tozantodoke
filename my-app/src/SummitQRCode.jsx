import React, { useState, useEffect } from "react";
import QRCode from "qrcode.react";

function SummitQRCode({ walletAddress, mountain }) {
  const [summitInfo, setSummitInfo] = useState({});

  useEffect(() => {
    const summitTime = new Date().toISOString();

    setSummitInfo({
      walletAddress,
      mountain,
      summitTime,
    });
  }, [walletAddress, mountain]);

  return (
    <div>
      <h2>登頂QRコード</h2>
      <QRCode value={JSON.stringify(summitInfo)} size={256} />
      <pre>{JSON.stringify(summitInfo, null, 2)}</pre>
    </div>
  );
}

export default SummitQRCode;
