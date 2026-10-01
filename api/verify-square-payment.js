export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','https://marinade-dhaba.github.io');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const paymentId=String(req.query.paymentId||'');
  const orderId=String(req.query.orderId||'');
  if(!orderId)return res.status(400).json({paid:false});
  try{
    const headers={'Square-Version':'2026-09-16','Authorization':'Bearer '+process.env.SQUARE_ACCESS_TOKEN};
    if(paymentId){
      const r=await fetch('https://connect.squareup.com/v2/payments/'+encodeURIComponent(paymentId),{headers});
      const d=await r.json();
      const p=d.payment||{};
      if(r.ok && p.status==='COMPLETED'){
        if(String(p.note||'').includes(orderId)) return res.status(200).json({paid:true});
        if(p.order_id){
          const or=await fetch('https://connect.squareup.com/v2/orders/'+encodeURIComponent(p.order_id),{headers});
          const od=await or.json();
          if(or.ok && od.order?.reference_id===orderId)return res.status(200).json({paid:true});
        }
      }
    }
    const sr=await fetch('https://connect.squareup.com/v2/orders/search',{
      method:'POST',headers:{...headers,'Content-Type':'application/json'},
      body:JSON.stringify({location_ids:['L4SG1MSWP5BBC'],query:{filter:{source_filter:{source_names:['Square Online']}}},limit:100})
    });
    const sd=await sr.json();
    const order=(sd.orders||[]).find(o=>o.reference_id===orderId);
    if(order){
      const pr=await fetch('https://connect.squareup.com/v2/payments?order_id='+encodeURIComponent(order.id),{headers});
      const pd=await pr.json();
      if(pr.ok && (pd.payments||[]).some(p=>p.status==='COMPLETED'))return res.status(200).json({paid:true});
    }
    return res.status(200).json({paid:false});
  }catch(e){return res.status(200).json({paid:false})}
}