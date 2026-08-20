(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.LMSequencePriority=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clampCount=(value)=>Math.max(0,Math.floor(Number(value)||0));

  function startupIndices(frameCount,startupCount){
    const count=Math.min(clampCount(frameCount),clampCount(startupCount));
    return Array.from({length:count},(_,index)=>index);
  }

  function rollingIndices(frameCount,current,ahead,behind){
    const count=clampCount(frameCount);
    if(!count) return [];
    const center=Math.min(count-1,Math.max(0,Math.floor(Number(current)||0)));
    const result=[center];
    for(let offset=1;offset<=clampCount(ahead)&&center+offset<count;offset++) result.push(center+offset);
    for(let offset=1;offset<=clampCount(behind)&&center-offset>=0;offset++) result.push(center-offset);
    return result;
  }

  function bufferedAhead(loaded,current,limit){
    const max=clampCount(limit),start=Math.max(0,Math.floor(Number(current)||0));
    let count=0;
    for(let index=start+1;index<(loaded||[]).length&&count<max;index++){
      if(!loaded[index]) break;
      count++;
    }
    return count;
  }

  function playbackScale(ahead,target,minScale){
    const wanted=Math.max(1,Number(target)||1);
    const floor=Math.min(1,Math.max(0,Number(minScale)||0));
    const ratio=Math.min(1,Math.max(0,(Number(ahead)||0)/wanted));
    return floor+(1-floor)*ratio;
  }

  function previewWorkerLimit(startupReady){
    return startupReady?3:6;
  }

  function shouldRepaint(beforeIndex,beforeImage,afterIndex,afterImage){
    return beforeIndex!==afterIndex||beforeImage!==afterImage;
  }

  class SequencePriorityQueue{
    constructor(frameCount){
      this.frameCount=clampCount(frameCount);
      this._pending=new Map();
      this._loading=new Set();
      this._done=new Set();
      this._order=0;
    }
    add(indices,priority){
      const rank=Number.isFinite(priority)?priority:100;
      for(const raw of indices||[]){
        const index=Math.floor(Number(raw));
        if(index<0||index>=this.frameCount||this._done.has(index)||this._loading.has(index)) continue;
        const existing=this._pending.get(index);
        if(existing){ existing.priority=Math.min(existing.priority,rank); }
        else this._pending.set(index,{priority:rank,order:this._order++});
      }
    }
    next(){
      let selected=null,meta=null;
      for(const [index,item] of this._pending){
        if(!meta||item.priority<meta.priority||(item.priority===meta.priority&&item.order<meta.order)){
          selected=index;meta=item;
        }
      }
      if(selected==null) return null;
      this._pending.delete(selected);
      this._loading.add(selected);
      return selected;
    }
    complete(index){
      this._loading.delete(index);
      this._done.add(index);
    }
    retry(index,priority){
      this._loading.delete(index);
      this.add([index],priority);
    }
    get completed(){ return this._done.size; }
  }

  return {SequencePriorityQueue,startupIndices,rollingIndices,bufferedAhead,playbackScale,previewWorkerLimit,shouldRepaint};
});
