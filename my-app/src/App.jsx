// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import QrReaderPage from "./QrReaderPage";
import SubmitForm from "./SubmitForm";
import QrCodeDisplay from "./QrCodeDisplay"; 
import PageList from "./PageList";
import DescentForm from "./DescentForm";
import IPFSUploadForm from "./IPFSUploadForm";
import SummitQRCode from "./SummitQRCode";
import SummitForm from "./SummitForm";
import ContractTestPage from './ContractTestPage.jsx';
import AllContractMessagesPage from "./AllContractMessagesPage";
import ClimbingInfoViewer from './ClimbingInfoViewer';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PageList />} />
      <Route path="/qr-reader" element={<QrReaderPage />} />
      <Route path="/submit-form" element={<SubmitForm />} />
      <Route path="/qr-display" element={<QrCodeDisplay />} /> 
      <Route path="/descent-form" element={<DescentForm />} /> 
      <Route path="/ipfs-upload" element={<IPFSUploadForm />} />
      <Route path="/summit-qr" element={<SummitQRCode walletAddress="ユーザーのアドレス" mountain="蓼科山" />} />
      <Route path="/summit-form" element={<SummitForm />} />
      <Route path="/contract-test" element={<ContractTestPage />} /> {/* コントラクトのテストページ */}
      <Route path="/all-contract-messages" element={<AllContractMessagesPage />} />
      <Route path="/ClimbingInfoViewer" element={<ClimbingInfoViewer />} />
    </Routes>
  );
}

export default App;
