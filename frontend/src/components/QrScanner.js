import { QrReader } from "react-qr-reader"
import { useState } from "react"
import "../styles/QrScanner.css"

function QrScanner( {setData} ) {

    const [startScan, setStartScan] = useState(false)

    const handleScan = async (scanData) => {
        if (scanData && scanData !== "") {
            navigator.clipboard.writeText(scanData.text)
            setData(scanData.text)
            setStartScan(false)
        }
    }

    const handleError = (err) => {
        console.error(err);
    }

    return (
        <>
          <button type="button" className="button-qr-scanner" style={{marginBottom:"5px"}} onClick={() => {
            setStartScan(!startScan)
            }}>
            {startScan ? "Cancel" : "QR Scan"}
            </button>
            {startScan && (
            <>
            <QrReader
                delay={500}
                onError={handleError}
                onResult={handleScan}
                style={{ width: "100px" }}
            />
            </>
        )}
        </>
      )
}

export default QrScanner