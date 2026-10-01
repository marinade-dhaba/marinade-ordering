export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','https://marinade-dhaba.github.io');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {orderId,subtotal}=req.body||{};
    const sub=Number(subtotal);
    if(!orderId||!Number.isFinite(sub)||sub<=0) return res.status(400).json({error:'Invalid order'});
    const tax=Math.round(sub*0.1055*100)/100;
    const total=Math.round((sub+tax)*100);
    const r=await fetch('https://connect.squareup.com/v2/online-checkout/payment-links',{
      method:'POST',
      headers:{'Square-Version':'2026-01-22','Authorization':'Bearer '+process.env.SQUARE_ACCESS_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify({idempotency_key:orderId+'-'+Date.now(),quick_pay:{name:'Marinade Pre-Order '+orderId,price_money:{amount:total,currency:'USD'},location_id:'L4SG1MSWP5BBC'},checkout_options:{redirect_url:'https://marinade-dhaba.github.io/marinade-ordering/?paid=square&order='+encodeURIComponent(orderId)},payment_note:'Marinade '+orderId+' | Includes Seattle sales tax 10.55%'})
    });
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:'Square checkout could not be created',details:data.errors});
    return res.status(200).json({url:data.payment_link?.url,tax,total:total/100});
  }catch(e){return res.status(500).json({error:'Checkout error'});}
}