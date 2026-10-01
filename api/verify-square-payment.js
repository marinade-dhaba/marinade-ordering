export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','https://marinade-dhaba.github.io');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const paymentId=String(req.query.paymentId||'');
  const orderId=String(req.query.orderId||'');
  if(!paymentId||!orderId)return res.status(400).json({paid:false});
  try{
    const r=await fetch('https://connect.squareup.com/v2/payments/'+encodeURIComponent(paymentId),{headers:{'Square-Version':'2026-09-16','Authorization':'Bearer '+process.env.SQUARE_ACCESS_TOKEN}});
    const d=await r.json();
    if(!r.ok)return res.status(200).json({paid:false});
    const p=d.payment||{};
    const note=String(p.note||'');
    const paid=p.status==='COMPLETED' && note.includes(orderId);
    return res.status(200).json({paid});
  }catch(e){return res.status(200).json({paid:false})}
}