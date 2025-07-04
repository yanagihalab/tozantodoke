import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import jsQR from 'jsqr';
import { useNavigate } from 'react-router-dom';

function QrReaderPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-camera-reader', {
      fps: 10,
      qrbox: 250
    });

    scanner.render(
      (decodedText) => {
        scanner.clear();
        handleQrScanSuccess(decodedText);
      },
      (error) => {
        console.warn('Camera scan error:', error);
      }
    );

    return () => scanner.clear();
  }, []);

  const handleQrScanSuccess = (decodedText) => {
    const qrInfo = JSON.parse(decodedText);
    navigate('/submit-form', { state: { qrInfo } });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleQrScanSuccess(code.data);
        } else {
          alert('QRコードを画像から読み取れませんでした。');
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h1>QRコード読み取りページ</h1>
      <div>
        <h2>📷 カメラからQRコード読み取り</h2>
        <div id="qr-camera-reader" style={{ width: 500, height: 500 }}></div>
      </div>

      <hr />

      <div>
        <h2>🖼️ PNG画像からQRコード読み取り</h2>
        <input type="file" accept="image/png" ref={fileInputRef} onChange={handleFileChange} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

export default QrReaderPage;
