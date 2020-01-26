//      
import React, { useState, useEffect } from 'react';
import RelativeTimeFormat from "relative-time-format"
import en from "relative-time-format/locale/en.json"
RelativeTimeFormat.addLocale(en)
import { useMakeClassInstance } from '../../hooks';
import { formatRelativeTime } from '../../utils';
const Sync = ({
  //what user wants to run when sync
  onSync,
  //whether to sync initially (e.g. on mount)
  syncInitially,
  //whether sync starts turned on
  syncEnabledInitially,
  // seconds to wait before triggering the onSync function
  secondsPerSync,
  //milliseconds since last sync (or if a string, render that)
  prevSyncTime = "Never",
}   
                   
                         
                                
                                
                         
 ) => {
  const [syncEnabled, setSyncEnabled] = useState(syncEnabledInitially);
  //an array in case a race condition causes multiple intervals to be set
  //and therefore ensure all intervals are able to be cleared
  const [syncIntervalIds, setSyncIntervalIds] = useState([]);
  
  const rtf = useMakeClassInstance(RelativeTimeFormat, ["en", {
      localeMatcher: "best fit", // other values: "lookup"
      numeric: "always", // other values: "always"
      style: "long", // other values: "short" or "narrow"
  }]);

  useEffect(() => {
    if (syncInitially) {
      onSync();
    }
  }, []);
  return (
    <div>
      <button
        onClick={() => {
          setSyncEnabled(syncEnabled => {
            if (!syncEnabled) {
              //set sync interval
              //initial sync call
              onSync();
              const syncIntervalId = setInterval(() => {
                onSync();
              }, secondsPerSync * 1000);
              setSyncIntervalIds(ids => [...ids, syncIntervalId]);
            } else {
              //clear sync interval
              setSyncIntervalIds(ids => {
                ids.forEach(id => clearInterval(id));
                return [];
              });
            }
            return !syncEnabled;
          });
        }}
      >
        {syncEnabled ? "Disable sync" : "Enable sync"}
      </button>
      {syncEnabled && (
        <p>Warning: sync is enabled. This will cost money if left running.</p>
      )}
      <p>Last sync: {typeof prevSyncTime == 'string' ? prevSyncTime : formatRelativeTime(rtf, prevSyncTime)}</p>
    </div>
  );
};
export default Sync;