import{R as u}from"./react-stuff-BXf_FtOc.js";const S=e=>{let t;const n=new Set,o=(s,i)=>{const c=typeof s=="function"?s(t):s;if(!Object.is(c,t)){const l=t;t=i??(typeof c!="object"||c===null)?c:Object.assign({},t,c),n.forEach(g=>g(t,l))}},a=()=>t,r={setState:o,getState:a,getInitialState:()=>b,subscribe:s=>(n.add(s),()=>n.delete(s))},b=t=e(o,a,r);return r},f=e=>e?S(e):S,d=e=>e;function I(e,t=d){const n=u.useSyncExternalStore(e.subscribe,()=>t(e.getState()),()=>t(e.getInitialState()));return u.useDebugValue(n),n}const j=e=>{const t=f(e),n=o=>I(t,o);return Object.assign(n,t),n},x=e=>j;export{x as c};
