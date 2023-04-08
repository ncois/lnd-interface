import React, { useState } from "react"
import Banner from "./Banner"
import SideLeft from "./SideLeft"
import "../styles/Global.css"
import Channels from "./Channels"
import Invoices from "./Invoices"
import Payments from "./Payments"
import Unspents from "./Unspents"

function App() {
	document.title = "LND Interface"
	const [updateStatus, setUpdateStatus] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isPaymentLoading, setIsPaymentLoading] = useState(false);

	const [activeComponent, setActiveComponent] = useState("Channels");

	return 	(
		<div>
			<Banner updateStatus={updateStatus} setUpdateStatus={setUpdateStatus} isLoading={isLoading} setIsLoading={setIsLoading} />
				<div>
					<SideLeft updateStatus={updateStatus} activeComponent={activeComponent} setActiveComponent={setActiveComponent}/>
					<Channels updateStatus={updateStatus} activeComponent={activeComponent} />
					<Invoices updateStatus={updateStatus} activeComponent={activeComponent} />
					<Payments updateStatus={updateStatus} setUpdateStatus={setUpdateStatus} isLoading={isPaymentLoading} setIsLoading={setIsPaymentLoading} activeComponent={activeComponent} />
					<Unspents updateStatus={updateStatus} activeComponent={activeComponent} />
				</div>
		</div>
	)	
}

export default App
