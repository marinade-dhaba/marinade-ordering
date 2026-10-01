const MENU=[
{name:'Combo 1 — Chicken Sheekh Kabab',price:20},
{name:'Combo 2 — Goat Shami Kabab',price:25},
{name:'Chicken Sheekh Kababs',price:10},
{name:'Goat Shami Kababs',price:12},
{name:'Chicken Puffs',price:8},
{name:'Paneer Puffs',price:8},
{name:"Nolen Gur'er Panna Cotta",price:3},
{name:'Kheer Kodombo',price:3}
];
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','https://marinade-dhaba.github.io');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {orderId,items}=req.body||{};
    if(!orderId||!Array.isArray(items)) return res.status(400).json({error:'Invalid order'});
    const line_items=[];
    items.forEach((q,i)=>{q=Number(q);if(Number.isInteger(q)&&q>0&&q<=99&&MENU[i])line_items.push({name:MENU[i].name,quantity:String(q),base_price_money:{amount:MENU[i].price*100,currency:'USD'}})});
    if(!line_items.length) return res.status(400).json({error:'Empty order'});
    const body={
      idempotency_key:orderId+'-'+Date.now(),
      order:{
        location_id:'L4SG1MSWP5BBC',
        reference_id:orderId,
        line_items,
        taxes:[{name:'Seattle sales tax',percentage:'10.55',scope:'ORDER'}]
      },
      checkout_options:{
        allow_tipping:true,
        redirect_url:'https://marinade-dhaba.github.io/marinade-ordering/?square_return=1&marinade_order='+encodeURIComponent(orderId)
      },
      payment_note:'Marinade Order '+orderId
    };
    const r=await fetch('https://connect.squareup.com/v2/online-checkout/payment-links',{
      method:'POST',
      headers:{'Square-Version':'2026-09-16','Authorization':'Bearer '+process.env.SQUARE_ACCESS_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:'Square checkout could not be created',details:data.errors});
    return res.status(200).json({url:data.payment_link?.url});
  }catch(e){return res.status(500).json({error:'Checkout error'});}
}