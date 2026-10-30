// Pure helpers for the suspended arch. Ring 1..54 includes medallion 0.
export function ringArcPath(start, steps) {
  if(!Number.isInteger(start) || start < 1 || start > 54) throw new RangeError("Ring start must be 1..54");
  if(!Number.isInteger(steps) || steps < 1 || steps > 54) throw new RangeError("Invalid ring segment count");
  const result=[start];
  let index=start;
  for(let i=0;i<steps;i++){
    index=index===54?0:index+1;
    result.push(index);
  }
  if(result.at(-1)===0)result.push(1);
  return result;
}
export function archPoint(start,end,rise,t) {
  return {x:start.x+(end.x-start.x)*t,y:start.y+(end.y-start.y)*t+rise*Math.sin(Math.PI*t),z:0};
}
export function archLength(start,end,rise,samples=64) {
  let prev=archPoint(start,end,rise,0), length=0;
  for(let i=1;i<=samples;i++){
    const p=archPoint(start,end,rise,i/samples);
    length+=Math.hypot(p.x-prev.x,p.y-prev.y);
    prev=p;
  }
  return length;
}
export function chooseArchSteps(start,end,rise,spacing=.215) {
  return Math.max(6,Math.min(17,Math.round(archLength(start,end,rise)/spacing)));
}
