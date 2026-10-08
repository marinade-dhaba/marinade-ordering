const SCRIPT_URL='https://script.google.com/macros/s/AKfycbyhCeAzbcu6ONR6_CKbpWkndPTsx9uwrlzWtgFVTL1CJNk36Pwn-3TPzUbh2U4qsbRz/exec';
export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','https://marinade-dhaba.github.io');
 res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
 res.setHeader('Access-Control-Allow-Headers','Content-Type');
 res.setHeader('Cache-Control','no-store');
 if(req.method==='OPTIONS')return res.status(204).end();
 if(!['GET','POST'].includes(req.method))return res.status(405).json({success:false,error:'Method not allowed'});
 try{
  const options={method:req.method,redirect:'follow'};
  if(req.method==='POST'){
   const d=req.body||{};
   if(d.action||!d.name||!d.phone||!d.email||!d.order||!d.total||!d.payment||!d.notes||!['Zelle','Venmo','Square'].includes(d.payment))return res.status(400).json({success:false,error:'Invalid order'});
   options.headers={'Content-Type':'text/plain;charset=utf-8'};
   options.body=JSON.stringify({name:d.name,phone:d.phone,email:d.email,order:d.order,total:d.total,payment:d.payment,notes:d.notes});
  }
  const response=await fetch(SCRIPT_URL,options);
  const data=await response.json();
  if(!response.ok||data.success!==true)return res.status(409).json({success:false,error:data.error||'Order unavailable',inventory:data.inventory});
  return res.status(200).json(data);
 }catch(e){return res.status(503).json({success:false,error:'Order service temporarily unavailable'});}
}