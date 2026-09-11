import fs from 'node:fs';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../functions/api/contact.js',import.meta.url),'utf8');
const {onRequestPost}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
let sends=0;globalThis.fetch=async()=>{sends++;return new Response('{}')};
for(const kind of ['enquiry','careers']){
 for(const email of ['name@.com','name@example.org','name@example.com.my','name@example..com','name@-example.com','name@@example.com','']){
  const f=new FormData();Object.entries({formType:kind,name:'Test',email,contact:'123',subject:'Test',message:'Test',salutation:'Mr',jobTitle:'Engineer'}).forEach(([k,v])=>f.set(k,v));
  if(kind==='careers')f.set('cv',new File(['test'],'cv.pdf',{type:'application/pdf'}));
  const r=await onRequestPost({request:new Request('https://example.com',{method:'POST',body:f}),env:{RESEND_API_KEY:'test',CONTACT_FROM:'test@example.com'}});
  assert.equal(r.status,400,email+' must be rejected');assert.match((await r.json()).error,/\.com email/);
 }
}
for(const contact of ['', '   ']){
 const f=new FormData();Object.entries({formType:'enquiry',name:'Test',email:'test@example.com',contact,subject:'Test',message:'Test'}).forEach(([k,v])=>f.set(k,v));
 const r=await onRequestPost({request:new Request('https://example.com',{method:'POST',body:f}),env:{RESEND_API_KEY:'test',CONTACT_FROM:'test@example.com'}});
 assert.equal(r.status,400);assert.match((await r.json()).error,/Contact No/);
}
assert.equal(sends,0,'Invalid submissions must never send mail');
console.log('PASS: both forms reject invalid/non-.com emails; enquiry rejects blank phones before sending');
