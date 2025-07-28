export function setValueAtPath(obj: any, path: string, value: any){
    const keys = path.split('.');
    let cur = obj;
    keys.slice(0, -1).forEach((k) => {
        if (!(k in cur)) cur[k] ={};
        cur = cur[k];
    });
    cur[keys[keys.length - 1]] = value;
    
   
}