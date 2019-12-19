function snap(num, granularity = 1){
  if(granularity === 0){
    return num;
  }
  return Math.round(num/granularity)*granularity;
}
export default snap;