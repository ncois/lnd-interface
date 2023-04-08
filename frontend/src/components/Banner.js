import React, { useState, useEffect } from 'react';
import '../styles/Banner.css';
import '../styles/Global.css';

function Banner({updateStatus, setUpdateStatus, isLoading, setIsLoading}) {
  const [isDetailed, setIsDetailed] = useState(false);

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = (should_update_payments) => {
    setIsLoading(true);
    fetch(`http://localhost:3001/?payments=${should_update_payments || false}`)
      .then(response => response.json())
      .then(updateStatus => setUpdateStatus(updateStatus))
      .catch(error => {
        console.error(error);
        setUpdateStatus(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const renderStatus = () => {
    if (updateStatus) {
      const isOk = Object.values(updateStatus).every(item => item.success);
      const logoClassName = isOk ? 'banner-ok-icon' : 'banner-error-icon';
      return (
        <button className={`${logoClassName}`} onClick={() => setIsDetailed(!isDetailed)}></button>
      );
    } else {
      return (
        <button className="banner-alert-icon" onClick={() => setIsDetailed(!isDetailed)}></button>
      );
    }
  };


  const renderStatusDetailed = () => {
    if (updateStatus) {
      return (
        <div>
          <button className="banner-close-icon" onClick={() => setIsDetailed(!isDetailed)}></button>
          <table>
            <tbody>
              {Object.entries(updateStatus).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    {value.success ? (
                      <span>OK</span>
                    ) : (
                      <span>Error</span>
                    )}
                  </td>
                  <td>{(new Date(value.date)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div>
          <button className="banner-close-icon" onClick={() => setIsDetailed(!isDetailed)}></button>
          <p>No status to show.</p>
        </div>
      );
    }
  };  

  return (
    <div className="banner-banner-container">
      <div>
        
        <button className={`banner-refresh-button ${isLoading ? 'banner-loading' : ''}`} onClick={() => handleRefresh(false)} disabled={isLoading}>
          {<div className={` ${isLoading ? 'banner-spinner' : 'banner-refresh-icon'}`}></div>}
        </button>

      </div>
      <div className="banner-title-container">
        <h1 className="banner-title">LND Interface ⚡️</h1>
      </div>
      <div>
        {isDetailed ? renderStatusDetailed() : renderStatus()}
      </div>
    </div>
  );
}

export default Banner;
