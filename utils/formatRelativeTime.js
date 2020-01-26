//      

const formatRelativeTime = (rtf                      , prevSyncTimeMs        ) => {
  let diffInSeconds = ((prevSyncTimeMs - Date.now())/1000);
  const absDiff = Math.abs(diffInSeconds);
  let outputDiff = Math.ceil(diffInSeconds);
  let outputFormat;
  if(absDiff < 1){
    //sub second
    outputDiff = diffInSeconds;
  }
  if(absDiff < 60){
    outputFormat = 'second';
  } else if(absDiff < 60*60){
    outputFormat = 'minute';
    outputDiff = Math.ceil(outputDiff/60);
  } else if(absDiff < 60*60*24){
    outputFormat = 'hour';
    outputDiff = Math.ceil(outputDiff/(60*60));
  } else {
    outputFormat = 'day';
    outputDiff = Math.ceil(outputDiff/(60*60*24));
  }
  return rtf.format(outputDiff, outputFormat);
}
export default formatRelativeTime;